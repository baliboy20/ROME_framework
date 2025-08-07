/**
 * Search Handler - search_docs tool
 * 
 * Handles semantic search requests against the Flutter documentation vector database
 * Provides intelligent search with category filtering and relevance scoring
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';

interface SearchArgs {
  query: string;
  category?: string;
  limit?: number;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  relevance_score: number;
  metadata: {
    source?: string;
    section?: string;
    tags?: string[];
    codeType?: string;
  };
}

export class SearchHandler extends BaseToolHandler {
  private weaviateClient: any;
  private readonly validCategories = [
    'widgets', 'state', 'navigation', 'animation', 'testing', 
    'performance', 'architecture', 'deployment', 'development'
  ];

  constructor(weaviateClient: any, logger: any) {
    super('search_docs', logger);
    this.weaviateClient = weaviateClient;
  }

  getToolDefinition(): Tool {
    return {
      name: 'search_docs',
      description: 'Perform semantic search on Flutter documentation with optional category filtering',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for finding relevant Flutter documentation and code examples'
          },
          category: {
            type: 'string',
            description: 'Optional category filter to narrow search results',
            enum: this.validCategories
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (1-50)',
            default: 5,
            minimum: 1,
            maximum: 50
          }
        },
        required: ['query']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: SearchArgs = { query: '' };

    // Validate query (required)
    const queryError = this.validateString(parsedArgs.query, 'query', true, 500);
    if (queryError) {
      errors.push(queryError);
    } else {
      sanitizedArgs.query = this.sanitizeString(parsedArgs.query);
    }

    // Validate category (optional)
    if (parsedArgs.category !== undefined) {
      const categoryError = this.validateEnum(parsedArgs.category, 'category', this.validCategories, false);
      if (categoryError) {
        errors.push(categoryError);
      } else {
        sanitizedArgs.category = parsedArgs.category.toLowerCase();
      }
    }

    // Validate limit (optional)
    if (parsedArgs.limit !== undefined) {
      const limitError = this.validateNumber(parsedArgs.limit, 'limit', false, 1, 50);
      if (limitError) {
        errors.push(limitError);
      } else {
        sanitizedArgs.limit = parseInt(parsedArgs.limit.toString());
      }
    } else {
      sanitizedArgs.limit = 5; // Default value
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { query, category, limit } = args as SearchArgs;
    const startTime = Date.now();

    try {
      this.logger.info(`Executing semantic search: "${query}"`, { category, limit });

      // Build the search query for Weaviate
      const searchResults = await this.performSemanticSearch(query, category, limit);
      const queryTime = Date.now() - startTime;

      // Format results for response
      const formattedText = this.formatSearchResults(searchResults);
      
      const meta = {
        total_results: searchResults.length,
        query_time_ms: queryTime,
        results: searchResults
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Search execution failed: ${errorMessage}`, { query, category, limit, error });
      return this.createErrorResponse(
        `Search failed: ${errorMessage}`,
        { query, category, limit, error: errorMessage }
      );
    }
  }

  private async performSemanticSearch(query: string, category?: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // Build Weaviate query using the correct API
      let queryBuilder = this.weaviateClient.graphql
        .get()
        .withClassName('FlutterDoc')
        .withFields('content category source section tags codeType version lastUpdated _additional { certainty distance id }')
        .withNearText({ concepts: [query] })
        .withLimit(limit);

      // Add category filter if specified
      if (category) {
        queryBuilder = queryBuilder.withWhere({
          path: ['category'],
          operator: 'Equal',
          valueText: category
        });
      }

      const response = await queryBuilder.do();
      
      if (response.errors) {
        throw new Error(`Weaviate query failed: ${JSON.stringify(response.errors)}`);
      }

      const documents = response.data?.Get?.FlutterDoc || [];
      
      // Transform Weaviate results to SearchResult format
      return documents.map((doc: any, index: number): SearchResult => ({
        id: doc._additional?.id || `result_${index}`,
        title: this.extractTitle(doc.content, doc.section),
        content: this.truncateContent(doc.content, 500),
        category: doc.category || 'general',
        relevance_score: doc._additional?.certainty || 0,
        metadata: {
          source: doc.source,
          section: doc.section,
          tags: doc.tags || [],
          codeType: doc.codeType
        }
      }));

    } catch (error) {
      this.logger.error('Weaviate search error', { error, query, category, limit });
      throw new Error(`Database search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private extractTitle(content: string, section?: string): string {
    if (section) {
      return section;
    }

    // Extract first line or first sentence as title
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
      return firstLine.replace(/^#+\s*/, ''); // Remove markdown headers
    }

    // Extract first sentence
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence;
    }

    return 'Flutter Documentation';
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at word boundary
    const truncated = content.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  }

  private formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'Search Results:\n\nNo matching documents found. Try refining your search query or removing category filters.';
    }

    let formatted = `Search Results:\n\nFound ${results.length} relevant document${results.length === 1 ? '' : 's'}:\n\n`;

    results.forEach((result, index) => {
      const relevancePercent = Math.round(result.relevance_score * 100);
      
      formatted += `${index + 1}. **${result.title}**\n`;
      formatted += `   Category: ${result.category}\n`;
      formatted += `   Relevance: ${relevancePercent}%\n`;
      formatted += `   Content: ${result.content}\n`;
      
      if (result.metadata.tags && result.metadata.tags.length > 0) {
        formatted += `   Tags: ${result.metadata.tags.join(', ')}\n`;
      }
      
      if (result.metadata.codeType) {
        formatted += `   Type: ${result.metadata.codeType}\n`;
      }
      
      formatted += '\n';
    });

    // Add search tips if results are limited
    if (results.length > 0) {
      formatted += '---\n';
      formatted += 'Use get_snippet to retrieve full code examples, or get_related to find additional documentation.\n';
    }

    return formatted;
  }
}