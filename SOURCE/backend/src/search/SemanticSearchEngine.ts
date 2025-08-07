/**
 * SemanticSearchEngine Implementation
 * Performs semantic search operations using Weaviate vector database
 */

import { WeaviateClient } from '../vectorstore/WeaviateClient.js';
import { QueryBuilder } from './QueryBuilder';

interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
  categories?: string[];
  language?: string;
}

interface SearchFilters {
  codeType?: 'snippet' | 'template' | 'pattern';
  complexity?: 'simple' | 'moderate' | 'complex';
  frameworks?: string[];
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

interface SearchOptions {
  filters?: SearchFilters;
  similarity?: number;
  ranking?: 'relevance' | 'date' | 'popularity';
  includeMeta?: boolean;
}

interface SearchResult {
  id: string;
  content: string;
  title: string;
  similarity: number;
  metadata: {
    categories: string[];
    tags: string[];
    language: string;
    codeType?: string;
    complexity: string;
    frameworks: string[];
    path: string;
    lastModified: Date;
  };
}

export class SemanticSearchEngine {
  private weaviateClient: WeaviateClient;
  private queryBuilder: QueryBuilder;
  private performanceMetrics: {
    totalQueries: number;
    averageResponseTime: number;
    lastQueryTime: number;
  };

  constructor(weaviateClient: WeaviateClient) {
    this.weaviateClient = weaviateClient;
    this.queryBuilder = new QueryBuilder();
    this.performanceMetrics = {
      totalQueries: 0,
      averageResponseTime: 0,
      lastQueryTime: 0
    };
  }

  private async ensureConnection(): Promise<void> {
    if (!this.weaviateClient.isConnected()) {
      const connected = await this.weaviateClient.connect();
      if (!connected) {
        throw new Error('Failed to connect to Weaviate database');
      }
    }
  }

  private updatePerformanceMetrics(responseTime: number): void {
    this.performanceMetrics.totalQueries++;
    this.performanceMetrics.lastQueryTime = responseTime;
    
    // Calculate rolling average
    const totalTime = this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalQueries - 1);
    this.performanceMetrics.averageResponseTime = (totalTime + responseTime) / this.performanceMetrics.totalQueries;
  }

  private transformWeaviateResults(weaviateResults: any[]): SearchResult[] {
    return weaviateResults.map(result => {
      // Extract data from Weaviate result structure
      const data = result.properties || result;
      const additional = result._additional || {};
      
      // Generate title from content or source
      const title = this.generateTitle(data.content, data.source, data.section);
      
      // Parse tags and frameworks (handle both string and array formats)
      const tags = Array.isArray(data.tags) ? data.tags : 
                   typeof data.tags === 'string' ? data.tags.split(',').map((t: string) => t.trim()) : [];
      
      const frameworks = Array.isArray(data.frameworks) ? data.frameworks :
                        typeof data.frameworks === 'string' ? data.frameworks.split(',').map((f: string) => f.trim()) : [];
      
      const categories = Array.isArray(data.categories) ? data.categories :
                        typeof data.categories === 'string' ? data.categories.split(',').map((c: string) => c.trim()) :
                        data.category ? [data.category] : [];

      return {
        id: additional.id || result.id || this.generateId(),
        content: data.content || '',
        title,
        similarity: additional.score || additional.distance ? (1 - (additional.distance || 0)) : 0.5,
        metadata: {
          categories,
          tags,
          language: data.language || 'unknown',
          codeType: data.codeType,
          complexity: data.complexity || 'simple',
          frameworks,
          path: data.source || data.path || 'unknown',
          lastModified: data.lastUpdated ? new Date(data.lastUpdated) : new Date()
        }
      };
    });
  }

