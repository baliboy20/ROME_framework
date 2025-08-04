import * as fs from 'fs/promises';
import * as path from 'path';
import sanitize from 'sanitize-filename';

export interface SavedFile {
  filename: string;
  filepath: string;
  size: number;
  savedAt: Date;
  url: string;
  title: string;
}

export interface FileSystemOptions {
  baseDirectory?: string;
  organizationStrategy?: 'flat' | 'by-domain' | 'by-date' | 'by-email';
  filenameFormat?: 'title' | 'url-slug' | 'timestamp-title';
  maxFilenameLength?: number;
}

export class FileSystemService {
  private readonly defaultOptions: FileSystemOptions = {
    baseDirectory: './data/scraped-articles',
    organizationStrategy: 'by-domain',
    filenameFormat: 'title',
    maxFilenameLength: 100
  };

  constructor(private options: FileSystemOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  async initialize(): Promise<void> {
    console.log('📁 [FileSystemService] Initializing file system...');
    
    // Ensure base directory exists
    await this.ensureDirectory(this.options.baseDirectory!);
    
    console.log(`✅ [FileSystemService] Base directory ready: ${this.options.baseDirectory}`);
  }

  async saveMarkdownFile(
    content: string,
    metadata: {
      url: string;
      title: string;
      domain: string;
      emailId?: string;
      date?: Date;
    }
  ): Promise<SavedFile> {
    const requestId = `SAVE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`\n💾 [FileSystemService::saveMarkdownFile] [${requestId}] Saving file for: ${metadata.title}`);

    try {
      // Generate file path based on organization strategy
      const directory = await this.getTargetDirectory(metadata);
      await this.ensureDirectory(directory);

      // Generate filename
      const filename = this.generateFilename(metadata);
      const filepath = path.join(directory, filename);

      // Check if file already exists
      const exists = await this.fileExists(filepath);
      if (exists) {
        console.log(`⚠️  [FileSystemService::saveMarkdownFile] [${requestId}] File already exists, adding timestamp`);
        const timestamp = Date.now();
        const nameWithoutExt = filename.replace(/\.md$/, '');
        const newFilename = `${nameWithoutExt}-${timestamp}.md`;
        const newFilepath = path.join(directory, newFilename);
        
        await fs.writeFile(newFilepath, content, 'utf-8');
        const stats = await fs.stat(newFilepath);

        const result: SavedFile = {
          filename: newFilename,
          filepath: newFilepath,
          size: stats.size,
          savedAt: new Date(),
          url: metadata.url,
          title: metadata.title
        };

        console.log(`✅ [FileSystemService::saveMarkdownFile] [${requestId}] File saved:`, {
          filename: result.filename,
          size: `${(result.size / 1024).toFixed(2)} KB`,
          path: result.filepath
        });

        return result;
      }

      // Save the file
      await fs.writeFile(filepath, content, 'utf-8');
      const stats = await fs.stat(filepath);

      const result: SavedFile = {
        filename,
        filepath,
        size: stats.size,
        savedAt: new Date(),
        url: metadata.url,
        title: metadata.title
      };

      console.log(`✅ [FileSystemService::saveMarkdownFile] [${requestId}] File saved:`, {
        filename: result.filename,
        size: `${(result.size / 1024).toFixed(2)} KB`,
        path: result.filepath
      });

      return result;

    } catch (error: any) {
      console.error(`❌ [FileSystemService::saveMarkdownFile] [${requestId}] Failed to save file:`, error);
      throw new Error(`Failed to save markdown file: ${error.message}`);
    }
  }

  async saveMultipleFiles(
    files: Array<{
      content: string;
      metadata: {
        url: string;
        title: string;
        domain: string;
        emailId?: string;
        date?: Date;
      };
    }>
  ): Promise<SavedFile[]> {
    console.log(`\n📦 [FileSystemService::saveMultipleFiles] Saving ${files.length} files...`);
    
    const results: SavedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      
      const { content, metadata } = file;
      console.log(`\n📄 [FileSystemService::saveMultipleFiles] Processing ${i + 1}/${files.length}: ${metadata.title}`);
      
      try {
        const result = await this.saveMarkdownFile(content, metadata);
        results.push(result);
      } catch (error: any) {
        console.error(`❌ [FileSystemService::saveMultipleFiles] Failed to save file ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ [FileSystemService::saveMultipleFiles] Batch save completed:`, {
      total: files.length,
      successful: results.length,
      failed: files.length - results.length
    });

    return results;
  }

  private async getTargetDirectory(metadata: {
    domain: string;
    emailId?: string;
    date?: Date;
  }): Promise<string> {
    const baseDir = this.options.baseDirectory!;

    switch (this.options.organizationStrategy) {
      case 'flat':
        return baseDir;

      case 'by-domain':
        const domainDir = sanitize(metadata.domain.replace(/\./g, '_'));
        return path.join(baseDir, domainDir);

      case 'by-date':
        const date = metadata.date || new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return path.join(baseDir, `${year}`, `${month}`, `${day}`);

      case 'by-email':
        if (metadata.emailId) {
          return path.join(baseDir, 'emails', sanitize(metadata.emailId));
        }
        return path.join(baseDir, 'no-email');

      default:
        return baseDir;
    }
  }

  private generateFilename(metadata: {
    url: string;
    title: string;
    domain: string;
  }): string {
    let filename: string;

    switch (this.options.filenameFormat) {
      case 'title':
        filename = sanitize(metadata.title);
        break;

      case 'url-slug':
        const urlPath = new URL(metadata.url).pathname;
        const slug = urlPath.split('/').filter(s => s).pop() || 'article';
        filename = sanitize(slug);
        break;

      case 'timestamp-title':
        const timestamp = Date.now();
        const shortTitle = sanitize(metadata.title).substring(0, 50);
        filename = `${timestamp}-${shortTitle}`;
        break;

      default:
        filename = sanitize(metadata.title);
    }

    // Ensure filename isn't too long
    if (filename.length > this.options.maxFilenameLength!) {
      filename = filename.substring(0, this.options.maxFilenameLength!);
    }

    // Ensure it has .md extension
    if (!filename.endsWith('.md')) {
      filename += '.md';
    }

    // Ensure filename is not empty
    if (filename === '.md') {
      filename = `article-${Date.now()}.md`;
    }

    return filename;
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      console.log(`📁 [FileSystemService] Creating directory: ${dirPath}`);
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async listSavedFiles(directory?: string): Promise<SavedFile[]> {
    const targetDir = directory || this.options.baseDirectory!;
    console.log(`📋 [FileSystemService::listSavedFiles] Listing files in: ${targetDir}`);

    try {
      const files: SavedFile[] = [];
      await this.walkDirectory(targetDir, async (filepath) => {
        if (filepath.endsWith('.md')) {
          const stats = await fs.stat(filepath);
          const content = await fs.readFile(filepath, 'utf-8');
          
          // Extract metadata from frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          let title = path.basename(filepath, '.md');
          let url = '';
          
          if (frontmatterMatch && frontmatterMatch[1]) {
            const frontmatter = frontmatterMatch[1];
            const titleMatch = frontmatter.match(/title:\s*"(.+)"/);
            const urlMatch = frontmatter.match(/source:\s*"(.+)"/);
            
            if (titleMatch && titleMatch[1]) title = titleMatch[1];
            if (urlMatch && urlMatch[1]) url = urlMatch[1];
          }

          files.push({
            filename: path.basename(filepath),
            filepath,
            size: stats.size,
            savedAt: stats.mtime,
            url,
            title
          });
        }
      });

      console.log(`✅ [FileSystemService::listSavedFiles] Found ${files.length} markdown files`);
      return files;

    } catch (error: any) {
      console.error(`❌ [FileSystemService::listSavedFiles] Failed to list files:`, error);
      return [];
    }
  }

  private async walkDirectory(dir: string, callback: (filepath: string) => Promise<void>): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, callback);
      } else if (entry.isFile()) {
        await callback(fullPath);
      }
    }
  }

  async deleteFile(filepath: string): Promise<boolean> {
    try {
      console.log(`🗑️  [FileSystemService::deleteFile] Deleting file: ${filepath}`);
      await fs.unlink(filepath);
      console.log(`✅ [FileSystemService::deleteFile] File deleted successfully`);
      return true;
    } catch (error: any) {
      console.error(`❌ [FileSystemService::deleteFile] Failed to delete file:`, error);
      return false;
    }
  }

  async getFileContent(filepath: string): Promise<string | null> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return content;
    } catch (error: any) {
      console.error(`❌ [FileSystemService::getFileContent] Failed to read file:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const fileSystemService = new FileSystemService();