import { google, gmail_v1 } from 'googleapis';


import { OAuth2Client } from 'google-auth-library';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import type { 
  EmailContent, 
  EmailFilterOptions, 
  GmailMessage, 
  LinkExtractionResult, 
  ProcessedEmail 
} from '@/types/gmail.types.js';
import { AuthService } from './AuthService.js';
import { appConfig } from '@/config/app.config.js';

export class GmailService {
  private authService: AuthService;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes
  private turndownService: TurndownService;

  constructor(authService?: AuthService) {
    this.authService = authService || new AuthService();
    
    // Initialize markdown converter with custom rules
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '_',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });
    
    // Custom rule for preserving links in a cleaner format
    this.turndownService.addRule('cleanLinks', {
      filter: 'a',
      replacement: function(content, node: any) {
        const href = node.getAttribute ? node.getAttribute('href') : null;
        if (!href || href.startsWith('mailto:') || href.startsWith('#')) {
          return content;
        }
        return content ? `[${content}](${href})` : `<${href}>`;
      }
    });
  }

  async fetchDigests(userId: string, options: EmailFilterOptions = {}): Promise<ProcessedEmail[]> {
    const requestId = `GMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`\n📧 [GmailService::fetchDigests] [${requestId}] Starting Gmail fetch operation`);
    console.log(`👤 [GmailService::fetchDigests] [${requestId}] UserId: ${userId}`);
    console.log(`⚙️  [GmailService::fetchDigests] [${requestId}] Options:`, JSON.stringify(options, null, 2));
    
    try {
      // Step 1: Get authenticated client
      console.log(`🔐 [GmailService::fetchDigests] [${requestId}] Step 1: Getting authenticated client`);
      const authStartTime = Date.now();
      
      let authClient;
      try {
        authClient = await this.authService.getAuthorizedClient(userId);
        const authDuration = Date.now() - authStartTime;
        console.log(`✅ [GmailService::fetchDigests] [${requestId}] Authentication completed in ${authDuration}ms`);
      } catch (authError: any) {
        const authDuration = Date.now() - authStartTime;
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] Authentication failed after ${authDuration}ms`);
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] Auth error details:`, {
          message: authError.message,
          stack: authError.stack,
          code: authError.code,
          name: authError.name
        });
        throw authError;
      }

      // Step 2: Initialize Gmail API
      console.log(`🚀 [GmailService::fetchDigests] [${requestId}] Step 2: Initializing Gmail API client`);
      const gmail = google.gmail({ version: 'v1', auth: authClient });
      console.log(`✅ [GmailService::fetchDigests] [${requestId}] Gmail API client initialized`);

      // Step 3: Build Gmail query
      console.log(`🔍 [GmailService::fetchDigests] [${requestId}] Step 3: Building Gmail search query`);
      const query = this.buildGmailQuery(options, requestId);
      console.log(`🔍 [GmailService::fetchDigests] [${requestId}] Final search query: "${query}"`);

      // Step 4: Fetch message list
      console.log(`📥 [GmailService::fetchDigests] [${requestId}] Step 4: Fetching message list from Gmail`);
      const listStartTime = Date.now();
      
      let messageList;
      try {
        messageList = await this.fetchMessageList(gmail, query, options.maxResults, requestId);
        const listDuration = Date.now() - listStartTime;
        console.log(`✅ [GmailService::fetchDigests] [${requestId}] Message list fetched in ${listDuration}ms`);
        console.log(`📊 [GmailService::fetchDigests] [${requestId}] Found ${messageList.length} messages matching criteria`);
      } catch (listError: any) {
        const listDuration = Date.now() - listStartTime;
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] Message list fetch failed after ${listDuration}ms`);
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] List error details:`, {
          message: listError.message,
          stack: listError.stack,
          code: listError.code,
          name: listError.name
        });
        throw listError;
      }

      // Step 5: Fetch full messages
      console.log(`📧 [GmailService::fetchDigests] [${requestId}] Step 5: Fetching full message content`);
      const fullStartTime = Date.now();
      
      let messages;
      try {
        messages = await this.fetchFullMessages(gmail, messageList, requestId);
        const fullDuration = Date.now() - fullStartTime;
        console.log(`✅ [GmailService::fetchDigests] [${requestId}] Full messages fetched in ${fullDuration}ms`);
        console.log(`📊 [GmailService::fetchDigests] [${requestId}] Retrieved ${messages.length} complete messages`);
      } catch (fullError: any) {
        const fullDuration = Date.now() - fullStartTime;
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] Full message fetch failed after ${fullDuration}ms`);
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] Full fetch error details:`, {
          message: fullError.message,
          stack: fullError.stack,
          code: fullError.code,
          name: fullError.name
        });
        throw fullError;
      }

      // Step 6: Process messages
      console.log(`⚙️  [GmailService::fetchDigests] [${requestId}] Step 6: Processing messages and extracting links`);
      const processStartTime = Date.now();
      
      let processedEmails;
      try {
        processedEmails = await this.processMessages(messages, requestId);
        const processDuration = Date.now() - processStartTime;
        console.log(`✅ [GmailService::fetchDigests] [${requestId}] Message processing completed in ${processDuration}ms`);
        console.log(`📊 [GmailService::fetchDigests] [${requestId}] Successfully processed ${processedEmails.length} emails`);
      } catch (processError: any) {
        const processDuration = Date.now() - processStartTime;
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] Message processing failed after ${processDuration}ms`);
        console.error(`❌ [GmailService::fetchDigests] [${requestId}] Process error details:`, {
          message: processError.message,
          stack: processError.stack,
          code: processError.code,
          name: processError.name
        });
        throw processError;
      }
      
      // Final summary
      const totalDuration = Date.now() - startTime;
      console.log(`🎉 [GmailService::fetchDigests] [${requestId}] Gmail fetch operation completed successfully`);
      console.log(`⏱️  [GmailService::fetchDigests] [${requestId}] Total operation time: ${totalDuration}ms`);
      console.log(`📊 [GmailService::fetchDigests] [${requestId}] Final results:`);
      console.log(`   - Messages found: ${messageList.length}`);
      console.log(`   - Messages processed: ${processedEmails.length}`);
      console.log(`   - Average processing time per email: ${Math.round(totalDuration / processedEmails.length)}ms`);

      return processedEmails;
      
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      console.error(`💥 [GmailService::fetchDigests] [${requestId}] Fatal error in Gmail fetch operation after ${totalDuration}ms`);
      console.error(`💥 [GmailService::fetchDigests] [${requestId}] Fatal error details:`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        name: error.name,
        cause: error.cause
      });
      
      throw new Error(`Failed to fetch email digests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchSingleEmail(userId: string, messageId: string): Promise<ProcessedEmail | null> {
    try {
      const authClient = await this.authService.getAuthorizedClient(userId);
      const gmail = google.gmail({ version: 'v1', auth: authClient });

      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      if (!message.data) {
        return null;
      }

      const [processedEmail] = await this.processMessages([message.data as any]);
      return processedEmail || null;
    } catch (error) {
      console.error(`[GmailService] Error fetching message ${messageId}:`, error);
      return null;
    }
  }

  private buildGmailQuery(options: EmailFilterOptions, requestId: string): string {
    console.log(`🔧 [GmailService::buildGmailQuery] [${requestId}] Building Gmail search query`);
    const queryParts: string[] = [];

    // From filter - using subject field to search by sender name
    if (options.subject) {
      const fromPart = `from:"${options.subject}"`;
      queryParts.push(fromPart);
      console.log(`👤 [GmailService::buildGmailQuery] [${requestId}] Added from filter: ${fromPart}`);
    }

    // From filter
    if (options.from) {
      const fromPart = `from:${options.from}`;
      queryParts.push(fromPart);
      console.log(`👤 [GmailService::buildGmailQuery] [${requestId}] Added from filter: ${fromPart}`);
    }

    // Date range filter
    if (options.dateRange) {
      // Format dates as YYYY/MM/DD for Gmail compatibility
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // months are 0-indexed
        const day = date.getDate();
        return `${year}/${month}/${day}`;
      };

      const startFormatted = formatDate(options.dateRange.start);
      const endFormatted = formatDate(options.dateRange.end);
      const afterPart = `after:${startFormatted}`;
      const beforePart = `before:${endFormatted}`;
      queryParts.push(afterPart);
      queryParts.push(beforePart);
      console.log(`📅 [GmailService::buildGmailQuery] [${requestId}] Added date range: ${afterPart} ${beforePart}`);
      console.log(`📅 [GmailService::buildGmailQuery] [${requestId}] Date range: ${options.dateRange.start.toISOString()} to ${options.dateRange.end.toISOString()}`);
    }

    // Keywords filter - TEMPORARILY DISABLED FOR TESTING
    // if (options.keywords && options.keywords.length > 0) {
    //   const keywordQuery = options.keywords.map(k => `"${k}"`).join(' OR ');
    //   const keywordPart = `(${keywordQuery})`;
    //   queryParts.push(keywordPart);
    //   console.log(`🔍 [GmailService::buildGmailQuery] [${requestId}] Added keywords filter: ${keywordPart}`);
    //   console.log(`🔍 [GmailService::buildGmailQuery] [${requestId}] Keywords: ${options.keywords.join(', ')}`);
    // }

    // Exclude spam and trash by default
    if (!options.includeSpamTrash) {
      const excludePart = '-in:spam -in:trash';
      queryParts.push(excludePart);
      console.log(`🗑️  [GmailService::buildGmailQuery] [${requestId}] Added exclusion filter: ${excludePart}`);
    }

    const finalQuery = queryParts.join(' ');
    console.log(`✅ [GmailService::buildGmailQuery] [${requestId}] Final query built: "${finalQuery}"`);
    console.log(`📊 [GmailService::buildGmailQuery] [${requestId}] Query parts count: ${queryParts.length}`);
    
    return finalQuery;
  }

  private async fetchMessageList(
    gmail: gmail_v1.Gmail, 
    query: string, 
    maxResults?: number,
    requestId?: string
  ): Promise<string[]> {
    console.log(`📋 [GmailService::fetchMessageList] [${requestId}] Starting message list fetch`);
    console.log(`📋 [GmailService::fetchMessageList] [${requestId}] Query: "${query}"`);
    console.log(`📋 [GmailService::fetchMessageList] [${requestId}] Max results: ${maxResults || 'unlimited'}`);
    
    const startTime = Date.now();
    const messageIds: string[] = [];
    let pageToken: string | undefined;
    const batchSize = Math.min(maxResults || appConfig.gmailBatchSize, 500);
    let pageCount = 0;

    console.log(`📋 [GmailService::fetchMessageList] [${requestId}] Batch size set to: ${batchSize}`);

    do {
      pageCount++;
      console.log(`📄 [GmailService::fetchMessageList] [${requestId}] Fetching page ${pageCount} ${pageToken ? `with token ${pageToken.substring(0, 20)}...` : '(first page)'}`);
      
      const pageStartTime = Date.now();
      
      try {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: batchSize,
          ...(pageToken && { pageToken })
        }) as any;

        const pageDuration = Date.now() - pageStartTime;
        console.log(`✅ [GmailService::fetchMessageList] [${requestId}] Page ${pageCount} fetched in ${pageDuration}ms`);

        if (response.data?.messages) {
          const pageMessages = response.data.messages.map((m: any) => m.id!);
          messageIds.push(...pageMessages);
          console.log(`📧 [GmailService::fetchMessageList] [${requestId}] Added ${pageMessages.length} message IDs from page ${pageCount}`);
          console.log(`📊 [GmailService::fetchMessageList] [${requestId}] Total message IDs collected: ${messageIds.length}`);
        } else {
          console.log(`📭 [GmailService::fetchMessageList] [${requestId}] Page ${pageCount} returned no messages`);
        }

        pageToken = response.data?.nextPageToken || undefined;
        console.log(`🔗 [GmailService::fetchMessageList] [${requestId}] Next page token: ${pageToken ? 'available' : 'none (last page)'}`);

        // Break if we have enough results
        if (maxResults && messageIds.length >= maxResults) {
          console.log(`🛑 [GmailService::fetchMessageList] [${requestId}] Reached max results limit (${maxResults}), stopping`);
          break;
        }
        
      } catch (pageError: any) {
        const pageDuration = Date.now() - pageStartTime;
        console.error(`❌ [GmailService::fetchMessageList] [${requestId}] Page ${pageCount} failed after ${pageDuration}ms`);
        console.error(`❌ [GmailService::fetchMessageList] [${requestId}] Page error details:`, {
          message: pageError.message,
          code: pageError.code,
          status: pageError.status,
          pageCount,
          pageToken: pageToken ? pageToken.substring(0, 20) + '...' : 'none'
        });
        throw pageError;
      }
      
    } while (pageToken);

    const finalResults = maxResults ? messageIds.slice(0, maxResults) : messageIds;
    const totalDuration = Date.now() - startTime;
    
    console.log(`🎉 [GmailService::fetchMessageList] [${requestId}] Message list fetch completed`);
    console.log(`📊 [GmailService::fetchMessageList] [${requestId}] Final statistics:`);
    console.log(`   - Total pages fetched: ${pageCount}`);
    console.log(`   - Raw message IDs found: ${messageIds.length}`);
    console.log(`   - Final results returned: ${finalResults.length}`);
    console.log(`   - Total fetch time: ${totalDuration}ms`);
    console.log(`   - Average time per page: ${Math.round(totalDuration / pageCount)}ms`);

    return finalResults;
  }

  private async fetchFullMessages(gmail: gmail_v1.Gmail, messageIds: string[], requestId?: string): Promise<GmailMessage[]> {
    console.log(`📥 [GmailService::fetchFullMessages] [${requestId}] Starting full message fetch`);
    console.log(`📥 [GmailService::fetchFullMessages] [${requestId}] Message IDs to fetch: ${messageIds.length}`);
    
    const startTime = Date.now();
    const messages: GmailMessage[] = [];
    const batchSize = 10; // Gmail API batch limit
    const totalBatches = Math.ceil(messageIds.length / batchSize);
    
    console.log(`📦 [GmailService::fetchFullMessages] [${requestId}] Processing ${totalBatches} batches of ${batchSize} messages each`);

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batchNumber = Math.floor(i / batchSize) + 1;
      const batch = messageIds.slice(i, i + batchSize);
      
      console.log(`📦 [GmailService::fetchFullMessages] [${requestId}] Processing batch ${batchNumber}/${totalBatches} (${batch.length} messages)`);
      const batchStartTime = Date.now();
      
      const batchPromises = batch.map((id, index) => {
        console.log(`📧 [GmailService::fetchFullMessages] [${requestId}] Fetching message ${index + 1}/${batch.length} in batch ${batchNumber}: ${id}`);
        return gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'full'
        }).then(response => {
          console.log(`✅ [GmailService::fetchFullMessages] [${requestId}] Message ${id} fetched successfully`);
          return response.data;
        }).catch(error => {
          console.error(`❌ [GmailService::fetchFullMessages] [${requestId}] Failed to fetch message ${id}:`, {
            message: error.message,
            code: error.code,
            status: error.status
          });
          return null;
        });
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        const validMessages = batchResults.filter(msg => msg) as GmailMessage[];
        messages.push(...validMessages);
        
        const batchDuration = Date.now() - batchStartTime;
        console.log(`✅ [GmailService::fetchFullMessages] [${requestId}] Batch ${batchNumber} completed in ${batchDuration}ms`);
        console.log(`📊 [GmailService::fetchFullMessages] [${requestId}] Batch ${batchNumber} results: ${validMessages.length}/${batch.length} messages successful`);
        console.log(`📊 [GmailService::fetchFullMessages] [${requestId}] Total messages collected so far: ${messages.length}`);
        
      } catch (error: any) {
        const batchDuration = Date.now() - batchStartTime;
        console.error(`❌ [GmailService::fetchFullMessages] [${requestId}] Batch ${batchNumber} failed after ${batchDuration}ms`);
        console.error(`❌ [GmailService::fetchFullMessages] [${requestId}] Batch error details:`, {
          message: error.message,
          code: error.code,
          status: error.status,
          batchNumber,
          batchSize: batch.length
        });
        // Continue with next batch
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`🎉 [GmailService::fetchFullMessages] [${requestId}] Full message fetch completed`);
    console.log(`📊 [GmailService::fetchFullMessages] [${requestId}] Final statistics:`);
    console.log(`   - Total batches processed: ${totalBatches}`);
    console.log(`   - Messages requested: ${messageIds.length}`);
    console.log(`   - Messages successfully fetched: ${messages.length}`);
    console.log(`   - Success rate: ${Math.round((messages.length / messageIds.length) * 100)}%`);
    console.log(`   - Total fetch time: ${totalDuration}ms`);
    console.log(`   - Average time per message: ${Math.round(totalDuration / messages.length)}ms`);

    return messages;
  }

  private async processMessages(messages: GmailMessage[], requestId?: string): Promise<ProcessedEmail[]> {
    console.log(`⚙️  [GmailService::processMessages] [${requestId}] Starting message processing`);
    console.log(`⚙️  [GmailService::processMessages] [${requestId}] Messages to process: ${messages.length}`);
    
    const startTime = Date.now();
    const processedEmails: ProcessedEmail[] = [];
    const processingErrors = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (!message) continue; // Skip if message is undefined
      
      const messageIndex = i + 1;
      
      console.log(`📧 [GmailService::processMessages] [${requestId}] Processing message ${messageIndex}/${messages.length}: ${message.id}`);
      const messageStartTime = Date.now();
      
      try {
        // Step 1: Extract email content
        console.log(`🔍 [GmailService::processMessages] [${requestId}] Extracting content from message ${message.id}`);
        const emailContent = this.extractEmailContent(message);
        
        if (!emailContent) {
          console.warn(`⚠️  [GmailService::processMessages] [${requestId}] Message ${message.id} has no extractable content, skipping`);
          continue;
        }
        
        console.log(`✅ [GmailService::processMessages] [${requestId}] Content extracted from ${message.id}:`);
        console.log(`   - Subject: "${emailContent.subject}"`);
        console.log(`   - Sender: ${emailContent.sender}`);
        console.log(`   - Date: ${emailContent.date}`);
        console.log(`   - Body HTML length: ${emailContent.bodyHtml?.length || 0} chars`);
        console.log(`   - Body text length: ${emailContent.bodyText?.length || 0} chars`);

        // Step 2: Extract links
        console.log(`🔗 [GmailService::processMessages] [${requestId}] Extracting links from message ${message.id}`);
        const linkExtractionStartTime = Date.now();
        
        const links = this.extractLinks(emailContent.bodyHtml || emailContent.bodyText || '', requestId);
        const linkExtractionDuration = Date.now() - linkExtractionStartTime;
        
        console.log(`✅ [GmailService::processMessages] [${requestId}] Links extracted from ${message.id} in ${linkExtractionDuration}ms:`);
        console.log(`   - Total links found: ${links.linksFound}`);
        console.log(`   - Flutter-related links: ${links.flutterLinks.length}`);
        console.log(`   - Unique domains: ${Object.keys(links.linksByDomain).length}`);
        
        // Step 3: Convert HTML to Markdown
        console.log(`📝 [GmailService::processMessages] [${requestId}] Converting HTML to Markdown for ${message.id}`);
        const markdownStartTime = Date.now();
        
        let markdownContent: string | undefined;
        if (emailContent.bodyHtml) {
          try {
            markdownContent = this.convertHtmlToMarkdown(emailContent.bodyHtml, requestId);
            const markdownDuration = Date.now() - markdownStartTime;
            console.log(`✅ [GmailService::processMessages] [${requestId}] Markdown conversion completed in ${markdownDuration}ms`);
            console.log(`📊 [GmailService::processMessages] [${requestId}] Markdown length: ${markdownContent.length} chars`);
          } catch (markdownError: any) {
            const markdownDuration = Date.now() - markdownStartTime;
            console.warn(`⚠️  [GmailService::processMessages] [${requestId}] Markdown conversion failed after ${markdownDuration}ms:`, {
              message: markdownError.message,
              messageId: message.id
            });
          }
        } else {
          console.log(`📝 [GmailService::processMessages] [${requestId}] No HTML content to convert for ${message.id}`);
        }

        // Step 4: Create processed email object
        const processedEmail: ProcessedEmail = {
          messageId: emailContent.messageId,
          subject: emailContent.subject,
          date: emailContent.date,
          sender: emailContent.sender,
          bodyPreview: emailContent.snippet?.substring(0, 500) || '',
          htmlContent: emailContent.bodyHtml || undefined,
          markdownContent: markdownContent || undefined,
          links,
          processingTime: Date.now() - messageStartTime
        };

        processedEmails.push(processedEmail);
        
        const messageDuration = Date.now() - messageStartTime;
        console.log(`🎉 [GmailService::processMessages] [${requestId}] Message ${message.id} processed successfully in ${messageDuration}ms`);
        console.log(`📊 [GmailService::processMessages] [${requestId}] Progress: ${messageIndex}/${messages.length} messages processed`);
        
      } catch (error: any) {
        const messageDuration = Date.now() - messageStartTime;
        console.error(`❌ [GmailService::processMessages] [${requestId}] Error processing message ${message.id} after ${messageDuration}ms`);
        console.error(`❌ [GmailService::processMessages] [${requestId}] Processing error details:`, {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name,
          messageId: message.id,
          messageIndex
        });
        
        processingErrors.push({
          messageId: message.id,
          messageIndex,
          error: error.message,
          duration: messageDuration
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`🎉 [GmailService::processMessages] [${requestId}] Message processing completed`);
    console.log(`📊 [GmailService::processMessages] [${requestId}] Final processing statistics:`);
    console.log(`   - Messages input: ${messages.length}`);
    console.log(`   - Messages successfully processed: ${processedEmails.length}`);
    console.log(`   - Processing errors: ${processingErrors.length}`);
    console.log(`   - Success rate: ${Math.round((processedEmails.length / messages.length) * 100)}%`);
    console.log(`   - Total processing time: ${totalDuration}ms`);
    console.log(`   - Average time per message: ${Math.round(totalDuration / messages.length)}ms`);
    
    if (processingErrors.length > 0) {
      console.warn(`⚠️  [GmailService::processMessages] [${requestId}] Processing errors occurred:`, processingErrors);
    }

    return processedEmails;
  }

  private extractEmailContent(message: GmailMessage): EmailContent | null {
    if (!message.payload) return null;

    const headers = message.payload.headers || [];
    
    // Extract headers
    const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
    const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value;
    const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';

    // Parse date
    const date = dateHeader ? new Date(dateHeader) : new Date(parseInt(message.internalDate || '0'));

    // Parse sender
    const senderMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || fromHeader.match(/^(.+)$/);
    const sender: { email: string; name?: string | undefined } = {
      email: senderMatch ? (senderMatch[2] || senderMatch[1])?.trim() || fromHeader : fromHeader,
      name: senderMatch && senderMatch[2] ? senderMatch[1]?.trim().replace(/"/g, '') || undefined : undefined
    };

    // Extract body
    const { bodyText, bodyHtml } = this.extractMessageBody(message.payload);

    return {
      messageId: message.id!,
      threadId: message.threadId || undefined,
      subject,
      date,
      sender: {
        email: sender.email,
        name: sender.name || undefined
      },
      bodyText,
      bodyHtml,
      snippet: message.snippet
    };
  }

  private extractMessageBody(payload: gmail_v1.Schema$MessagePart): { bodyText?: string | undefined; bodyHtml?: string | undefined } {
    let bodyText: string | undefined;
    let bodyHtml: string | undefined;

    const extractFromPart = (part: gmail_v1.Schema$MessagePart) => {
      if (part.body?.data) {
        try {
          // Decode base64 and handle UTF-8 encoding issues
          const buffer = Buffer.from(part.body.data, 'base64');
          let data = buffer.toString('utf-8');
          
          // Replace invalid UTF-8 characters with empty string
          data = data.replace(/\uFFFD/g, '');
          
          if (part.mimeType === 'text/plain') {
            bodyText = data;
          } else if (part.mimeType === 'text/html') {
            bodyHtml = data;
          }
        } catch (error: any) {
          console.warn(`⚠️  [GmailService::extractMessageBody] Failed to decode message part:`, {
            mimeType: part.mimeType,
            error: error.message
          });
        }
      }

      if (part.parts) {
        for (const subPart of part.parts) {
          extractFromPart(subPart);
        }
      }
    };

    extractFromPart(payload);
    return { 
      bodyText: bodyText || undefined, 
      bodyHtml: bodyHtml || undefined 
    };
  }

  private extractLinks(content: string, requestId?: string): LinkExtractionResult {
    console.log(`🔗 [GmailService::extractLinks] [${requestId}] Starting link extraction`);
    console.log(`🔗 [GmailService::extractLinks] [${requestId}] Content length: ${content.length} characters`);
    const allLinks: string[] = [];
    const flutterLinks: string[] = [];
    const linksByDomain = new Map<string, string[]>();

    if (!content) {
      console.log(`📭 [GmailService::extractLinks] [${requestId}] No content provided, returning empty result`);
      return { allLinks, flutterLinks, linksByDomain, linksFound: 0 };
    }

    // Use cheerio to parse HTML if it looks like HTML
    const isHtml = content.trim().startsWith('<');
    console.log(`📄 [GmailService::extractLinks] [${requestId}] Content type: ${isHtml ? 'HTML' : 'plain text'}`);
    
    let links: string[] = [];

    if (isHtml) {
      console.log(`🌐 [GmailService::extractLinks] [${requestId}] Parsing HTML content with Cheerio`);
      try {
        const $ = cheerio.load(content);
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && href.startsWith('http')) {
            links.push(href);
          }
        });
        console.log(`✅ [GmailService::extractLinks] [${requestId}] HTML parsing found ${links.length} links`);
      } catch (htmlError: any) {
        console.error(`❌ [GmailService::extractLinks] [${requestId}] HTML parsing failed:`, {
          message: htmlError.message,
          stack: htmlError.stack
        });
        links = [];
      }
    } else {
      console.log(`📝 [GmailService::extractLinks] [${requestId}] Extracting URLs from plain text using regex`);
      // Extract URLs from plain text
      const urlRegex = /https?:\/\/[^\s<>"']+/gi;
      links = content.match(urlRegex) || [];
      console.log(`✅ [GmailService::extractLinks] [${requestId}] Regex extraction found ${links.length} links`);
    }

    // Process extracted links
    console.log(`⚙️  [GmailService::extractLinks] [${requestId}] Processing ${links.length} raw links`);
    let validLinks = 0;
    let invalidLinks = 0;
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (!link) continue; // Skip if link is undefined
      
      console.log(`🔗 [GmailService::extractLinks] [${requestId}] Processing link ${i + 1}/${links.length}: ${link.substring(0, 100)}${link.length > 100 ? '...' : ''}`);
      
      try {
        const url = new URL(link);
        allLinks.push(link);
        validLinks++;

        // Categorize by domain
        const domain = url.hostname.toLowerCase();
        if (!linksByDomain.has(domain)) {
          linksByDomain.set(domain, []);
          console.log(`🌐 [GmailService::extractLinks] [${requestId}] New domain discovered: ${domain}`);
        }
        linksByDomain.get(domain)!.push(link);

        // Check if it's a Flutter-related link
        const isFlutter = this.isFlutterRelated(link, url);
        if (isFlutter) {
          flutterLinks.push(link);
          console.log(`🎯 [GmailService::extractLinks] [${requestId}] Flutter-related link found: ${domain}`);
        }
        
      } catch (error: any) {
        invalidLinks++;
        console.warn(`⚠️  [GmailService::extractLinks] [${requestId}] Invalid URL skipped: ${link} (${error.message})`);
      }
    }

    // Remove duplicates and prepare final results
    const uniqueAllLinks = [...new Set(allLinks)];
    const uniqueFlutterLinks = [...new Set(flutterLinks)];
    
    console.log(`🎉 [GmailService::extractLinks] [${requestId}] Link extraction completed`);
    console.log(`📊 [GmailService::extractLinks] [${requestId}] Final statistics:`);
    console.log(`   - Raw links found: ${links.length}`);
    console.log(`   - Valid URLs: ${validLinks}`);
    console.log(`   - Invalid URLs: ${invalidLinks}`);
    console.log(`   - Unique valid links: ${uniqueAllLinks.length}`);
    console.log(`   - Flutter-related links: ${uniqueFlutterLinks.length}`);
    console.log(`   - Unique domains: ${linksByDomain.size}`);
    console.log(`   - Domains found: ${Array.from(linksByDomain.keys()).join(', ')}`);

    return {
      allLinks: uniqueAllLinks,
      flutterLinks: uniqueFlutterLinks,
      linksByDomain,
      linksFound: uniqueAllLinks.length
    };
  }

  private isFlutterRelated(link: string, url: URL): boolean {
    const domain = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const fullUrl = link.toLowerCase();

    // Medium Flutter articles
    if (domain.includes('medium.com')) {
      return fullUrl.includes('flutter') || 
             fullUrl.includes('dart') || 
             path.includes('flutter') ||
             path.includes('dart');
    }

    // Other Flutter-related domains
    const flutterDomains = [
      'flutter.dev',
      'dart.dev',
      'pub.dev',
      'docs.flutter.dev',
      'api.flutter.dev'
    ];

    if (flutterDomains.some(d => domain.includes(d))) {
      return true;
    }

    // Check for Flutter keywords in URL
    const flutterKeywords = ['flutter', 'dart', 'widget', 'riverpod', 'bloc'];
    return flutterKeywords.some(keyword => fullUrl.includes(keyword));
  }

  private convertHtmlToMarkdown(htmlContent: string, requestId?: string): string {
    console.log(`🔄 [GmailService::convertHtmlToMarkdown] [${requestId}] Starting HTML to Markdown conversion`);
    console.log(`🔄 [GmailService::convertHtmlToMarkdown] [${requestId}] HTML content length: ${htmlContent.length} chars`);
    
    try {
      // Clean up HTML before conversion
      const cleanedHtml = this.cleanHtmlForMarkdown(htmlContent, requestId);
      
      // Convert to Markdown
      const markdown = this.turndownService.turndown(cleanedHtml);
      
      // Post-process markdown to clean up formatting
      const cleanedMarkdown = this.cleanMarkdown(markdown, requestId);
      
      console.log(`✅ [GmailService::convertHtmlToMarkdown] [${requestId}] Conversion completed successfully`);
      console.log(`📊 [GmailService::convertHtmlToMarkdown] [${requestId}] Output markdown length: ${cleanedMarkdown.length} chars`);
      
      return cleanedMarkdown;
      
    } catch (error: any) {
      console.error(`❌ [GmailService::convertHtmlToMarkdown] [${requestId}] Conversion failed:`, {
        message: error.message,
        stack: error.stack
      });
      
      // Return a fallback - try to extract text content at least
      try {
        const $ = cheerio.load(htmlContent);
        const textContent = $.root().text().replace(/\s+/g, ' ').trim();
        console.log(`🔄 [GmailService::convertHtmlToMarkdown] [${requestId}] Fallback: extracted ${textContent.length} chars of text`);
        return textContent;
      } catch (fallbackError) {
        console.error(`❌ [GmailService::convertHtmlToMarkdown] [${requestId}] Fallback also failed, returning empty string`);
        return '';
      }
    }
  }

  private cleanHtmlForMarkdown(htmlContent: string, requestId?: string): string {
    console.log(`🧹 [GmailService::cleanHtmlForMarkdown] [${requestId}] Cleaning HTML for better markdown conversion`);
    
    try {
      const $ = cheerio.load(htmlContent);
      
      // Remove script and style tags
      $('script, style, noscript').remove();
      
      // Remove tracking images and small images (likely tracking pixels)
      $('img').each((_, img) => {
        const width = $(img).attr('width');
        const height = $(img).attr('height');
        const src = $(img).attr('src') || '';
        
        // Remove tracking pixels and very small images
        if ((width && parseInt(width) <= 2) || 
            (height && parseInt(height) <= 2) ||
            src.includes('tracking') || 
            src.includes('pixel') ||
            src.includes('analytics')) {
          $(img).remove();
        }
      });
      
      // Clean up Medium-specific elements
      $('.medium-zoom-image').removeClass('medium-zoom-image');
      $('[class*="medium-"]').each((_, el) => {
        // Remove medium-specific classes but keep the element
        const classes = $(el).attr('class') || '';
        const cleanClasses = classes.split(' ').filter(c => !c.includes('medium-')).join(' ');
        if (cleanClasses) {
          $(el).attr('class', cleanClasses);
        } else {
          $(el).removeAttr('class');
        }
      });
      
      // Remove empty paragraphs and divs
      $('p:empty, div:empty').remove();
      
      // Convert divs with text content to paragraphs for better markdown
      $('div').each((_, div) => {
        const $div = $(div);
        if ($div.children().length === 0 && $div.text().trim()) {
          $div.replaceWith(`<p>${$div.html()}</p>`);
        }
      });
      
      const cleanedHtml = $.html();
      console.log(`✅ [GmailService::cleanHtmlForMarkdown] [${requestId}] HTML cleaning completed`);
      console.log(`📊 [GmailService::cleanHtmlForMarkdown] [${requestId}] Cleaned HTML length: ${cleanedHtml.length} chars`);
      
      return cleanedHtml;
      
    } catch (error: any) {
      console.warn(`⚠️  [GmailService::cleanHtmlForMarkdown] [${requestId}] HTML cleaning failed, using original:`, {
        message: error.message
      });
      return htmlContent;
    }
  }

  private cleanMarkdown(markdown: string, requestId?: string): string {
    console.log(`🧹 [GmailService::cleanMarkdown] [${requestId}] Post-processing markdown`);
    
    let cleaned = markdown;
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Clean up empty list items
    cleaned = cleaned.replace(/^\s*[\*\-\+]\s*$/gm, '');
    
    // Remove standalone brackets or parentheses
    cleaned = cleaned.replace(/^\s*[\[\]()]\s*$/gm, '');
    
    // Clean up malformed links
    cleaned = cleaned.replace(/\[]\(/g, '(');
    cleaned = cleaned.replace(/\[\s*\]\s*\(\s*\)/g, '');
    
    // Normalize heading spacing
    cleaned = cleaned.replace(/^(#{1,6})\s*/gm, '$1 ');
    
    // Clean up excessive bold/italic markers
    cleaned = cleaned.replace(/\*{3,}/g, '**');
    cleaned = cleaned.replace(/_{3,}/g, '__');
    
    // Remove trailing whitespace from lines
    cleaned = cleaned.replace(/[ \t]+$/gm, '');
    
    // Ensure document ends with single newline
    cleaned = cleaned.trim() + '\n';
    
    console.log(`✅ [GmailService::cleanMarkdown] [${requestId}] Markdown post-processing completed`);
    console.log(`📊 [GmailService::cleanMarkdown] [${requestId}] Final markdown length: ${cleaned.length} chars`);
    
    return cleaned;
  }

  async getQuotaUsage(userId: string): Promise<any> {
    try {
      const authClient = await this.authService.getAuthorizedClient(userId);
      const gmail = google.gmail({ version: 'v1', auth: authClient });
      
      // Gmail API doesn't directly expose quota, but we can estimate based on profile
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      return {
        totalMessages: profile.data.messagesTotal || 0,
        threadsTotal: profile.data.threadsTotal || 0,
        historyId: profile.data.historyId,
        emailAddress: profile.data.emailAddress
      };
    } catch (error) {
      console.error('[GmailService] Error getting quota usage:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getCacheKey(userId: string, query: string): string {
    return `${userId}:${query}`;
  }
}
