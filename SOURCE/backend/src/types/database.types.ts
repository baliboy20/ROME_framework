import { ObjectId } from 'mongodb';

export interface Article {
  _id?: ObjectId;
  title: string;
  url: string;
  urlHash: string;
  content: string;
  rawHtml?: string;
  
  // Metadata
  emailDate: Date;
  scrapedAt: Date;
  lastUpdated: Date;
  wordCount: number;
  readingTime: string;
  
  // Author information
  author?: {
    name?: string | undefined;
    url?: string | undefined;
    avatar?: string | undefined;
  } | undefined;
  
  // Categorization
  keywords: string[];
  tags: string[];
  category: 'flutter' | 'dart' | 'mobile' | 'web' | 'general';
  
  // Source tracking
  sourceEmail: {
    id: string;
    subject: string;
    date: Date;
  };
  
  // File system
  filePath: string;
  
  // Status
  status: 'pending' | 'scraped' | 'failed' | 'archived';
  scrapeAttempts: number;
  lastError?: string | undefined;
}

export interface EmailDigest {
  _id?: ObjectId;
  messageId: string;
  threadId?: string;
  
  // Email metadata
  subject: string;
  date: Date;
  processedAt: Date;
  
  // Sender information
  sender: {
    email: string;
    name?: string | undefined;
  };
  
  // Content
  bodyPreview?: string;
  htmlContent?: string;
  markdownContent?: string;
  
  // Link extraction
  linksFound: number;
  flutterLinks: string[];
  allLinks: string[];
  linksByDomain?: Map<string, string[]>;
  
  // Status
  status: 'discovered' | 'processed' | 'failed' | 'skipped';
  articles: ObjectId[];
  
  // Processing metadata
  processingTime?: number;
  errorMessage?: string;
  retryCount: number;
  matchedFilters: string[];
}

export interface EmailFilter {
  subject?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  keywords: string[];
  maxResults?: number;
}