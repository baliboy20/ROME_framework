import { ObjectId } from 'mongodb';
export interface Article {
    _id?: ObjectId;
    title: string;
    url: string;
    urlHash: string;
    content: string;
    rawHtml?: string;
    emailDate: Date;
    scrapedAt: Date;
    lastUpdated: Date;
    wordCount: number;
    readingTime: string;
    author?: {
        name?: string | undefined;
        url?: string | undefined;
        avatar?: string | undefined;
    } | undefined;
    keywords: string[];
    tags: string[];
    category: 'flutter' | 'dart' | 'mobile' | 'web' | 'general';
    sourceEmail: {
        id: string;
        subject: string;
        date: Date;
    };
    filePath: string;
    status: 'pending' | 'scraped' | 'failed' | 'archived';
    scrapeAttempts: number;
    lastError?: string | undefined;
}
export interface EmailDigest {
    _id?: ObjectId;
    messageId: string;
    threadId?: string;
    subject: string;
    date: Date;
    processedAt: Date;
    sender: {
        email: string;
        name?: string | undefined;
    };
    bodyPreview?: string;
    htmlContent?: string;
    markdownContent?: string;
    linksFound: number;
    flutterLinks: string[];
    allLinks: string[];
    linksByDomain?: Map<string, string[]>;
    status: 'discovered' | 'processed' | 'failed' | 'skipped';
    articles: ObjectId[];
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
//# sourceMappingURL=database.types.d.ts.map