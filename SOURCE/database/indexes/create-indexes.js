/**
 * Database Index Creation Script
 * Medium Flutter Link Extractor - Performance Optimization
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 * 
 * Creates optimized indexes for MongoDB collections based on query patterns
 * and performance requirements from SRS (target: <50ms p95 for indexed queries)
 */

import { MongoClient } from 'mongodb';

/**
 * Article Collection Indexes
 * Optimized for common query patterns:
 * - URL deduplication (urlHash unique)
 * - Date-based filtering (emailDate, scrapedAt)
 * - Status-based queries (status, scrapeAttempts)
 * - Full-text search (title, content, keywords)
 * - Categorization (tags, category, author)
 */
export const ARTICLE_INDEXES = [
  // UNIQUE INDEXES - Data integrity
  {
    name: 'idx_articles_urlhash_unique',
    spec: { urlHash: 1 },
    options: { 
      unique: true,
      background: true,
      name: 'idx_articles_urlhash_unique'
    },
    description: 'Unique constraint for URL deduplication via SHA-256 hash'
  },

  // SINGLE FIELD INDEXES - High frequency queries
  {
    name: 'idx_articles_emaildate_desc',
    spec: { emailDate: -1 },
    options: { 
      background: true,
      name: 'idx_articles_emaildate_desc'
    },
    description: 'Date-based filtering for recent articles (most common query)'
  },
  {
    name: 'idx_articles_scrapedat_desc',
    spec: { scrapedAt: -1 },
    options: { 
      background: true,
      name: 'idx_articles_scrapedat_desc'
    },
    description: 'Scraping timestamp for processing order'
  },
  {
    name: 'idx_articles_status',
    spec: { status: 1 },
    options: { 
      background: true,
      name: 'idx_articles_status'
    },
    description: 'Status filtering for processing workflow'
  },
  {
    name: 'idx_articles_category',
    spec: { category: 1 },
    options: { 
      background: true,
      name: 'idx_articles_category'
    },
    description: 'Category-based filtering (flutter, dart, mobile, web, general)'
  },
  {
    name: 'idx_articles_author_name',
    spec: { 'author.name': 1 },
    options: { 
      background: true,
      name: 'idx_articles_author_name',
      sparse: true // Only index documents with author.name
    },
    description: 'Author-based filtering'
  },

  // COMPOUND INDEXES - Complex query optimization
  {
    name: 'idx_articles_status_emaildate',
    spec: { status: 1, emailDate: -1 },
    options: { 
      background: true,
      name: 'idx_articles_status_emaildate'
    },
    description: 'Status + date filtering (admin dashboard queries)'
  },
  {
    name: 'idx_articles_category_emaildate',
    spec: { category: 1, emailDate: -1 },
    options: { 
      background: true,
      name: 'idx_articles_category_emaildate'
    },
    description: 'Category + date filtering (user browsing)'
  },
  {
    name: 'idx_articles_status_attempts',
    spec: { status: 1, scrapeAttempts: 1 },
    options: { 
      background: true,
      name: 'idx_articles_status_attempts'
    },
    description: 'Failed scraping retry logic optimization'
  },

  // ARRAY INDEXES - Tag and keyword searches
  {
    name: 'idx_articles_tags',
    spec: { tags: 1 },
    options: { 
      background: true,
      name: 'idx_articles_tags'
    },
    description: 'Tag-based filtering (user-defined tags)'
  },
  {
    name: 'idx_articles_keywords',
    spec: { keywords: 1 },
    options: { 
      background: true,
      name: 'idx_articles_keywords'
    },
    description: 'Keyword-based filtering (extracted keywords)'
  },

  // TEXT SEARCH INDEX - Full-text search capability
  {
    name: 'idx_articles_text_search',
    spec: { 
      title: 'text', 
      content: 'text', 
      keywords: 'text',
      'author.name': 'text'
    },
    options: { 
      background: true,
      name: 'idx_articles_text_search',
      weights: {
        title: 10,      // Title matches are most important
        keywords: 5,    // Keywords are highly relevant
        'author.name': 3, // Author names are moderately important
        content: 1      // Content is least weighted (but searchable)
      },
      default_language: 'english'
    },
    description: 'Full-text search across title, content, keywords, and author'
  }
];

/**
 * Email Digest Collection Indexes
 * Optimized for:
 * - Message ID uniqueness (messageId unique)
 * - Date-based processing (date desc)
 * - Status tracking (status)
 * - Processing workflow (status + date)
 */
