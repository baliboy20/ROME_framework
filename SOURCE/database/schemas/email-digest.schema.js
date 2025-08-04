/**
 * Email Digest Collection Schema Definition
 * Medium Flutter Link Extractor - Database Design Module
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 */

import { ObjectId } from 'mongodb';

/**
 * Email Digest Document Schema
 * Tracks processed Medium Daily Digest emails
 */
export const EmailDigestSchema = {
  _id: ObjectId,
  
  // Gmail identifiers
  messageId: {
    type: String,
    required: true,
    unique: true, // Gmail message ID is unique
    index: true
  },
  threadId: {
    type: String,
    required: false // Gmail thread ID for grouping
  },
  
  // Email metadata
  subject: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  processedAt: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  
  // Sender information
  sender: {
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: false
    }
  },
  
  // Content analysis
  bodyPreview: {
    type: String,
    required: false,
    maxLength: 500 // First 500 chars for quick reference
  },
  htmlContent: {
    type: String,
    required: false // Full HTML content if needed
  },
  
  // Link extraction results
  linksFound: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  flutterLinks: {
    type: [String],
    required: true,
    default: [] // Medium URLs related to Flutter
  },
  allLinks: {
    type: [String],
    required: true,
    default: [] // All extracted URLs
  },
  
  // Link categorization
  linksByDomain: {
    type: Map,
    of: [String],
    default: new Map() // Domain -> URLs mapping
  },
  
  // Processing status
  status: {
    type: String,
    required: true,
    enum: ['discovered', 'processed', 'failed', 'skipped'],
    default: 'discovered',
    index: true
  },
  
  // Related articles
  articles: {
    type: [ObjectId],
    required: true,
    default: [], // References to Article documents
    ref: 'articles'
  },
  
  // Processing metadata
  processingTime: {
    type: Number,
    required: false, // Time in milliseconds
    min: 0
  },
  errorMessage: {
    type: String,
    required: false // Error details if processing failed
  },
  retryCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 3
  },
  
  // Email filters that matched
  matchedFilters: {
    type: [String],
    required: true,
    default: [] // Names of filters that identified this email
  }
};

/**
 * Email Digest Document Validation Rules
 */
export const EmailDigestValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["messageId", "subject", "date", "sender", "linksFound", "status"],
    properties: {
      messageId: {
        bsonType: "string",
        minLength: 1,
        description: "Gmail message ID must be a non-empty string"
      },
      subject: {
        bsonType: "string",
        minLength: 1,
        maxLength: 1000,
        description: "Email subject must be between 1 and 1000 characters"
      },
      date: {
        bsonType: "date",
        description: "Must be a valid date"
      },
      processedAt: {
        bsonType: "date",
        description: "Must be a valid date"
      },
      sender: {
        bsonType: "object",
        required: ["email"],
        properties: {
          email: {
            bsonType: "string",
            pattern: "^[^@]+@[^@]+\\.[^@]+$",
            description: "Must be a valid email address"
          },
          name: {
            bsonType: "string",
            maxLength: 200,
            description: "Sender name must be under 200 characters"
          }
        }
      },
      linksFound: {
        bsonType: "int",
        minimum: 0,
        maximum: 1000,
        description: "Links found must be between 0 and 1000"
      },
      status: {
        bsonType: "string",
        enum: ["discovered", "processed", "failed", "skipped"],
        description: "Must be one of the predefined status values"
      },
      retryCount: {
        bsonType: "int",
        minimum: 0,
        maximum: 3,
        description: "Retry count must be between 0 and 3"
      }
    }
  }
};

/**
 * Default Email Digest Document Factory
 */
export const createEmailDigestDocument = (data) => {
  const now = new Date();
  
  return {
    _id: new ObjectId(),
    messageId: data.messageId,
    threadId: data.threadId || null,
    
    // Email metadata
    subject: data.subject,
    date: data.date,
    processedAt: data.processedAt || now,
    
    // Sender information
    sender: {
      email: data.sender.email,
      name: data.sender.name || null
    },
    
    // Content
    bodyPreview: data.bodyPreview || null,
    htmlContent: data.htmlContent || null,
    
    // Link extraction with defaults
    linksFound: data.linksFound || 0,
    flutterLinks: data.flutterLinks || [],
    allLinks: data.allLinks || [],
    linksByDomain: data.linksByDomain || new Map(),
    
    // Status with defaults
    status: data.status || 'discovered',
    articles: data.articles || [],
    
    // Processing metadata with defaults
    processingTime: data.processingTime || null,
    errorMessage: data.errorMessage || null,
    retryCount: data.retryCount || 0,
    matchedFilters: data.matchedFilters || []
  };
};

/**
 * Email Digest Update Helper
 * Updates an existing digest with processing results
 */
export const updateEmailDigestWithResults = (digest, results) => {
  return {
    ...digest,
    linksFound: results.linksFound,
    flutterLinks: results.flutterLinks,
    allLinks: results.allLinks,
    linksByDomain: results.linksByDomain,
    articles: results.articles,
    status: results.status || 'processed',
    processedAt: new Date(),
    processingTime: results.processingTime,
    errorMessage: results.errorMessage || null
  };
};