import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import type { ScrapedContent } from '@/types/scraper.types.js';
import type { Article, EmailDigest } from '@/types/database.types.js';
import { dbConfig } from '@/config/database.config.js';
import { appConfig } from '@/config/app.config.js';

export class StorageService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private articlesCollection: Collection<Article> | null = null;
  private emailDigestsCollection: Collection<EmailDigest> | null = null;

  constructor() {
    this.ensureDirectories();
  }

  async initialize(): Promise<void> {
    if (this.client) return;

    console.log('[StorageService] Connecting to MongoDB...');
    
    this.client = new MongoClient(dbConfig.uri, dbConfig.options);
    await this.client.connect();
    
    this.db = this.client.db(dbConfig.dbName);
    this.articlesCollection = this.db.collection<Article>('articles');
    this.emailDigestsCollection = this.db.collection<EmailDigest>('email_digests');

    console.log('[StorageService] MongoDB connection established');
  }

  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.articlesCollection = null;
      this.emailDigestsCollection = null;
      console.log('[StorageService] MongoDB connection closed');
    }
  }

  async saveArticle(scrapedContent: ScrapedContent, emailInfo: {
    messageId: string;
    subject: string;
    date: Date;
  }): Promise<{ articleId: ObjectId; filePath: string }> {
    await this.initialize();

    // Generate URL hash for deduplication
    const urlHash = crypto.createHash('sha256').update(scrapedContent.url).digest('hex');

    // Check if article already exists
    const existingArticle = await this.articlesCollection!.findOne({ urlHash });
    if (existingArticle) {
      console.log(`[StorageService] Article already exists: ${scrapedContent.title}`);
      return {
        articleId: existingArticle._id!,
        filePath: existingArticle.filePath
      };
    }

    // Save to file system
    const filePath = await this.saveToFile(scrapedContent, emailInfo.date);

    // Create article document
    const article: Article = {
      title: scrapedContent.title,
      url: scrapedContent.url,
      urlHash,
      content: scrapedContent.markdown,
      rawHtml: scrapedContent.rawHtml,
      
      // Metadata
      emailDate: emailInfo.date,
      scrapedAt: scrapedContent.scrapedAt,
      lastUpdated: new Date(),
      wordCount: scrapedContent.wordCount,
      readingTime: scrapedContent.readingTime,
      
      // Author
      author: scrapedContent.author || undefined,
      
      // Categorization
      keywords: scrapedContent.keywords,
      tags: [],
      category: scrapedContent.category,
      
      // Source tracking
      sourceEmail: {
        id: emailInfo.messageId,
        subject: emailInfo.subject,
        date: emailInfo.date
      },
      
      // File system
      filePath,
      
      // Status
      status: 'scraped',
      scrapeAttempts: 1
    };

    // Save to MongoDB
    const result = await this.articlesCollection!.insertOne(article);
    
    console.log(`[StorageService] Article saved: ${article.title} (ID: ${result.insertedId})`);
    
    return {
      articleId: result.insertedId,
      filePath
    };
  }

  async saveEmailDigest(emailDigest: Omit<EmailDigest, '_id'>): Promise<ObjectId> {
    await this.initialize();

    // Check if email digest already exists
    const existing = await this.emailDigestsCollection!.findOne({ 
      messageId: emailDigest.messageId 
    });
    
    if (existing) {
      console.log(`[StorageService] Email digest already exists: ${emailDigest.messageId}`);
      return existing._id!;
    }

    const result = await this.emailDigestsCollection!.insertOne(emailDigest);
    
    console.log(`[StorageService] Email digest saved: ${emailDigest.subject} (ID: ${result.insertedId})`);
    
    return result.insertedId;
  }

  async updateEmailDigestWithArticles(messageId: string, articleIds: ObjectId[]): Promise<void> {
    await this.initialize();

    await this.emailDigestsCollection!.updateOne(
      { messageId },
      { 
        $set: { 
          articles: articleIds,
          status: 'processed',
          processedAt: new Date()
        }
      }
    );

    console.log(`[StorageService] Updated email digest ${messageId} with ${articleIds.length} articles`);
  }

  async getArticles(query: {
    category?: string;
    keywords?: string[];
    dateRange?: { start: Date; end: Date };
    status?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<Article[]> {
    await this.initialize();

    const mongoQuery: any = {};

    if (query.category) {
      mongoQuery.category = query.category;
    }

    if (query.keywords && query.keywords.length > 0) {
      mongoQuery.keywords = { $in: query.keywords };
    }

    if (query.dateRange) {
      mongoQuery.emailDate = {
        $gte: query.dateRange.start,
        $lte: query.dateRange.end
      };
    }

    if (query.status) {
      mongoQuery.status = query.status;
    }

    console.log('[StorageService] MongoDB query:', JSON.stringify(mongoQuery));
    console.log('[StorageService] Database:', this.db?.databaseName);
    console.log('[StorageService] Collection:', this.articlesCollection?.collectionName);
    
    // First, let's check if we have any articles at all
    const totalCount = await this.articlesCollection!.countDocuments({});
    console.log(`[StorageService] Total articles in collection: ${totalCount}`);

    const cursor = this.articlesCollection!
      .find(mongoQuery)
      .sort({ emailDate: -1 });

    if (query.skip) {
      cursor.skip(query.skip);
    }

    if (query.limit) {
      cursor.limit(query.limit);
    }

    const articles = await cursor.toArray();
    console.log(`[StorageService] Query returned ${articles.length} articles`);
    
    return articles;
  }

  async getArticleById(id: string | ObjectId): Promise<Article | null> {
    await this.initialize();

    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await this.articlesCollection!.findOne({ _id: objectId });
  }

  async getEmailDigests(query: {
    status?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    skip?: number;
  } = {}): Promise<EmailDigest[]> {
    await this.initialize();

    const mongoQuery: any = {};

    if (query.status) {
      mongoQuery.status = query.status;
    }

    if (query.dateRange) {
      mongoQuery.date = {
        $gte: query.dateRange.start,
        $lte: query.dateRange.end
      };
    }

    const cursor = this.emailDigestsCollection!
      .find(mongoQuery)
      .sort({ date: -1 });

    if (query.skip) {
      cursor.skip(query.skip);
    }

    if (query.limit) {
      cursor.limit(query.limit);
    }

    return await cursor.toArray();
  }

  async getEmailDigestById(id: string | ObjectId): Promise<EmailDigest | null> {
    await this.initialize();

    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await this.emailDigestsCollection!.findOne({ _id: objectId });
  }

  async deleteArticle(id: string | ObjectId): Promise<boolean> {
    await this.initialize();

    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const article = await this.getArticleById(objectId);
    
    if (!article) return false;

    // Delete file
    try {
      await fs.unlink(join(appConfig.articlesPath, article.filePath));
    } catch (error) {
      console.warn(`[StorageService] Failed to delete file ${article.filePath}:`, error);
    }

    // Delete from MongoDB
    const result = await this.articlesCollection!.deleteOne({ _id: objectId });
    
    console.log(`[StorageService] Article deleted: ${article.title}`);
    
    return result.deletedCount > 0;
  }

  async updateArticle(id: string | ObjectId, updates: Partial<Article>): Promise<boolean> {
    await this.initialize();

    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const result = await this.articlesCollection!.updateOne(
      { _id: objectId },
      { 
        $set: { 
          ...updates, 
          lastUpdated: new Date() 
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[StorageService] Article updated: ${id}`);
    }

    return result.modifiedCount > 0;
  }

  async getArticleContent(id: string | ObjectId): Promise<{ markdown: string; html?: string | undefined } | null> {
    const article = await this.getArticleById(id);
    
    if (!article) return null;

    try {
      // Try to read from file first
      const filePath = join(appConfig.articlesPath, article.filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      return {
        markdown: fileContent,
        html: article.rawHtml || undefined
      };
    } catch (error) {
      // Fallback to database content
      return {
        markdown: article.content,
        html: article.rawHtml || undefined
      };
    }
  }

  async listArticleFiles(): Promise<Array<{ path: string; size: number; modified: Date }>> {
    try {
      const articlesDir = appConfig.articlesPath;
      const files = await this.getAllFiles(articlesDir);
      
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const stats = await fs.stat(file);
          return {
            path: file.replace(articlesDir + '/', ''),
            size: stats.size,
            modified: stats.mtime
          };
        })
      );

      return fileStats.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch (error) {
      console.error('[StorageService] Error listing article files:', error);
      return [];
    }
  }

  async getStorageStats(): Promise<{
    articles: number;
    emailDigests: number;
    totalFileSize: number;
    diskUsage: string;
  }> {
    await this.initialize();

    const [articleCount, digestCount, files] = await Promise.all([
      this.articlesCollection!.countDocuments(),
      this.emailDigestsCollection!.countDocuments(),
      this.listArticleFiles()
    ]);

    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
    const diskUsage = this.formatBytes(totalFileSize);

    return {
      articles: articleCount,
      emailDigests: digestCount,
      totalFileSize,
      diskUsage
    };
  }

  private async saveToFile(
    scrapedContent: ScrapedContent, 
    emailDate: Date
  ): Promise<string> {
    // Generate file path based on date and title
    const year = emailDate.getFullYear();
    const month = String(emailDate.getMonth() + 1).padStart(2, '0');
    const day = String(emailDate.getDate()).padStart(2, '0');
    
    const sanitizedTitle = scrapedContent.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
    
    const timestamp = Date.now();
    const fileName = `${sanitizedTitle}-${timestamp}.md`;
    const relativePath = `${year}/${month}/${day}/${fileName}`;
    const fullPath = join(appConfig.articlesPath, relativePath);

    // Ensure directory exists
    await fs.mkdir(dirname(fullPath), { recursive: true });

    // Create markdown content with metadata
    const markdownContent = this.createMarkdownWithMetadata(scrapedContent);

    // Write file
    await fs.writeFile(fullPath, markdownContent, 'utf-8');

    console.log(`[StorageService] File saved: ${relativePath}`);
    
    return relativePath;
  }

  private createMarkdownWithMetadata(content: ScrapedContent): string {
    const metadata = [
      '---',
      `title: "${content.title}"`,
      `url: "${content.url}"`,
      content.author?.name ? `author: "${content.author.name}"` : null,
      content.publishDate ? `published: "${content.publishDate}"` : null,
      `scraped: "${content.scrapedAt.toISOString()}"`,
      `category: "${content.category}"`,
      `word_count: ${content.wordCount}`,
      `reading_time: "${content.readingTime}"`,
      content.keywords.length > 0 ? `keywords: [${content.keywords.map(k => `"${k}"`).join(', ')}]` : null,
      '---',
      ''
    ].filter(Boolean).join('\n');

    return metadata + content.markdown;
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(appConfig.articlesPath, { recursive: true });
      await fs.mkdir(appConfig.dataPath, { recursive: true });
    } catch (error) {
      console.error('[StorageService] Error creating directories:', error);
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is not accessible
    }

    return files;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}