  private generateTitle(content: string, source?: string, section?: string): string {
    // Use section title if available
    if (section && section !== 'unknown') {
      return section;
    }

    // Extract filename from source path
    if (source && source !== 'unknown') {
      const filename = source.split('/').pop() || source;
      return filename.replace(/\.[^/.]+$/, ''); // Remove extension
    }

    // Generate from content - first line or first sentence
    if (content) {
      const firstLine = content.split('\n')[0]?.trim() || '';
      if (firstLine.length > 0) {
        // If it's a comment, extract meaningful part
        const cleanLine = firstLine.replace(/^\/\/\s*|^\/\*\*?\s*|^\*\s*|\s*\*\/$/, '').trim();
        if (cleanLine.length > 0) {
          return cleanLine.substring(0, 50) + (cleanLine.length > 50 ? '...' : '');
        }
      }

      // Extract class or function name
      const classMatch = content.match(/class\s+(\w+)/);
      if (classMatch) return `Class ${classMatch[1]}`;

      const functionMatch = content.match(/(?:function|fun|def)\s+(\w+)/);
      if (functionMatch) return `Function ${functionMatch[1]}`;

      // Fallback to first few words
      const words = content.split(/\s+/).slice(0, 5).join(' ');
      return words.substring(0, 40) + (words.length > 40 ? '...' : '');
    }

    return 'Untitled Document';
  }

  private generateId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async performSemanticSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
    await this.ensureConnection();

    // Build the Weaviate query
    const searchParams: SearchParams = {
      query,
      limit: 20,
      offset: 0,
      language: 'dart'
    };

    const weaviateQuery = this.queryBuilder.build(searchParams, options.filters || {});

    try {
      // Execute the query using nearTextSearch for semantic similarity
      const queryResult = await this.weaviateClient.nearTextSearch(
        'FlutterDoc',
        weaviateQuery.query,
        weaviateQuery.limit
      );

      return this.transformWeaviateResults(queryResult.data);
    } catch (error) {
      // Fallback to regular query if nearTextSearch fails
      console.warn('Semantic search failed, falling back to regular query:', error);
      
      const fallbackResult = await this.weaviateClient.query('FlutterDoc', {
        fields: weaviateQuery.filters.fields,
        where: weaviateQuery.filters.where,
        limit: weaviateQuery.limit,
        offset: weaviateQuery.offset
      });

      return this.transformWeaviateResults(fallbackResult.data);
    }
  }

  private sortResults(results: SearchResult[], ranking: 'relevance' | 'date' | 'popularity'): SearchResult[] {
    switch (ranking) {
      case 'relevance':
        return results.sort((a, b) => b.similarity - a.similarity);
        
      case 'date':
        return results.sort((a, b) => 
          b.metadata.lastModified.getTime() - a.metadata.lastModified.getTime()
        );
        
      case 'popularity':
        // In a real implementation, this would use actual popularity metrics
        // For now, use a combination of similarity and recency
        return results.sort((a, b) => {
          const aScore = a.similarity * 0.7 + (this.getRecencyScore(a.metadata.lastModified) * 0.3);
          const bScore = b.similarity * 0.7 + (this.getRecencyScore(b.metadata.lastModified) * 0.3);
          return bScore - aScore;
        });
        
      default:
        return results;
    }
  }

  private getRecencyScore(date: Date): number {
    const now = new Date().getTime();
    const age = now - date.getTime();
    const daysSinceModified = age / (1000 * 60 * 60 * 24);
    
    // Score decreases with age (older = lower score)
    if (daysSinceModified < 30) return 1.0;
    if (daysSinceModified < 90) return 0.8;
    if (daysSinceModified < 180) return 0.6;
    if (daysSinceModified < 365) return 0.4;
    return 0.2;
  }

  private applySimilarityThreshold(results: SearchResult[], threshold?: number): SearchResult[] {
    if (!threshold) return results;
    
    return results.filter(result => result.similarity >= threshold);
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const startTime = Date.now();

    try {
      // Perform semantic search
      let results = await this.performSemanticSearch(query.trim(), options);

      // Apply similarity threshold if specified
      if (options.similarity) {
        results = this.applySimilarityThreshold(results, options.similarity);
      }

      // Sort results according to ranking preference
      if (options.ranking) {
        results = this.sortResults(results, options.ranking);
      }

      // Update performance metrics
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime);

      // Check performance requirement (< 200ms)
      if (responseTime > 200) {
        console.warn(`Search query took ${responseTime}ms, exceeding 200ms target`);
      }

      return results;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(responseTime);
      
      throw new Error(`Search failed: ${(error as Error).message}`);
    }
  }

  // Utility method for quick searches
  async quickSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
    return this.search(query, {
      ranking: 'relevance',
      filters: {}
    });
  }

  // Method to get performance metrics
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  // Method to check if performance targets are met
  isPerformanceTargetMet(): boolean {
    return this.performanceMetrics.averageResponseTime < 200 &&
           this.performanceMetrics.lastQueryTime < 200;
  }
}