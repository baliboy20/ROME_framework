/**
 * Local Schema Manager
 * 
 * Simplified schema manager for document ingestion
 * Avoids cross-directory dependency issues
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import weaviate from 'weaviate-ts-client';

interface WeaviateConfig {
  host: string;
  scheme: 'http' | 'https';
  port?: number;
}

export class LocalSchemaManager {
  private client: any;

  constructor(config: WeaviateConfig) {
    this.client = weaviate.client({
      scheme: config.scheme,
      host: config.host,
      ...(config.port && { port: config.port }),
      ...(process.env.OPENAI_API_KEY && {
        headers: {
          'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY
        }
      })
    });
  }

  async createSchema(): Promise<boolean> {
    try {
      const schemaExists = await this.client.schema.exists('FlutterDoc');
      
      if (schemaExists) {
        return true; // Schema already exists
      }

      const schema = {
        class: 'FlutterDoc',
        description: 'Flutter documentation chunks with semantic search',
        properties: [
          {
            name: 'content',
            dataType: ['text'],
            description: 'Documentation content chunk',
            tokenization: 'word',
            moduleConfig: {
              'text2vec-openai': {
                skip: false,
                vectorizePropertyName: false,
              },
            },
          },
          {
            name: 'category',
            dataType: ['string'],
            description: 'Document category',
            indexFilterable: true,
            indexSearchable: true,
          },
          {
            name: 'subcategory',
            dataType: ['string'],
            description: 'Document subcategory',
            indexFilterable: true,
          },
          {
            name: 'source',
            dataType: ['string'],
            description: 'Source file path',
            indexFilterable: true,
          },
          {
            name: 'section',
            dataType: ['string'],
            description: 'Document section/heading',
            indexSearchable: true,
          },
          {
            name: 'tags',
            dataType: ['string[]'],
            description: 'Searchable tags',
            indexSearchable: true,
          },
          {
            name: 'codeType',
            dataType: ['string'],
            description: 'Type of code: snippet, template, example, rule',
            indexFilterable: true,
          },
          {
            name: 'version',
            dataType: ['string'],
            description: 'Documentation version',
            indexFilterable: true,
          },
          {
            name: 'lastUpdated',
            dataType: ['date'],
            description: 'Last update timestamp',
          },
        ],
        vectorizer: 'text2vec-openai',
        moduleConfig: {
          'text2vec-openai': {
            model: 'text-embedding-3-small',
            type: 'text',
            vectorizeClassName: false,
          },
        },
        vectorIndexType: 'hnsw',
        vectorIndexConfig: {
          distance: 'cosine',
          ef: 100,
          efConstruction: 128,
          maxConnections: 32,
        },
      };

      await this.client.schema.classCreator().withClass(schema).do();
      return true;

    } catch (error) {
      console.error('Failed to create schema:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async validateSchema(): Promise<boolean> {
    try {
      return await this.client.schema.exists('FlutterDoc');
    } catch (error) {
      return false;
    }
  }

  async isSchemaHealthy(): Promise<boolean> {
    try {
      const exists = await this.client.schema.exists('FlutterDoc');
      if (!exists) return false;

      // Try a simple query to test the schema
      const result = await this.client.graphql
        .aggregate()
        .withClassName('FlutterDoc')
        .withFields('meta { count }')
        .do();

      return !result.errors;
    } catch (error) {
      return false;
    }
  }

  async deleteSchema(): Promise<boolean> {
    try {
      await this.client.schema.classDeleter().withClassName('FlutterDoc').do();
      return true;
    } catch (error) {
      return false;
    }
  }
}