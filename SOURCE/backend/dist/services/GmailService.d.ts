import type { EmailFilterOptions, ProcessedEmail } from '@/types/gmail.types.js';
import { AuthService } from './AuthService.js';
export declare class GmailService {
    private authService;
    private cache;
    private cacheTimeout;
    private turndownService;
    constructor(authService?: AuthService);
    fetchDigests(userId: string, options?: EmailFilterOptions): Promise<ProcessedEmail[]>;
    fetchSingleEmail(userId: string, messageId: string): Promise<ProcessedEmail | null>;
    private buildGmailQuery;
    private fetchMessageList;
    private fetchFullMessages;
    private processMessages;
    private extractEmailContent;
    private extractMessageBody;
    private extractLinks;
    private isFlutterRelated;
    private convertHtmlToMarkdown;
    private cleanHtmlForMarkdown;
    private cleanMarkdown;
    getQuotaUsage(userId: string): Promise<any>;
    clearCache(): void;
    private getCacheKey;
}
//# sourceMappingURL=GmailService.d.ts.map