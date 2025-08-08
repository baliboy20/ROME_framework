/**
 * QueryBuilder - Search query builder implementation
 * Backend Engineer: Reena
 */

class QueryBuilder {
  build(params, filters = {}) {
    // Build base query object
    const query = {
      query: params.query || '',
      limit: params.limit || 20,
      offset: params.offset || 0,
      similarity: params.similarity || 0.7,
      filters: {}
    };

    // Apply filters from the filters parameter
    if (filters && Object.keys(filters).length > 0) {
      Object.assign(query.filters, filters);
    }

    // Apply filters from params
    if (params.categories) {
      query.filters.categories = params.categories;
    }

    if (params.language) {
      query.filters.language = params.language;
    }

    // Handle nearText search
    if (params.nearText) {
      query.nearText = {
        concepts: [params.nearText],
        certainty: params.certainty || 0.7
      };
    }

    // Handle nearVector search
    if (params.nearVector) {
      query.nearVector = {
        vector: params.nearVector,
        certainty: params.certainty || 0.7
      };
    }

    return query;
  }

  buildFilters(filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return null;
    }

    const whereClause = {
      operator: 'And',
      operands: []
    };

    Object.entries(filters).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        // Handle array values with OR
        whereClause.operands.push({
          operator: 'Or',
          operands: value.map(v => ({
            path: [field],
            operator: 'Equal',
            valueString: v.toString()
          }))
        });
      } else if (typeof value === 'object' && value !== null) {
        // Handle range queries
        if (value.min !== undefined || value.max !== undefined) {
          if (value.min !== undefined) {
            whereClause.operands.push({
              path: [field],
              operator: 'GreaterThanEqual',
              valueNumber: value.min
            });
          }
          if (value.max !== undefined) {
            whereClause.operands.push({
              path: [field],
              operator: 'LessThanEqual',
              valueNumber: value.max
            });
          }
        }
      } else {
        // Handle simple equality
        whereClause.operands.push({
          path: [field],
          operator: 'Equal',
          valueString: value.toString()
        });
      }
    });

    return whereClause.operands.length > 0 ? whereClause : null;
  }

  buildTextSearch(text, options = {}) {
    return this.build({
      nearText: text,
      certainty: options.certainty || 0.7,
      limit: options.limit || 10,
      filters: options.filters
    });
  }

  buildVectorSearch(vector, options = {}) {
    return this.build({
      nearVector: vector,
      certainty: options.certainty || 0.7,
      limit: options.limit || 10,
      filters: options.filters
    });
  }

  buildHybridSearch(text, vector, options = {}) {
    const query = this.build({
      nearText: text,
      limit: options.limit || 10,
      filters: options.filters
    });

    // Add vector similarity as additional ranking factor
    if (vector) {
      query.hybrid = {
        vector: vector,
        weight: options.vectorWeight || 0.5
      };
    }

    return query;
  }
}

module.exports = { QueryBuilder };