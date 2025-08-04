/**
 * Article Collection Schema Definition
 * Medium Flutter Link Extractor - Database Design Module
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 */

import { ObjectId } from 'mongodb';

/**
 * Article Document Schema
 * Represents a scraped Medium article with full metadata
 */
export const ArticleSchema = {
  _id: ObjectId,
  
  // Core content
  title: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    unique: false // Not unique as same URL might be in multiple emails
  },
  urlHash: {
    type: String,
    required: true,
    unique: true, // SHA-256 hash for deduplication
    index: true
  },
  content: {
    type: String,
    required: true
  },
  rawHtml: {
    type: String,
    required: false // Optional - original HTML for debugging
  },

  // Metadata
  emailDate: {
    type: Date,
    required: true,
    index: true
  },
  scrapedAt: {
    type: Date,
    required: true,
    default: () => new Date(),
    index: true
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  wordCount: {
    type: Number,
    required: true,
    min: 0
  },
  readingTime: {
    type: String,
    required: true // Format: "5 min read"
  },

  // Author information
  author: {
    name: {
      type: String,
      required: false,
      index: true
    },
    url: {
      type: String,
      required: false
    },
    avatar: {
      type: String,
      required: false
    }
  },

  // Categorization
  keywords: {
    type: [String],
    required: true,
    default: [],
    index: true
  },
  tags: {
    type: [String],
    required: true,
    default: [],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['flutter', 'dart', 'mobile', 'web', 'general'],
    default: 'general',
    index: true
  },

  // Source tracking
  sourceEmail: {
    id: {
      type: String,
      required: true // Gmail message ID
    },
    subject: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  },

  // File system
  filePath: {
    type: String,
    required: true // Relative path in storage
  },

  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'scraped', 'failed', 'archived'],
    default: 'pending',
    index: true
  },
  scrapeAttempts: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 3
  },
  lastError: {
    type: String,
    required: false // Error message from last failed attempt
  }
};

/**
 * Article Document Validation Rules
 */
export const ArticleValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["title", "url", "urlHash", "content", "emailDate", "wordCount", "readingTime", "category", "sourceEmail", "filePath", "status"],
    properties: {
      title: {
        bsonType: "string",
        minLength: 1,
        maxLength: 500,
        description: "Article title must be a non-empty string"
      },
      url: {
        bsonType: "string",
        pattern: "^https?://",
        description: "Must be a valid HTTP/HTTPS URL"
      },
      urlHash: {
        bsonType: "string",
        pattern: "^[a-f0-9]{64}$",
        description: "Must be a valid SHA-256 hash"
      },
      content: {
        bsonType: "string",
        minLength: 1,
        description: "Article content cannot be empty"
      },
      emailDate: {
        bsonType: "date",
        description: "Must be a valid date"
      },
      scrapedAt: {
        bsonType: "date",
        description: "Must be a valid date"
      },
      wordCount: {
        bsonType: "int",
        minimum: 0,
        maximum: 50000,
        description: "Word count must be between 0 and 50000"
      },
      readingTime: {
        bsonType: "string",
        pattern: "^\\d+ min read$",
        description: "Must match pattern '5 min read'"
      },
      category: {
        bsonType: "string",
        enum: ["flutter", "dart", "mobile", "web", "general"],
        description: "Must be one of the predefined categories"
      },
      status: {
        bsonType: "string",
        enum: ["pending", "scraped", "failed", "archived"],
        description: "Must be one of the predefined status values"
      },
      scrapeAttempts: {
        bsonType: "int",
        minimum: 0,
        maximum: 3,
        description: "Scrape attempts must be between 0 and 3"
      }
    }
  }
};

/**
 * Default Article Document Factory
 */
export const createArticleDocument = (data) => {
  const now = new Date();
  
  return {
    _id: new ObjectId(),
    title: data.title,
    url: data.url,
    urlHash: data.urlHash,
    content: data.content,
    rawHtml: data.rawHtml || null,
    
    // Metadata with defaults
    emailDate: data.emailDate,
    scrapedAt: data.scrapedAt || now,
    lastUpdated: now,
    wordCount: data.wordCount,
    readingTime: data.readingTime,
    
    // Author with defaults
    author: {
      name: data.author?.name || null,
      url: data.author?.url || null,
      avatar: data.author?.avatar || null
    },
    
    // Categorization with defaults
    keywords: data.keywords || [],
    tags: data.tags || [],
    category: data.category || 'general',
    
    // Source tracking
    sourceEmail: {
      id: data.sourceEmail.id,
      subject: data.sourceEmail.subject,
      date: data.sourceEmail.date
    },
    
    // File system
    filePath: data.filePath,
    
    // Status with defaults
    status: data.status || 'pending',
    scrapeAttempts: data.scrapeAttempts || 0,
    lastError: data.lastError || null
  };
};