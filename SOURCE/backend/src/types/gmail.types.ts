import { gmail_v1 } from 'googleapis';

export interface GmailMessage {
  id: string;
  threadId?: string;
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: gmail_v1.Schema$MessagePart;
  sizeEstimate?: number;
  raw?: string;
}

export interface EmailContent {
  messageId: string;
  threadId?: string | undefined;
  subject: string;
  date: Date;
  sender: {
    email: string;
    name?: string | undefined;
  };
  bodyText?: string | undefined;
  bodyHtml?: string | undefined;
  snippet?: string | undefined;
}

export interface EmailFilterOptions {
  subject?: string;
  from?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  keywords?: string[];
  maxResults?: number;
  includeSpamTrash?: boolean;
}

export interface LinkExtractionResult {
  allLinks: string[];
  flutterLinks: string[];
  linksByDomain: Map<string, string[]>;
  linksFound: number;
}

export interface ProcessedEmail {
  messageId: string;
  subject: string;
  date: Date;
  sender: {
    email: string;
    name?: string | undefined;
  };
  bodyPreview?: string | undefined;
  htmlContent?: string | undefined;
  markdownContent?: string | undefined;
  links: LinkExtractionResult;
  processingTime: number;
}