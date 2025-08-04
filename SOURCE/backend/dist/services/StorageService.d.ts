import { ObjectId } from 'mongodb';
import type { ScrapedContent } from '@/types/scraper.types.js';
import type { Article, EmailDigest } from '@/types/database.types.js';
export declare class StorageService {
    private client;
    private db;
    private articlesCollection;
    private emailDigestsCollection;
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    saveArticle(scrapedContent: ScrapedContent, emailInfo: {
        messageId: string;
        subject: string;
        date: Date;
    }): Promise<{
        articleId: ObjectId;
        filePath: string;
    }>;
    saveEmailDigest(emailDigest: Omit<EmailDigest, '_id'>): Promise<ObjectId>;
    updateEmailDigestWithArticles(messageId: string, articleIds: ObjectId[]): Promise<void>;
    getArticles(query?: {
        category?: string;
        keywords?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        status?: string;
        limit?: number;
        skip?: number;
    }): Promise<Article[]>;
    getArticleById(id: string | ObjectId): Promise<Article | null>;
    getEmailDigests(query?: {
        status?: string;
        dateRange?: {
            start: Date;
            end: Date;
        };
        limit?: number;
        skip?: number;
    }): Promise<EmailDigest[]>;
    getEmailDigestById(id: string | ObjectId): Promise<EmailDigest | null>;
    deleteArticle(id: string | ObjectId): Promise<boolean>;
    updateArticle(id: string | ObjectId, updates: Partial<Article>): Promise<boolean>;
    getArticleContent(id: string | ObjectId): Promise<{
        markdown: string;
        html?: string | undefined;
    } | null>;
    listArticleFiles(): Promise<Array<{
        path: string;
        size: number;
        modified: Date;
    }>>;
    getStorageStats(): Promise<{
        articles: number;
        emailDigests: number;
        totalFileSize: number;
        diskUsage: string;
    }>;
    private saveToFile;
    private createMarkdownWithMetadata;
    private ensureDirectories;
    private getAllFiles;
    private formatBytes;
}
//# sourceMappingURL=StorageService.d.ts.map