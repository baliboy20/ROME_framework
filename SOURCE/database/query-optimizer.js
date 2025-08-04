/**
 * Query Optimization Patterns
 * Medium Flutter Link Extractor - Database Performance Layer
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 * 
 * Provides optimized query patterns for common operations:
 * - Efficient filtering and sorting
 * - Pagination strategies
 * - Aggregation pipelines
 * - Full-text search optimization
 * - Cache-friendly queries
 * - Performance monitoring
 */

import crypto from 'crypto';

/**
 * Query Performance Analyzer
 * Monitors and optimizes query execution
 */
export class QueryOptimizer {
  constructor(db, options = {}) {
    this.db = db;
    this.options = {
      enableProfiling: options.enableProfiling || false,
      slowQueryThreshold: options.slowQueryThreshold || 100, // ms
      cacheEnabled: options.cacheEnabled || true,
      cacheTTL: options.cacheTTL || 300000, // 5 minutes
      ...options
    };
    
    this.queryCache = new Map();
    this.performanceMetrics = {
      totalQueries: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Execute optimized query with caching and performance monitoring
   */
  async executeQuery(collection, pipeline, options = {}) {
    const startTime = Date.now();
    const cacheKey = this._generateCacheKey(collection, pipeline, options);
    
    // Check cache first
    if (this.options.cacheEnabled && options.cache !== false) {
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        this.performanceMetrics.cacheHits++;
        return cached;
      }
      this.performanceMetrics.cacheMisses++;
    }

    try {
      // Execute query
      const result = await this._executeWithProfiling(collection, pipeline, options);
      
      // Cache result if applicable
      if (this.options.cacheEnabled && options.cache !== false && result) {
        this._setCache(cacheKey, result, options.cacheTTL);
      }

      // Update metrics
      const executionTime = Date.now() - startTime;
      this._updateMetrics(executionTime);

      return result;

    } catch (error) {
      console.error(`Query execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Optimized article queries
   */
  get articles() {
    return new ArticleQueries(this.db, this);
  }

  /**
   * Optimized email digest queries
   */
  get emailDigests() {
    return new EmailDigestQueries(this.db, this);
  }

  /**
   * Get query performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      cacheSize: this.queryCache.size,
      cacheHitRate: this.performanceMetrics.totalQueries > 0 
        ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalQueries * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
  }

  /**
   * Execute query with profiling if enabled
   */
  async _executeWithProfiling(collectionName, pipeline, options) {
    const collection = this.db.collection(collectionName);
    
    if (this.options.enableProfiling) {
      // Enable profiling for this query
      const result = await collection.aggregate(pipeline, {
        ...options,
        explain: false // We'll use a different approach for profiling
      }).toArray();
      
      return result;
    } else {
      return collection.aggregate(pipeline, options).toArray();
    }
  }

  /**
   * Generate cache key for query
   */
  _generateCacheKey(collection, pipeline, options) {
    const content = JSON.stringify({ collection, pipeline, options });
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get result from cache
   */
  _getFromCache(key) {
    const cached = this.queryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    } else if (cached) {
      this.queryCache.delete(key);
    }
    return null;
  }

  /**
   * Set result in cache
   */
  _setCache(key, data, ttl = this.options.cacheTTL) {
    this.queryCache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  /**
   * Update performance metrics
   */
  _updateMetrics(executionTime) {
    this.performanceMetrics.totalQueries++;
    
    if (executionTime > this.options.slowQueryThreshold) {
      this.performanceMetrics.slowQueries++;
    }

    const total = this.performanceMetrics.totalQueries;
    const currentAvg = this.performanceMetrics.averageExecutionTime;
    this.performanceMetrics.averageExecutionTime = 
      ((currentAvg * (total - 1)) + executionTime) / total;
  }
}

/**
 * Optimized Article Queries
 */
export class ArticleQueries {
  constructor(db, optimizer) {
    this.db = db;
    this.optimizer = optimizer;
    this.collection = 'articles';
  }

  /**
   * Get articles with efficient pagination
   * Uses cursor-based pagination for better performance
   */
  async getArticlesPaginated(options = {}) {
    const {
      limit = 20,
      cursor = null, // Last article's _id from previous page
      sortBy = 'emailDate',
      sortOrder = -1,
      filters = {},
      includeCounts = false
    } = options;

    const pipeline = [];

    // Apply filters
    const matchStage = this._buildMatchStage(filters);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Apply cursor for pagination
    if (cursor) {
      const cursorCondition = sortOrder === 1 
        ? { [sortBy]: { $gt: cursor } }
        : { [sortBy]: { $lt: cursor } };
      pipeline.push({ $match: cursorCondition });
    }

    // Sort
    pipeline.push({ $sort: { [sortBy]: sortOrder, _id: sortOrder } });

    // Limit
    pipeline.push({ $limit: limit + 1 }); // +1 to check if there's a next page

    // Execute main query
    const articles = await this.optimizer.executeQuery(this.collection, pipeline, {
      cache: true,
      cacheTTL: 60000 // 1 minute cache for paginated results
    });

    // Check if there's a next page
    const hasNextPage = articles.length > limit;
    if (hasNextPage) {
      articles.pop(); // Remove the extra article
    }

    const result = {
      articles,
      hasNextPage,
      nextCursor: hasNextPage && articles.length > 0 
        ? articles[articles.length - 1][sortBy] 
        : null
    };

    // Add total count if requested (expensive operation)
    if (includeCounts) {
      const countPipeline = [];
      if (Object.keys(matchStage).length > 0) {
        countPipeline.push({ $match: matchStage });
      }
      countPipeline.push({ $count: 'total' });
      
      const countResult = await this.optimizer.executeQuery(this.collection, countPipeline, {
        cache: true,
        cacheTTL: 300000 // 5 minute cache for counts
      });
      
      result.totalCount = countResult[0]?.total || 0;
    }

    return result;
  }

  /**
   * Full-text search with optimization
   */
  async searchArticles(searchTerm, options = {}) {
    const {
      limit = 20,
      skip = 0,
      filters = {},
      highlightResults = false
    } = options;

    const pipeline = [];

    // Text search stage
    pipeline.push({
      $match: {
        $text: {
          $search: searchTerm,
          $caseSensitive: false,
          $diacriticSensitive: false
        }
      }
    });

    // Apply additional filters
    const additionalFilters = this._buildMatchStage(filters);
    if (Object.keys(additionalFilters).length > 0) {
      pipeline.push({ $match: additionalFilters });
    }

    // Add text score for relevance sorting
    pipeline.push({
      $addFields: {
        score: { $meta: 'textScore' }
      }
    });

    // Sort by relevance
    pipeline.push({ $sort: { score: { $meta: 'textScore' }, emailDate: -1 } });

    // Pagination
    if (skip > 0) pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute search
    const results = await this.optimizer.executeQuery(this.collection, pipeline, {
      cache: true,
      cacheTTL: 120000 // 2 minute cache for search results
    });

    return {
      articles: results,
      searchTerm,
      totalResults: results.length
    };
  }

  /**
   * Get articles by category with aggregated stats
   */
  async getArticlesByCategory(category, options = {}) {
    const {
      limit = 20,
      includeStats = false,
      dateRange = null
    } = options;

    const pipeline = [];
    
    // Match category and date range
    const matchStage = { category };
    if (dateRange) {
      matchStage.emailDate = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }
    pipeline.push({ $match: matchStage });

    if (includeStats) {
      // Group for statistics
      pipeline.push({
        $group: {
          _id: '$category',
          articles: { $push: '$$ROOT' },
          totalArticles: { $sum: 1 },
          totalWordCount: { $sum: '$wordCount' },
          avgWordCount: { $avg: '$wordCount' },
          authors: { $addToSet: '$author.name' },
          latestArticle: { $max: '$emailDate' },
          oldestArticle: { $min: '$emailDate' }
        }
      });

      // Limit articles within group
      pipeline.push({
        $addFields: {
          articles: { $slice: ['$articles', limit] }
        }
      });
    } else {
      // Simple sorting and limiting
      pipeline.push({ $sort: { emailDate: -1 } });
      pipeline.push({ $limit: limit });
    }

    return this.optimizer.executeQuery(this.collection, pipeline, {
      cache: true,
      cacheTTL: 180000 // 3 minute cache
    });
  }

  /**
   * Get article statistics by time period
   */
  async getArticleStats(period = 'daily', options = {}) {
    const {
      dateRange = null,
      categories = null
    } = options;

    const pipeline = [];

    // Match filters
    const matchStage = {};
    if (dateRange) {
      matchStage.emailDate = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }
    if (categories && categories.length > 0) {
      matchStage.category = { $in: categories };
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Group by time period
    const dateFormat = this._getDateFormat(period);
    pipeline.push({
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: '$emailDate' } },
          category: '$category'
        },
        count: { $sum: 1 },
        totalWords: { $sum: '$wordCount' },
        avgWords: { $avg: '$wordCount' },
        authors: { $addToSet: '$author.name' }
      }
    });

    // Sort by period
    pipeline.push({ $sort: { '_id.period': -1, '_id.category': 1 } });

    return this.optimizer.executeQuery(this.collection, pipeline, {
      cache: true,
      cacheTTL: 600000 // 10 minute cache for stats
    });
  }

  /**
   * Find duplicate articles (same URL hash)
   */
  async findDuplicateArticles() {
    const pipeline = [
      {
        $group: {
          _id: '$urlHash',
          articles: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      {
        $sort: { count: -1 }
      }
    ];

    return this.optimizer.executeQuery(this.collection, pipeline, {
      cache: false // Don't cache duplicate detection
    });
  }

  /**
   * Build match stage for filters
   */
  _buildMatchStage(filters) {
    const matchStage = {};

    if (filters.status) {
      matchStage.status = filters.status;
    }

    if (filters.category) {
      matchStage.category = filters.category;
    }

    if (filters.author) {
      matchStage['author.name'] = new RegExp(filters.author, 'i');
    }

    if (filters.tags && filters.tags.length > 0) {
      matchStage.tags = { $in: filters.tags };
    }

    if (filters.keywords && filters.keywords.length > 0) {
      matchStage.keywords = { $in: filters.keywords };
    }

    if (filters.dateRange) {
      matchStage.emailDate = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end)
      };
    }

    if (filters.wordCountRange) {
      matchStage.wordCount = {
        $gte: filters.wordCountRange.min,
        $lte: filters.wordCountRange.max
      };
    }

    return matchStage;
  }

  /**
   * Get date format for grouping
   */
  _getDateFormat(period) {
    switch (period) {
      case 'hourly':
        return '%Y-%m-%d %H:00';
      case 'daily':
        return '%Y-%m-%d';
      case 'weekly':
        return '%Y-W%U';
      case 'monthly':
        return '%Y-%m';
      case 'yearly':
        return '%Y';
      default:
        return '%Y-%m-%d';
    }
  }
}

/**
 * Optimized Email Digest Queries
 */
export class EmailDigestQueries {
  constructor(db, optimizer) {
    this.db = db;
    this.optimizer = optimizer;
    this.collection = 'emailDigests';
  }

  /**
   * Get recent email digests with processing status
   */
  async getRecentDigests(options = {}) {
    const {
      limit = 50,
      status = null,
      dateRange = null
    } = options;

    const pipeline = [];
    
    // Build match conditions
    const matchStage = {};
    if (status) {
      matchStage.status = status;
    }
    if (dateRange) {
      matchStage.date = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Sort by date (newest first)
    pipeline.push({ $sort: { date: -1 } });
    
    // Limit results
    pipeline.push({ $limit: limit });

    // Add article count lookup
    pipeline.push({
      $lookup: {
        from: 'articles',
        localField: 'articles',
        foreignField: '_id',
        as: 'articleDetails',
        pipeline: [
          { $project: { title: 1, status: 1 } }
        ]
      }
    });

    // Add computed fields
    pipeline.push({
      $addFields: {
        articleCount: { $size: '$articles' },
        processedArticleCount: {
          $size: {
            $filter: {
              input: '$articleDetails',
              cond: { $eq: ['$$this.status', 'scraped'] }
            }
          }
        }
      }
    });

    return this.optimizer.executeQuery(this.collection, pipeline, {
      cache: true,
      cacheTTL: 60000 // 1 minute cache
    });
  }

  /**
   * Get email digest processing statistics
   */
  async getProcessingStats(period = 'daily') {
    const pipeline = [];

    // Group by time period and status
    const dateFormat = this._getDateFormat(period);
    pipeline.push({
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: '$processedAt' } },
          status: '$status'
        },
        count: { $sum: 1 },
        totalLinks: { $sum: '$linksFound' },
        totalFlutterLinks: { $sum: { $size: '$flutterLinks' } },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    });

    // Sort by period
    pipeline.push({ $sort: { '_id.period': -1 } });

    // Group by period to get all statuses together
    pipeline.push({
      $group: {
        _id: '$_id.period',
        stats: {
          $push: {
            status: '$_id.status',
            count: '$count',
            totalLinks: '$totalLinks',
            totalFlutterLinks: '$totalFlutterLinks',
            avgProcessingTime: '$avgProcessingTime'
          }
        },
        totalEmails: { $sum: '$count' }
      }
    });

    pipeline.push({ $sort: { _id: -1 } });

    return this.optimizer.executeQuery(this.collection, pipeline, {
      cache: true,
      cacheTTL: 300000 // 5 minute cache
    });
  }

  /**
   * Find failed email processing attempts
   */
  async getFailedProcessing(options = {}) {
    const { limit = 20, includeRetryable = true } = options;

    const pipeline = [];

    // Match failed status
    const matchStage = { status: 'failed' };
    if (includeRetryable) {
      matchStage.retryCount = { $lt: 3 };
    }
    pipeline.push({ $match: matchStage });

    // Sort by processing time (oldest first for retry priority)
    pipeline.push({ $sort: { processedAt: 1 } });
    
    // Limit results
    pipeline.push({ $limit: limit });

    return this.optimizer.executeQuery(this.collection, pipeline, {
      cache: false // Don't cache failure queries
    });
  }

  /**
   * Get date format for grouping
   */
  _getDateFormat(period) {
    switch (period) {
      case 'hourly':
        return '%Y-%m-%d %H:00';
      case 'daily':
        return '%Y-%m-%d';
      case 'weekly':
        return '%Y-W%U';
      case 'monthly':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }
}

/**
 * Create and configure query optimizer instance
 */
export function createQueryOptimizer(db, options = {}) {
  return new QueryOptimizer(db, options);
}

export default {
  QueryOptimizer,
  ArticleQueries,
  EmailDigestQueries,
  createQueryOptimizer
};