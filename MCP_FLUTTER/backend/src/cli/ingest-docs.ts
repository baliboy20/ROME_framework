#!/usr/bin/env node
/**
 * Document Ingestion CLI Tool
 * 
 * Command-line interface for ingesting Flutter documentation into Weaviate
 * Usage: npm run ingest-docs <directory> [options]
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { DocumentIngestionService } from '../ingestion/DocumentIngestionService.js';
import { WeaviateClient } from '../vectorstore/WeaviateClient.js';
import { Logger } from '../utils/Logger.js';
import * as process from 'process';
import * as fs from 'fs/promises';

interface CliOptions {
  directory?: string;
  pattern?: string;
  clear?: boolean;
  stats?: boolean;
  file?: string;
  help?: boolean;
  verbose?: boolean;
}

class DocumentIngestionCLI {
  private ingestionService!: DocumentIngestionService;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DocumentIngestionCLI');
  }

  async initialize(): Promise<void> {
    // Initialize Weaviate client
    const weaviateConfig = {
      host: process.env.WEAVIATE_HOST || 'localhost',
      scheme: (process.env.WEAVIATE_SCHEME || 'http') as 'http' | 'https',
      port: parseInt(process.env.WEAVIATE_PORT || '8080'),
      headers: process.env.OPENAI_API_KEY ? {
        'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY
      } : undefined
    };

    const weaviateClient = new WeaviateClient(weaviateConfig);
    this.ingestionService = new DocumentIngestionService(weaviateClient, this.logger);
    
    await this.ingestionService.initialize();
  }

  private parseArguments(args: string[]): CliOptions {
    const options: CliOptions = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--help':
        case '-h':
          options.help = true;
          break;
        case '--clear':
        case '-c':
          options.clear = true;
          break;
        case '--stats':
        case '-s':
          options.stats = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--pattern':
        case '-p':
          options.pattern = args[++i] || '';
          break;
        case '--file':
        case '-f':
          options.file = args[++i] || '';
          break;
        default:
          if (arg && !arg.startsWith('-') && !options.directory) {
            options.directory = arg;
          }
          break;
      }
    }
    
    return options;
  }

  private printHelp(): void {
    console.log(`
Flutter Documentation Ingestion Tool

USAGE:
  npm run ingest-docs <directory> [options]
  npm run ingest-docs --file <file> [options]
  npm run ingest-docs --stats
  npm run ingest-docs --clear

OPTIONS:
  -h, --help              Show this help message
  -c, --clear             Clear all existing documents from database
  -s, --stats             Show ingestion statistics
  -f, --file <file>       Ingest a single file
  -p, --pattern <pattern> File pattern (regex) to match (default: \\.(md|txt|rst|adoc)$)
  -v, --verbose           Verbose logging

EXAMPLES:
  # Ingest all markdown files from docs directory
  npm run ingest-docs ./flutter-docs

  # Ingest only .md files matching a pattern  
  npm run ingest-docs ./docs --pattern "\\.md$"

  # Ingest a single file
  npm run ingest-docs --file ./docs/widgets.md

  # Clear all documents and then ingest
  npm run ingest-docs ./docs --clear

  # Show current statistics
  npm run ingest-docs --stats

ENVIRONMENT VARIABLES:
  WEAVIATE_HOST      Weaviate host (default: localhost)
  WEAVIATE_PORT      Weaviate port (default: 8080)
  WEAVIATE_SCHEME    Weaviate scheme (default: http)
  OPENAI_API_KEY     OpenAI API key for embeddings
  LOG_LEVEL          Log level (debug, info, warn, error)
`);
  }

  private async clearDocuments(): Promise<void> {
    this.logger.info('Clearing all documents from database...');
    await this.ingestionService.clearAllDocuments();
    console.log('✅ All documents cleared successfully');
  }

  private async showStats(): Promise<void> {
    this.logger.info('Fetching ingestion statistics...');
    const stats = await this.ingestionService.getIngestionStats();
    
    console.log('\n📊 Document Database Statistics:');
    console.log(`Total Documents: ${stats.totalDocuments}`);
    console.log(`Last Updated: ${stats.lastUpdated}`);
    
    if (Object.keys(stats.documentsByCategory).length > 0) {
      console.log('\nDocuments by Category:');
      Object.entries(stats.documentsByCategory)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count}`);
        });
    }
  }

  private async ingestFile(filePath: string): Promise<void> {
    this.logger.info(`Ingesting single file: ${filePath}`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const result = await this.ingestionService.ingestDocument({
        content,
        source: filePath
      });

      this.printResult(result);
    } catch (error) {
      console.error(`❌ Failed to ingest file ${filePath}:`, error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async ingestDirectory(directoryPath: string, pattern?: string): Promise<void> {
    // Default to flutter_archive documents directory
    const targetPath = directoryPath || './documents/flutter_archive';
    this.logger.info(`Ingesting directory: ${targetPath}`);
    
    try {
      const filePattern = pattern ? new RegExp(pattern) : undefined;
      const result = await this.ingestionService.ingestDirectory(targetPath, filePattern);
      
      this.printResult(result);
    } catch (error) {
      console.error(`❌ Failed to ingest directory ${targetPath}:`, error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private printResult(result: any): void {
    if (result.success) {
      console.log(`✅ Ingestion completed successfully`);
      console.log(`   Documents processed: ${result.documentsProcessed}`);
      console.log(`   Documents indexed: ${result.documentsIndexed}`);
      console.log(`   Processing time: ${result.processingTimeMs}ms`);
    } else {
      console.log(`❌ Ingestion failed`);
      console.log(`   Documents processed: ${result.documentsProcessed}`);
      console.log(`   Documents indexed: ${result.documentsIndexed}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach((error: string, index: number) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
  }

  async run(args: string[]): Promise<void> {
    try {
      const options = this.parseArguments(args);

      if (options.help) {
        this.printHelp();
        return;
      }

      if (options.verbose) {
        process.env.LOG_LEVEL = 'debug';
      }

      console.log('🚀 Initializing Document Ingestion Service...');
      await this.initialize();

      if (options.clear) {
        await this.clearDocuments();
      }

      if (options.stats) {
        await this.showStats();
        return;
      }

      if (options.file) {
        await this.ingestFile(options.file);
      } else if (options.directory) {
        await this.ingestDirectory(options.directory, options.pattern);
      } else {
        console.error('❌ Error: Please specify a directory or file to ingest, or use --help for usage information.');
        process.exit(1);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Fatal error:', errorMessage);
      if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
        console.error(error instanceof Error ? error.stack : String(error));
      }
      process.exit(1);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new DocumentIngestionCLI();
  const args = process.argv.slice(2);
  
  cli.run(args).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DocumentIngestionCLI };
