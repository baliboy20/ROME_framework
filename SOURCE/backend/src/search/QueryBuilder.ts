/**
 * QueryBuilder Implementation
 * Builds Weaviate-compatible queries from search parameters and filters
 */

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

interface WeaviateQuery {
  query: string;
  filters: Record<string, any>;
  limit: number;
  offset: number;
  similarity: number;
}

export class QueryBuilder {
  private readonly defaultLimit = 20;
  private readonly defaultOffset = 0;
  private readonly defaultSimilarity = 0.7;

  private buildWhereFilter(params: SearchParams, filters: SearchFilters): Record<string, any> {
    const conditions: any[] = [];

    // Language filter from params
    if (params.language) {
      conditions.push({
        path: ['language'],
        operator: 'Equal',
        valueText: params.language
      });
    }

    // Category filter from params
    if (params.categories && params.categories.length > 0) {
      if (params.categories.length === 1) {
        conditions.push({
          path: ['category'],
          operator: 'Equal',
          valueText: params.categories[0]
        });
      } else {
        // Multiple categories - use OR condition
        const categoryConditions = params.categories.map(category => ({
          path: ['category'],
          operator: 'Equal',
          valueText: category
        }));
        conditions.push({
          operator: 'Or',
          operands: categoryConditions
        });
      }
    }

    // Code type filter
    if (filters.codeType) {
      conditions.push({
        path: ['codeType'],
        operator: 'Equal',
        valueText: filters.codeType
      });
    }

    // Complexity filter
    if (filters.complexity) {
      conditions.push({
        path: ['complexity'],
        operator: 'Equal',
        valueText: filters.complexity
      });
    }

    // Framework filters
    if (filters.frameworks && filters.frameworks.length > 0) {
      const frameworkConditions = filters.frameworks.map(framework => ({
        path: ['frameworks'],
        operator: 'ContainsAny',
        valueTextArray: [framework]
      }));
      
      if (frameworkConditions.length === 1) {
        conditions.push(frameworkConditions[0]);
      } else {
        conditions.push({
          operator: 'Or',
          operands: frameworkConditions
        });
      }
    }

    // Tag filters
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => ({
        path: ['tags'],
        operator: 'ContainsAny',
        valueTextArray: [tag]
      }));
      
      if (tagConditions.length === 1) {
        conditions.push(tagConditions[0]);
      } else {
        conditions.push({
          operator: 'And', // AND for tags (document must have all specified tags)
          operands: tagConditions
        });
      }
    }

    // Date range filter
    if (filters.dateRange) {
      if (filters.dateRange.from) {
        conditions.push({
          path: ['lastUpdated'],
          operator: 'GreaterThanEqual',
          valueDate: filters.dateRange.from.toISOString()
        });
      }
      if (filters.dateRange.to) {
        conditions.push({
          path: ['lastUpdated'],
          operator: 'LessThanEqual',
          valueDate: filters.dateRange.to.toISOString()
        });
      }
    }

    // Combine all conditions with AND
    if (conditions.length === 0) {
      return {};
    } else if (conditions.length === 1) {
      return { where: conditions[0] };
    } else {
      return {
        where: {
          operator: 'And',
          operands: conditions
        }
      };
    }
  }

  private buildNearTextClause(query: string, similarity: number): Record<string, any> {
    return {
      nearText: {
        concepts: [query],
        distance: 1 - similarity // Weaviate uses distance (lower = more similar)
      }
    };
  }

  private buildFieldsClause(): string[] {
    return [
      'content',
      'category', 
      'subcategory',
      'source',
      'section',
      'tags',
      'codeType',
      'version',
      'lastUpdated',
      '_additional { id score }'
    ];
  }

  private sanitizeQuery(query: string): string {
    // Remove special characters that might interfere with Weaviate queries
    return query
      .replace(/[{}[\]()]/g, ' ') // Remove brackets and parentheses
      .replace(/[^\w\s-_.]/g, ' ') // Keep only word chars, spaces, hyphens, underscores, dots
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private determineSimilarityThreshold(query: string, filters: SearchFilters): number {
    let similarity = this.defaultSimilarity;

    // Adjust similarity based on query specificity
    const queryWords = query.split(' ').length;
    if (queryWords === 1) {
      similarity = 0.6; // Lower threshold for single-word queries
    } else if (queryWords > 5) {
      similarity = 0.8; // Higher threshold for complex queries
    }

    // Adjust based on filters - more filters = can afford lower similarity
    const filterCount = Object.values(filters).filter(v => v !== undefined && v !== null).length;
    if (filterCount > 2) {
      similarity = Math.max(0.5, similarity - 0.1);
    }

    return similarity;
  }

  build(params: SearchParams, filters: SearchFilters = {}): WeaviateQuery {
    if (!params.query || params.query.trim().length === 0) {
      throw new Error('Query parameter is required and cannot be empty');
    }

    const sanitizedQuery = this.sanitizeQuery(params.query);
    const limit = params.limit || this.defaultLimit;
    const offset = params.offset || this.defaultOffset;
    const similarity = this.determineSimilarityThreshold(sanitizedQuery, filters);

    // Build the complete Weaviate query structure
    const whereFilter = this.buildWhereFilter(params, filters);
    const nearTextClause = this.buildNearTextClause(sanitizedQuery, similarity);
    const fields = this.buildFieldsClause();

    // Combine into final query structure
    const weaviateQuery: WeaviateQuery = {
      query: sanitizedQuery,
      filters: {
        class: 'FlutterDoc',
        fields,
        ...nearTextClause,
        ...whereFilter,
        limit,
        offset
      },
      limit,
      offset,
      similarity
    };

    return weaviateQuery;
  }

  // Utility method to build a simple text search without filters
  buildSimpleTextSearch(query: string, limit: number = 10): WeaviateQuery {
    return this.build(
      { query, limit },
      {}
    );
  }

  // Utility method to build category-specific search
  buildCategorySearch(query: string, categories: string[], limit: number = 10): WeaviateQuery {
    return this.build(
      { query, categories, limit },
      {}
    );
  }

  // Utility method to build framework-specific search
  buildFrameworkSearch(query: string, frameworks: string[], limit: number = 10): WeaviateQuery {
    return this.build(
      { query, limit },
      { frameworks }
    );
  }

  // Utility method to build code-type specific search
  buildCodeTypeSearch(query: string, codeType: 'snippet' | 'template' | 'pattern', limit: number = 10): WeaviateQuery {
    return this.build(
      { query, limit },
      { codeType }
    );
  }
}