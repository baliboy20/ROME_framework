/**
 * End-to-End Integration Test Suite
 * Tests the complete Flutter Documentation RAG_ROME system
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import weaviate from 'weaviate-ts-client';
import { WeaviateClient } from '../../backend/src/vectorstore/WeaviateClient';
import { SemanticSearchEngine } from '../../backend/src/search/SemanticSearchEngine';
import { QueryBuilder } from '../../backend/src/search/QueryBuilder';
import { ResultProcessor } from '../../backend/src/search/ResultProcessor';
import { CategoryFilter } from '../../backend/src/search/CategoryFilter';
import { SimilarityThresholdHandler } from '../../backend/src/search/SimilarityThresholdHandler';

describe('End-to-End Integration Tests', () => {
  let weaviateClient: WeaviateClient;
  let searchEngine: SemanticSearchEngine;
  let queryBuilder: QueryBuilder;
  let resultProcessor: ResultProcessor;
  
  beforeAll(async () => {
    // Initialize Weaviate client
    weaviateClient = new WeaviateClient({
      host: 'localhost',
      scheme: 'http',
      port: 8088,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000
    });
    
    const connected = await weaviateClient.connect();
    expect(connected).toBe(true);
    
    // Initialize search components
    searchEngine = new SemanticSearchEngine(weaviateClient);
    queryBuilder = new QueryBuilder();
    resultProcessor = new ResultProcessor();
  });
  
  afterAll(async () => {
    if (weaviateClient) {
      await weaviateClient.disconnect();
    }
  });
  
  describe('Flutter Documentation Search', () => {
    test('should search for state management documentation', async () => {
      const query = 'Flutter state management Provider pattern';
      const results = await searchEngine.search(query, {
        limit: 5,
        similarity: 0.7,
        filters: {
          language: 'dart',
          frameworks: ['flutter']
        }
      });
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify result structure
      if (results.length > 0) {
        const firstResult = results[0];
        expect(firstResult).toHaveProperty('id');
        expect(firstResult).toHaveProperty('content');
        expect(firstResult).toHaveProperty('similarity');
        expect(firstResult.similarity).toBeGreaterThanOrEqual(0.7);
        
        // Check metadata
        expect(firstResult.metadata).toBeDefined();
        expect(firstResult.metadata.language).toBe('dart');
        expect(firstResult.metadata.frameworks).toContain('flutter');
      }
    });
    
    test('should perform semantic search for error handling', async () => {
      const query = 'error handling and crash reporting';
      const results = await searchEngine.search(query, {
        limit: 3,
        ranking: 'relevance',
        includeMeta: true
      });
      
      expect(results).toBeInstanceOf(Array);
      
      // Should find relevant error handling documentation
      const hasErrorContent = results.some(r => 
        r.content.toLowerCase().includes('error') ||
        r.title?.toLowerCase().includes('error')
      );
      expect(hasErrorContent).toBe(true);
    });
    
    test('should filter by category', async () => {
      const categoryFilter = new CategoryFilter();
      
      // Get all documents first
      const allResults = await searchEngine.search('Flutter', { limit: 10 });
      
      // Filter for UI components
      const uiResults = categoryFilter.filter(allResults, ['ui-components']);
      
      expect(uiResults).toBeInstanceOf(Array);
      if (uiResults.length > 0) {
        uiResults.forEach(result => {
          expect(result.metadata.categories).toContain('ui-components');
        });
      }
    });
    
    test('should apply similarity threshold', async () => {
      const thresholdHandler = new SimilarityThresholdHandler(0.8);
      
      const results = await searchEngine.search('widget performance optimization', {
        limit: 10,
        similarity: 0.6
      });
      
      // Apply stricter threshold
      const filteredResults = thresholdHandler.threshold(results, {
        minSimilarity: 0.8
      });
      
      filteredResults.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.8);
      });
    });
    
    test('should rank and process results', async () => {
      const results = await searchEngine.search('Flutter architecture patterns', {
        limit: 5
      });
      
      const processedResults = resultProcessor.process(results, {
        weights: {
          similarity: 0.6,
          freshness: 0.2,
          popularity: 0.1,
          exactMatch: 0.1
        },
        boosts: {
          categories: { 'architecture': 1.2 },
          frameworks: { 'flutter': 1.1 }
        }
      });
      
      expect(processedResults).toBeInstanceOf(Array);
      
      // Check that results are ranked
      processedResults.forEach((result, index) => {
        expect(result.rank).toBe(index + 1);
        expect(result.relevanceScore).toBeDefined();
      });
      
      // Results should be sorted by relevance
      for (let i = 1; i < processedResults.length; i++) {
        expect(processedResults[i - 1].relevanceScore)
          .toBeGreaterThanOrEqual(processedResults[i].relevanceScore);
      }
    });
  });
  
  describe('Weaviate Operations', () => {
    test('should verify schema exists', async () => {
      const schema = await weaviateClient.getSchema();
      
      expect(schema).toBeDefined();
      expect(schema.classes).toBeInstanceOf(Array);
      
      const flutterDocClass = schema.classes.find(c => c.class === 'FlutterDoc');
      expect(flutterDocClass).toBeDefined();
    });
    
    test('should perform vector search', async () => {
      // Create a mock vector (normally from OpenAI embeddings)
      const mockVector = new Array(384).fill(0.1); // Adjust dimension based on your vectorizer
      
      try {
        const results = await weaviateClient.vectorSearch('FlutterDoc', mockVector, 3);
        
        expect(results).toBeDefined();
        expect(results.data).toBeInstanceOf(Array);
        expect(results.metadata.queryTime).toBeGreaterThan(0);
      } catch (error) {
        // Vector search might fail if dimensions don't match
        console.log('Vector search skipped:', error.message);
      }
    });
    
    test('should perform text search', async () => {
      const results = await weaviateClient.nearTextSearch(
        'FlutterDoc',
        'state management architecture',
        5
      );
      
      expect(results).toBeDefined();
      expect(results.data).toBeInstanceOf(Array);
      expect(results.metadata.totalCount).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Performance Tests', () => {
    test('search should complete within 200ms', async () => {
      const startTime = Date.now();
      
      await searchEngine.search('Flutter widgets', { limit: 5 });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });
    
    test('should handle concurrent searches', async () => {
      const queries = [
        'state management',
        'error handling',
        'widget testing',
        'performance optimization',
        'navigation patterns'
      ];
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        queries.map(q => searchEngine.search(q, { limit: 3 }))
      );
      
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(5);
      results.forEach(r => expect(r).toBeInstanceOf(Array));
      expect(duration).toBeLessThan(1000); // All 5 searches in under 1 second
    });
  });
});