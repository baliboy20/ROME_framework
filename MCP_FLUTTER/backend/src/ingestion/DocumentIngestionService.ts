/**
 * Document Ingestion Service
 * 
 * Processes and saves Flutter documentation to Weaviate vector database
 * Integrates with Charlie's document processing pipeline
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { WeaviateClient } from '../vectorstore/WeaviateClient.js';
import { LocalSchemaManager } from '../database/LocalSchemaManager.js';
import { DocumentChunker } from '../document/DocumentChunker.js';
import { MetadataExtractor } from '../document/MetadataExtractor.js';
import { DocumentLoader } from '../document/DocumentLoader.js';
import { SectionSplitter } from '../document/SectionSplitter.js';
import { CodeTypeClassifier } from '../document/CodeTypeClassifier.js';
import { Logger } from '../utils/Logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocumentInput {
  content: string;
  source: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ProcessedDocument {
  content: string;
  category: string;
  subcategory?: string;
  source: string;
  section?: string;
  tags: string[];
  codeType?: string;
  version: string;
  lastUpdated: string;
  embedding?: number[];
}

export interface IngestionResult {
  success: boolean;
  documentsProcessed: number;
  documentsIndexed: number;
  errors: string[];
  processingTimeMs: number;
}

export class DocumentIngestionService {
  private weaviateClient: WeaviateClient;
  private schemaManager: LocalSchemaManager;
  private documentChunker: DocumentChunker;
  private metadataExtractor: MetadataExtractor;
  private documentLoader: DocumentLoader;
  private sectionSplitter: SectionSplitter;
  private codeTypeClassifier: CodeTypeClassifier;
  private logger: Logger;
  private readonly BATCH_SIZE = 10;
  private readonly CHUNK_SIZE = 1000;

  constructor(weaviateClient: WeaviateClient, logger?: Logger) {
    this.weaviateClient = weaviateClient;
    this.logger = logger || new Logger('DocumentIngestionService');
    
    // Initialize schema manager
    const weaviateConfig = {
      host: process.env.WEAVIATE_HOST || 'localhost',
      scheme: (process.env.WEAVIATE_SCHEME || 'http') as 'http' | 'https',
      port: parseInt(process.env.WEAVIATE_PORT || '8080'),
    };
    this.schemaManager = new LocalSchemaManager(weaviateConfig);

    // Initialize Charlie's document processing components
    this.documentChunker = new DocumentChunker();
    this.metadataExtractor = new MetadataExtractor();
    this.documentLoader = new DocumentLoader();
    this.sectionSplitter = new SectionSplitter();
    this.codeTypeClassifier = new CodeTypeClassifier();
  }

  /**
   * Initialize the ingestion service - ensure database schema exists
   */
  public async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing document ingestion service');

      // Ensure Weaviate connection
      await this.weaviateClient.connect();

      // Ensure schema exists
      const schemaExists = await this.schemaManager.validateSchema();
      if (!schemaExists) {
        this.logger.info('Creating FlutterDoc schema');
        await this.schemaManager.createSchema();
      }

      this.logger.info('Document ingestion service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize ingestion service', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Process and ingest a single document
   */
  public async ingestDocument(document: DocumentInput): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      this.logger.info(`Ingesting document: ${document.source}`);

      // Process the document into chunks
      const processedChunks = await this.processDocument(document);
      
      if (processedChunks.length === 0) {
        return {
          success: false,
          documentsProcessed: 0,
          documentsIndexed: 0,
          errors: ['No processable content found in document'],
          processingTimeMs: Date.now() - startTime
        };
      }

      // Index chunks in batches
      let indexedCount = 0;
      for (let i = 0; i < processedChunks.length; i += this.BATCH_SIZE) {
        const batch = processedChunks.slice(i, i + this.BATCH_SIZE);
        try {
          await this.indexDocumentBatch(batch);
          indexedCount += batch.length;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to index batch ${Math.floor(i / this.BATCH_SIZE) + 1}: ${errorMessage}`);
        }
      }

      const success = indexedCount > 0;
      const processingTime = Date.now() - startTime;

      this.logger.info(`Document ingestion ${success ? 'completed' : 'failed'}`, {
        source: document.source,
        chunksProcessed: processedChunks.length,
        chunksIndexed: indexedCount,
        processingTimeMs: processingTime
      });

      return {
        success,
        documentsProcessed: processedChunks.length,
        documentsIndexed: indexedCount,
        errors,
        processingTimeMs: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Document ingestion failed: ${document.source}`, error instanceof Error ? error : new Error(String(error)));

      return {
        success: false,
        documentsProcessed: 0,
        documentsIndexed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: processingTime
      };
    }
  }

  /**
   * Process multiple documents from a directory
   */
  public async ingestDirectory(directoryPath: string, pattern?: RegExp): Promise<IngestionResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalIndexed = 0;
    const allErrors: string[] = [];

    try {
      this.logger.info(`Starting directory ingestion: ${directoryPath}`);

      const files = await this.findDocumentFiles(directoryPath, pattern);
      this.logger.info(`Found ${files.length} files to process`);

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const document: DocumentInput = {
            content,
            source: path.relative(directoryPath, filePath),
            category: this.inferCategoryFromPath(filePath),
            tags: this.extractTagsFromPath(filePath)
          };

          const result = await this.ingestDocument(document);
          totalProcessed += result.documentsProcessed;
          totalIndexed += result.documentsIndexed;
          allErrors.push(...result.errors);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          allErrors.push(`Failed to process ${filePath}: ${errorMessage}`);
        }
      }

      const processingTime = Date.now() - startTime;
      const success = totalIndexed > 0;

      this.logger.info(`Directory ingestion ${success ? 'completed' : 'failed'}`, {
        directoryPath,
        filesProcessed: files.length,
        documentsProcessed: totalProcessed,
        documentsIndexed: totalIndexed,
        processingTimeMs: processingTime
      });

      return {
        success,
        documentsProcessed: totalProcessed,
        documentsIndexed: totalIndexed,
        errors: allErrors,
        processingTimeMs: processingTime
      };

    } catch (error) {
      this.logger.error(`Directory ingestion failed: ${directoryPath}`, error instanceof Error ? error : new Error(String(error)));
      
      return {
        success: false,
        documentsProcessed: totalProcessed,
        documentsIndexed: totalIndexed,
        errors: [...allErrors, error instanceof Error ? error.message : 'Unknown error'],
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Clear all documents from the database
   */
  public async clearAllDocuments(): Promise<void> {
    try {
      this.logger.info('Clearing all documents from database');
      
      // Delete all FlutterDoc objects by deleting the whole class
      await this.weaviateClient.deleteSchema('FlutterDoc');
      
      // Recreate the schema
      await this.schemaManager.createSchema();

      this.logger.info('All documents cleared from database');
    } catch (error) {
      this.logger.error('Failed to clear documents', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get ingestion statistics
   */
  public async getIngestionStats(): Promise<{
    totalDocuments: number;
    documentsByCategory: Record<string, number>;
    lastUpdated: string;
  }> {
    try {
      // Get total document count
      const aggregateResult = await this.weaviateClient.graphql
        .aggregate()
        .withClassName('FlutterDoc')
        .withFields('meta { count }')
        .do();

      const totalDocuments = aggregateResult?.data?.Aggregate?.FlutterDoc?.[0]?.meta?.count || 0;

      // Get documents by category
      const categoryResult = await this.weaviateClient.graphql
        .aggregate()
        .withClassName('FlutterDoc')
        .withFields('groupedBy { path value } meta { count }')
        .withGroupBy(['category'])
        .do();

      const documentsByCategory: Record<string, number> = {};
      const groups = categoryResult?.data?.Aggregate?.FlutterDoc || [];
      groups.forEach((group: any) => {
        if (group.groupedBy?.value) {
          documentsByCategory[group.groupedBy.value] = group.meta?.count || 0;
        }
      });

      return {
        totalDocuments,
        documentsByCategory,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to get ingestion stats', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async processDocument(document: DocumentInput): Promise<ProcessedDocument[]> {
    const chunks: ProcessedDocument[] = [];
    
    // Split content into chunks
    const contentChunks = this.chunkContent(document.content);
    
    for (let i = 0; i < contentChunks.length; i++) {
      const chunk = contentChunks[i];
      if (!chunk) continue;
      
      // Extract section heading if present
      const section = this.extractSection(chunk);
      
      // Determine code type
      const codeType = this.detectCodeType(chunk);
      
      // Extract additional tags from content
      const contentTags = this.extractTagsFromContent(chunk);
      
      const processedDoc: ProcessedDocument = {
        content: chunk,
        category: document.category || this.inferCategoryFromContent(chunk),
        subcategory: this.inferSubcategory(chunk, document.category) || '',
        source: document.source,
        section: section || `${document.source} (chunk ${i + 1})`,
        tags: [...(document.tags || []), ...contentTags],
        codeType: codeType || '',
        version: '1.0.0', // Could be extracted from document metadata
        lastUpdated: new Date().toISOString()
      };
      
      chunks.push(processedDoc);
    }
    
    return chunks;
  }

  private chunkContent(content: string): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split(/\n\s*\n/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size, save current chunk
      if (currentChunk.length + paragraph.length > this.CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    // Add final chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [content]; // Fallback to original content
  }

  private async indexDocumentBatch(documents: ProcessedDocument[]): Promise<void> {
    const batcher = this.weaviateClient.batch.objectsBatcher();

    for (const doc of documents) {
      batcher.withObject({
        class: 'FlutterDoc',
        properties: {
          content: doc.content,
          category: doc.category,
          subcategory: doc.subcategory,
          source: doc.source,
          section: doc.section,
          tags: doc.tags,
          codeType: doc.codeType,
          version: doc.version,
          lastUpdated: doc.lastUpdated
        }
      });
    }

    const result = await batcher.do();
    
    // Check for errors in batch result
    if (result && result.length > 0) {
      const errors = result.filter(item => item.result?.errors?.error && Array.isArray(item.result.errors.error) && item.result.errors.error.length > 0);
      if (errors.length > 0) {
        throw new Error(`Batch indexing errors: ${JSON.stringify(errors)}`);
      }
    }
  }

  private async findDocumentFiles(directoryPath: string, pattern?: RegExp): Promise<string[]> {
    const files: string[] = [];
    const defaultPattern = /\.(md|txt|rst|adoc)$/i;
    const filePattern = pattern || defaultPattern;

    async function scanDirectory(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && filePattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    await scanDirectory(directoryPath);
    return files;
  }

  private extractSection(content: string): string | undefined {
    // Look for markdown headers
    const headerMatch = content.match(/^#+\s+(.+)$/m);
    if (headerMatch && headerMatch[1]) {
      return headerMatch[1].trim();
    }

    // Look for other section indicators
    const sectionMatch = content.match(/^(.+)\n[=-]{3,}$/m);
    if (sectionMatch && sectionMatch[1]) {
      return sectionMatch[1].trim();
    }

    return undefined;
  }

  private detectCodeType(content: string): string | undefined {
    if (content.includes('```dart') || content.includes('class ') && content.includes('Widget')) {
      return 'widget';
    }
    if (content.includes('example') || content.includes('Example:')) {
      return 'example';
    }
    if (content.includes('pattern') || content.includes('Pattern:')) {
      return 'pattern';
    }
    if (content.includes('template') || content.includes('Template:')) {
      return 'template';
    }
    return undefined;
  }

  private inferCategoryFromPath(filePath: string): string {
    const pathLower = filePath.toLowerCase();
    
    if (pathLower.includes('widget')) return 'widgets';
    if (pathLower.includes('state')) return 'state';
    if (pathLower.includes('navigation') || pathLower.includes('routing')) return 'navigation';
    if (pathLower.includes('animation')) return 'animation';
    if (pathLower.includes('test')) return 'testing';
    if (pathLower.includes('performance')) return 'performance';
    if (pathLower.includes('architecture')) return 'architecture';
    if (pathLower.includes('deployment') || pathLower.includes('build')) return 'deployment';
    
    return 'development';
  }

  private inferCategoryFromContent(content: string): string {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('widget') || contentLower.includes('stateless') || contentLower.includes('stateful')) {
      return 'widgets';
    }
    if (contentLower.includes('state management') || contentLower.includes('provider') || contentLower.includes('bloc')) {
      return 'state';
    }
    if (contentLower.includes('navigation') || contentLower.includes('route')) {
      return 'navigation';
    }
    if (contentLower.includes('animation') || contentLower.includes('tween')) {
      return 'animation';
    }
    if (contentLower.includes('test') || contentLower.includes('testing')) {
      return 'testing';
    }
    
    return 'development';
  }

  private inferSubcategory(content: string, category?: string): string | undefined {
    if (category === 'widgets') {
      if (content.includes('StatelessWidget')) return 'stateless';
      if (content.includes('StatefulWidget')) return 'stateful';
      if (content.includes('CustomPainter')) return 'custom';
    }
    
    if (category === 'state') {
      if (content.includes('Provider')) return 'provider';
      if (content.includes('Bloc')) return 'bloc';
      if (content.includes('setState')) return 'builtin';
    }
    
    return undefined;
  }

  private extractTagsFromPath(filePath: string): string[] {
    const tags: string[] = [];
    const pathParts = filePath.toLowerCase().split(/[/\\]/);
    
    // Add directory names as tags
    pathParts.forEach(part => {
      if (part && part !== 'docs' && part !== 'flutter' && !part.includes('.')) {
        tags.push(part);
      }
    });
    
    return tags;
  }

  private extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Common Flutter terms as tags
    const flutterTerms = [
      'widget', 'stateless', 'stateful', 'provider', 'bloc', 'navigation',
      'animation', 'theme', 'material', 'cupertino', 'scaffold', 'appbar'
    ];
    
    flutterTerms.forEach(term => {
      if (contentLower.includes(term)) {
        tags.push(term);
      }
    });
    
    return [...new Set(tags)]; // Remove duplicates
  }
}