export const EMAIL_DIGEST_INDEXES = [
  // UNIQUE INDEXES - Data integrity
  {
    name: 'idx_emaildigests_messageid_unique',
    spec: { messageId: 1 },
    options: { 
      unique: true,
      background: true,
      name: 'idx_emaildigests_messageid_unique'
    },
    description: 'Unique constraint for Gmail message ID'
  },

  // SINGLE FIELD INDEXES - Common queries
  {
    name: 'idx_emaildigests_date_desc',
    spec: { date: -1 },
    options: { 
      background: true,
      name: 'idx_emaildigests_date_desc'
    },
    description: 'Date-based ordering for email processing'
  },
  {
    name: 'idx_emaildigests_status',
    spec: { status: 1 },
    options: { 
      background: true,
      name: 'idx_emaildigests_status'
    },
    description: 'Status-based filtering for processing workflow'
  },
  {
    name: 'idx_emaildigests_processedat_desc',
    spec: { processedAt: -1 },
    options: { 
      background: true,
      name: 'idx_emaildigests_processedat_desc'
    },
    description: 'Processing timestamp for monitoring'
  },

  // COMPOUND INDEXES - Complex queries
  {
    name: 'idx_emaildigests_status_date',
    spec: { status: 1, date: -1 },
    options: { 
      background: true,
      name: 'idx_emaildigests_status_date'
    },
    description: 'Status + date for processing queue optimization'
  },
  {
    name: 'idx_emaildigests_sender_date',
    spec: { 'sender.email': 1, date: -1 },
    options: { 
      background: true,
      name: 'idx_emaildigests_sender_date'
    },
    description: 'Sender-based filtering with date ordering'
  },

  // SPARSE INDEXES - Optional fields
  {
    name: 'idx_emaildigests_threadid',
    spec: { threadId: 1 },
    options: { 
      background: true,
      name: 'idx_emaildigests_threadid',
      sparse: true // Only index documents with threadId
    },
    description: 'Thread-based grouping (when available)'
  }
];

/**
 * Index Creation Function
 * Creates all indexes for the application with proper error handling
 */
export async function createAllIndexes(db, options = {}) {
  const { verbose = false, dryRun = false } = options;
  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  // Helper function to create indexes for a collection
  const createCollectionIndexes = async (collectionName, indexes) => {
    const collection = db.collection(collectionName);
    
    if (verbose) {
      console.log(`\n📊 Creating indexes for ${collectionName} collection:`);
    }

    for (const indexDef of indexes) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would create index: ${indexDef.name}`);
          results.created.push(`${collectionName}.${indexDef.name} (dry run)`);
          continue;
        }

        // Check if index already exists
        const existingIndexes = await collection.listIndexes().toArray();
        const indexExists = existingIndexes.some(idx => idx.name === indexDef.name);

        if (indexExists) {
          if (verbose) {
            console.log(`  ⏭️  Skipping ${indexDef.name} (already exists)`);
          }
          results.skipped.push(`${collectionName}.${indexDef.name}`);
          continue;
        }

        // Create the index
        const startTime = Date.now();
        await collection.createIndex(indexDef.spec, indexDef.options);
        const duration = Date.now() - startTime;

        if (verbose) {
          console.log(`  ✅ Created ${indexDef.name} (${duration}ms)`);
          console.log(`     ${indexDef.description}`);
        }

        results.created.push(`${collectionName}.${indexDef.name}`);

      } catch (error) {
        const errorMsg = `Failed to create ${collectionName}.${indexDef.name}: ${error.message}`;
        console.error(`  ❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
  };

  try {
    // Create indexes for articles collection
    await createCollectionIndexes('articles', ARTICLE_INDEXES);
    
    // Create indexes for emailDigests collection
    await createCollectionIndexes('emailDigests', EMAIL_DIGEST_INDEXES);

    return results;

  } catch (error) {
    console.error('❌ Fatal error during index creation:', error.message);
    throw error;
  }
}

/**
 * Index Analysis Function
 * Analyzes query performance and index usage
 */
export async function analyzeIndexUsage(db) {
  const collections = ['articles', 'emailDigests'];
  const analysis = {};

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    
    try {
      // Get index statistics
      const indexStats = await collection.aggregate([
        { $indexStats: {} }
      ]).toArray();

      // Get collection statistics
      const collStats = await db.command({ collStats: collectionName });

      analysis[collectionName] = {
        totalDocuments: collStats.count,
        totalSize: collStats.size,
        avgDocSize: collStats.avgObjSize,
        indexes: indexStats.map(stat => ({
          name: stat.name,
          usageCount: stat.accesses?.ops || 0,
          usageSince: stat.accesses?.since || null,
          spec: stat.spec
        }))
      };

    } catch (error) {
      console.error(`Error analyzing ${collectionName}:`, error.message);
      analysis[collectionName] = { error: error.message };
    }
  }

  return analysis;
}

/**
 * Drop All Indexes Function
 * Utility function to drop all custom indexes (keeps _id index)
 */
export async function dropAllIndexes(db, options = {}) {
  const { verbose = false, dryRun = false } = options;
  const results = { dropped: [], errors: [] };

  const collections = ['articles', 'emailDigests'];

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    
    try {
      if (dryRun) {
        console.log(`[DRY RUN] Would drop indexes for ${collectionName}`);
        continue;
      }

      const indexes = await collection.listIndexes().toArray();
      
      for (const index of indexes) {
        // Skip the default _id index
        if (index.name === '_id_') continue;

        await collection.dropIndex(index.name);
        
        if (verbose) {
          console.log(`  🗑️  Dropped ${collectionName}.${index.name}`);
        }
        
        results.dropped.push(`${collectionName}.${index.name}`);
      }

    } catch (error) {
      const errorMsg = `Failed to drop indexes for ${collectionName}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      results.errors.push(errorMsg);
    }
  }

  return results;
}

export default {
  createAllIndexes,
  analyzeIndexUsage,
  dropAllIndexes,
  ARTICLE_INDEXES,
  EMAIL_DIGEST_INDEXES
};