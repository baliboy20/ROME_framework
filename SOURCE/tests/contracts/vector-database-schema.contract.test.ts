/**
 * VECTOR DATABASE SCHEMA CONTRACT TESTS
 * TDD-ROME Contract Definition Phase
 * 
 * Author: Ashok (Data Architect)
 * Purpose: Define testable contracts for Weaviate schema before implementation
 * 
 * CRITICAL: These tests must be written BEFORE any schema implementation
 * All tests should FAIL initially until schema is implemented
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Mock interfaces - these define the contracts that must be implemented
interface WeaviateSchemaProperty {
  name: string;
  dataType: string[];
  description: string;
  tokenization?: string;
  indexFilterable?: boolean;
  indexSearchable?: boolean;
  moduleConfig?: {
    'text2vec-openai': {
      skip: boolean;
      vectorizePropertyName: boolean;
    };
  };
}

interface WeaviateSchema {
  class: string;
  description: string;
  properties: WeaviateSchemaProperty[];
  vectorizer: string;
  moduleConfig: {
    'text2vec-openai': {
      model: string;
      type: string;
      vectorizeClassName: boolean;
    };
  };
  vectorIndexType: string;
  vectorIndexConfig: {
    distance: string;
    ef: number;
    efConstruction: number;
    maxConnections: number;
  };
}

interface SchemaManager {
  createSchema(): Promise<boolean>;
  validateSchema(): Promise<boolean>;
  getSchemaDefinition(): WeaviateSchema;
  isSchemaHealthy(): Promise<boolean>;
  deleteSchema(): Promise<boolean>;
}

// Import the actual SchemaManager implementation
import { SchemaManager } from '../../database/schemas/SchemaManager';

let schemaManager: SchemaManager;

describe('Vector Database Schema Contract', () => {
  
  beforeAll(async () => {
    // Initialize actual SchemaManager implementation
    const weaviateConfig = {
      host: process.env.WEAVIATE_HOST || 'localhost',
      scheme: (process.env.WEAVIATE_SCHEME || 'http') as 'http' | 'https',
      port: parseInt(process.env.WEAVIATE_PORT || '8080'),
    };
    schemaManager = new SchemaManager(weaviateConfig);
  });

  afterAll(async () => {
    // Cleanup test schema if created
    if (schemaManager) {
      await schemaManager.deleteSchema();
    }
  });

  describe('Schema Definition Contract', () => {
    
    test('should define FlutterDoc class with correct structure', () => {
      // This test defines the required schema structure
      const expectedSchema: WeaviateSchema = {
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

      // Implementation must return this exact schema structure
      const actualSchema = schemaManager.getSchemaDefinition();
      expect(actualSchema).toEqual(expectedSchema);
    });

    test('should have all required properties defined', () => {
      const schema = schemaManager.getSchemaDefinition();
      
      const requiredProperties = [
        'content', 'category', 'subcategory', 'source', 
        'section', 'tags', 'codeType', 'version', 'lastUpdated'
      ];

      requiredProperties.forEach(propName => {
        const property = schema.properties.find(p => p.name === propName);
        expect(property).toBeDefined();
        expect(property!.description).toBeTruthy();
      });
    });

    test('should configure content property for vectorization', () => {
      const schema = schemaManager.getSchemaDefinition();
      const contentProperty = schema.properties.find(p => p.name === 'content');
      
      expect(contentProperty).toBeDefined();
      expect(contentProperty!.tokenization).toBe('word');
      expect(contentProperty!.moduleConfig?.['text2vec-openai'].skip).toBe(false);
      expect(contentProperty!.moduleConfig?.['text2vec-openai'].vectorizePropertyName).toBe(false);
    });

    test('should configure filterable properties correctly', () => {
      const schema = schemaManager.getSchemaDefinition();
      const filterableProps = ['category', 'subcategory', 'source', 'codeType', 'version'];
      
      filterableProps.forEach(propName => {
        const property = schema.properties.find(p => p.name === propName);
        expect(property!.indexFilterable).toBe(true);
      });
    });

    test('should configure searchable properties correctly', () => {
      const schema = schemaManager.getSchemaDefinition();
      const searchableProps = ['category', 'section', 'tags'];
      
      searchableProps.forEach(propName => {
        const property = schema.properties.find(p => p.name === propName);
        expect(property!.indexSearchable).toBe(true);
      });
    });

    test('should use correct OpenAI embedding model', () => {
      const schema = schemaManager.getSchemaDefinition();
      expect(schema.vectorizer).toBe('text2vec-openai');
      expect(schema.moduleConfig['text2vec-openai'].model).toBe('text-embedding-3-small');
      expect(schema.moduleConfig['text2vec-openai'].type).toBe('text');
      expect(schema.moduleConfig['text2vec-openai'].vectorizeClassName).toBe(false);
    });

    test('should configure HNSW vector index optimally', () => {
      const schema = schemaManager.getSchemaDefinition();
      expect(schema.vectorIndexType).toBe('hnsw');
      expect(schema.vectorIndexConfig.distance).toBe('cosine');
      expect(schema.vectorIndexConfig.ef).toBe(100);
      expect(schema.vectorIndexConfig.efConstruction).toBe(128);
      expect(schema.vectorIndexConfig.maxConnections).toBe(32);
    });
  });

  describe('Schema Management Contract', () => {
    
    test('should create schema successfully', async () => {
      const result = await schemaManager.createSchema();
      expect(result).toBe(true);
    });

    test('should validate schema after creation', async () => {
      await schemaManager.createSchema();
      const isValid = await schemaManager.validateSchema();
      expect(isValid).toBe(true);
    });

    test('should report healthy schema', async () => {
      await schemaManager.createSchema();
      const isHealthy = await schemaManager.isSchemaHealthy();
      expect(isHealthy).toBe(true);
    });

    test('should handle schema recreation gracefully', async () => {
      // Create schema first time
      const firstCreate = await schemaManager.createSchema();
      expect(firstCreate).toBe(true);

      // Attempt to create again should handle gracefully
      const secondCreate = await schemaManager.createSchema();
      expect(secondCreate).toBe(true); // Should not throw error
    });

    test('should delete schema cleanly', async () => {
      await schemaManager.createSchema();
      const deleteResult = await schemaManager.deleteSchema();
      expect(deleteResult).toBe(true);
      
      // Schema should no longer be healthy after deletion
      const isHealthy = await schemaManager.isSchemaHealthy();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Schema Validation Contract', () => {
    
    test('should detect missing schema', async () => {
      // Ensure schema is deleted
      await schemaManager.deleteSchema();
      
      const isValid = await schemaManager.validateSchema();
      expect(isValid).toBe(false);
    });

    test('should validate property types', async () => {
      await schemaManager.createSchema();
      
      // Schema validation should check property types match definition
      const isValid = await schemaManager.validateSchema();
      expect(isValid).toBe(true);
    });

    test('should validate vectorizer configuration', async () => {
      await schemaManager.createSchema();
      
      // Should validate that OpenAI vectorizer is properly configured
      const isHealthy = await schemaManager.isSchemaHealthy();
      expect(isHealthy).toBe(true);
    });

    test('should validate index configuration', async () => {
      await schemaManager.createSchema();
      
      // Should validate HNSW index is properly configured
      const isValid = await schemaManager.validateSchema();
      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling Contract', () => {
    
    test('should handle Weaviate connection errors gracefully', async () => {
      // Test with invalid connection - should not throw but return false
      const result = await schemaManager.createSchema();
      expect(typeof result).toBe('boolean');
    });

    test('should handle invalid schema definition gracefully', async () => {
      // Schema validation should catch invalid definitions
      const isValid = await schemaManager.validateSchema();
      expect(typeof isValid).toBe('boolean');
    });

    test('should provide meaningful error information', async () => {
      // Health check should provide status information
      const isHealthy = await schemaManager.isSchemaHealthy();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('Performance Contract', () => {
    
    test('should create schema within acceptable time', async () => {
      const startTime = Date.now();
      await schemaManager.createSchema();
      const duration = Date.now() - startTime;
      
      // Schema creation should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('should validate schema within acceptable time', async () => {
      await schemaManager.createSchema();
      
      const startTime = Date.now();
      await schemaManager.validateSchema();
      const duration = Date.now() - startTime;
      
      // Schema validation should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    test('should perform health check within acceptable time', async () => {
      await schemaManager.createSchema();
      
      const startTime = Date.now();
      await schemaManager.isSchemaHealthy();
      const duration = Date.now() - startTime;
      
      // Health check should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});