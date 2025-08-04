/**
 * GmailService Unit Tests
 * Tests Gmail API integration, email parsing, and link extraction
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GmailService } from '../../services/GmailService';
import { AuthService } from '../../services/AuthService';
// Mock dependencies
jest.mock('../../services/AuthService');
jest.mock('googleapis');
describe('GmailService', () => {
    let gmailService;
    let mockAuthService;
    let mockGmail;
    const mockUserId = 'test-user-id';
    beforeEach(() => {
        mockAuthService = {
            getAuthorizedClient: jest.fn()
        };
        mockGmail = {
            users: {
                messages: {
                    list: jest.fn(),
                    get: jest.fn()
                },
                getProfile: jest.fn()
            }
        };
        // Mock google.gmail
        jest.doMock('googleapis', () => ({
            google: {
                gmail: jest.fn().mockReturnValue(mockGmail)
            }
        }));
        gmailService = new GmailService(mockAuthService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('buildGmailQuery', () => {
        it('should build basic query with subject filter', () => {
            const options = {
                subject: 'Medium Daily Digest'
            };
            const query = gmailService.buildGmailQuery(options);
            expect(query).toContain('subject:"Medium Daily Digest"');
            expect(query).toContain('-in:spam -in:trash');
        });
        it('should build query with date range', () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const options = {
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            };
            const query = gmailService.buildGmailQuery(options);
            expect(query).toContain(`after:${Math.floor(startDate.getTime() / 1000)}`);
            expect(query).toContain(`before:${Math.floor(endDate.getTime() / 1000)}`);
        });
        it('should build query with keywords', () => {
            const options = {
                keywords: ['flutter', 'dart']
            };
            const query = gmailService.buildGmailQuery(options);
            expect(query).toContain('("flutter" OR "dart")');
        });
        it('should build complex query with all filters', () => {
            const options = {
                subject: 'Medium Daily Digest',
                from: 'noreply@medium.com',
                dateRange: {
                    start: new Date('2024-01-01'),
                    end: new Date('2024-01-31')
                },
                keywords: ['flutter', 'dart'],
                includeSpamTrash: true
            };
            const query = gmailService.buildGmailQuery(options);
            expect(query).toContain('subject:"Medium Daily Digest"');
            expect(query).toContain('from:noreply@medium.com');
            expect(query).toContain('after:');
            expect(query).toContain('before:');
            expect(query).toContain('("flutter" OR "dart")');
            expect(query).not.toContain('-in:spam -in:trash');
        });
    });
    describe('fetchMessageList', () => {
        it('should fetch message list with pagination', async () => {
            const mockMessages = [
                { id: 'msg1' },
                { id: 'msg2' },
                { id: 'msg3' }
            ];
            mockGmail.users.messages.list
                .mockResolvedValueOnce({
                data: {
                    messages: mockMessages.slice(0, 2),
                    nextPageToken: 'token1'
                }
            })
                .mockResolvedValueOnce({
                data: {
                    messages: mockMessages.slice(2),
                    nextPageToken: undefined
                }
            });
            const result = await gmailService.fetchMessageList(mockGmail, 'test-query', 10);
            expect(result).toEqual(['msg1', 'msg2', 'msg3']);
            expect(mockGmail.users.messages.list).toHaveBeenCalledTimes(2);
        });
        it('should respect maxResults limit', async () => {
            const mockMessages = Array.from({ length: 50 }, (_, i) => ({ id: `msg${i}` }));
            mockGmail.users.messages.list.mockResolvedValue({
                data: {
                    messages: mockMessages,
                    nextPageToken: 'token1'
                }
            });
            const result = await gmailService.fetchMessageList(mockGmail, 'test-query', 25);
            expect(result).toHaveLength(25);
            expect(result[0]).toBe('msg0');
            expect(result[24]).toBe('msg24');
        });
    });
    describe('fetchFullMessages', () => {
        it('should fetch full messages in batches', async () => {
            const messageIds = ['msg1', 'msg2', 'msg3'];
            const mockFullMessages = messageIds.map(id => ({
                id,
                payload: { headers: [] },
                snippet: `Snippet for ${id}`
            }));
            mockGmail.users.messages.get
                .mockResolvedValueOnce({ data: mockFullMessages[0] })
                .mockResolvedValueOnce({ data: mockFullMessages[1] })
                .mockResolvedValueOnce({ data: mockFullMessages[2] });
            const result = await gmailService.fetchFullMessages(mockGmail, messageIds);
            expect(result).toHaveLength(3);
            expect(result[0]?.id).toBe('msg1');
            expect(result[1]?.id).toBe('msg2');
            expect(result[2]?.id).toBe('msg3');
        });
        it('should handle batch errors gracefully', async () => {
            const messageIds = ['msg1', 'msg2', 'msg3'];
            mockGmail.users.messages.get
                .mockResolvedValueOnce({ data: { id: 'msg1' } })
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce({ data: { id: 'msg3' } });
            const result = await gmailService.fetchFullMessages(mockGmail, messageIds);
            expect(result).toHaveLength(2);
            expect(result[0]?.id).toBe('msg1');
            expect(result[1]?.id).toBe('msg3');
        });
    });
    describe('extractEmailContent', () => {
        it('should extract email headers correctly', () => {
            const mockMessage = {
                id: 'test-msg-id',
                threadId: 'test-thread-id',
                snippet: 'Test email snippet',
                payload: {
                    headers: [
                        { name: 'Subject', value: 'Test Subject' },
                        { name: 'From', value: 'Test User <test@example.com>' },
                        { name: 'Date', value: 'Wed, 1 Jan 2024 12:00:00 +0000' }
                    ]
                },
                internalDate: '1704110400000'
            };
            const result = gmailService.extractEmailContent(mockMessage);
            expect(result).toEqual({
                messageId: 'test-msg-id',
                threadId: 'test-thread-id',
                subject: 'Test Subject',
                date: expect.any(Date),
                sender: {
                    email: 'test@example.com',
                    name: 'Test User'
                },
                bodyText: undefined,
                bodyHtml: undefined,
                snippet: 'Test email snippet'
            });
        });
        it('should parse sender email without name', () => {
            const mockMessage = {
                id: 'test-msg-id',
                payload: {
                    headers: [
                        { name: 'From', value: 'test@example.com' }
                    ]
                }
            };
            const result = gmailService.extractEmailContent(mockMessage);
            expect(result?.sender).toEqual({
                email: 'test@example.com',
                name: undefined
            });
        });
        it('should handle missing payload', () => {
            const mockMessage = {
                id: 'test-msg-id'
            };
            const result = gmailService.extractEmailContent(mockMessage);
            expect(result).toBeNull();
        });
    });
    describe('extractLinks', () => {
        it('should extract links from HTML content', () => {
            const htmlContent = `
        <html>
          <body>
            <a href="https://medium.com/flutter-article">Flutter Article</a>
            <a href="https://example.com/other">Other Link</a>
            <a href="https://medium.com/dart-guide">Dart Guide</a>
          </body>
        </html>
      `;
            const result = gmailService.extractLinks(htmlContent);
            expect(result.allLinks).toHaveLength(3);
            expect(result.allLinks).toContain('https://medium.com/flutter-article');
            expect(result.allLinks).toContain('https://example.com/other');
            expect(result.allLinks).toContain('https://medium.com/dart-guide');
            expect(result.linksFound).toBe(3);
        });
        it('should extract links from plain text', () => {
            const plainText = `
        Check out these articles:
        https://medium.com/flutter-article
        https://example.com/other
        https://medium.com/dart-guide
      `;
            const result = gmailService.extractLinks(plainText);
            expect(result.allLinks).toHaveLength(3);
            expect(result.linksFound).toBe(3);
        });
        it('should identify Flutter-related links', () => {
            const htmlContent = `
        <html>
          <body>
            <a href="https://medium.com/flutter-tutorial">Flutter Tutorial</a>
            <a href="https://medium.com/dart-programming">Dart Programming</a>
            <a href="https://medium.com/javascript-tips">JavaScript Tips</a>
            <a href="https://flutter.dev/docs">Flutter Docs</a>
          </body>
        </html>
      `;
            const result = gmailService.extractLinks(htmlContent);
            expect(result.flutterLinks).toHaveLength(3);
            expect(result.flutterLinks).toContain('https://medium.com/flutter-tutorial');
            expect(result.flutterLinks).toContain('https://medium.com/dart-programming');
            expect(result.flutterLinks).toContain('https://flutter.dev/docs');
            expect(result.flutterLinks).not.toContain('https://medium.com/javascript-tips');
        });
        it('should group links by domain', () => {
            const htmlContent = `
        <html>
          <body>
            <a href="https://medium.com/article1">Article 1</a>
            <a href="https://medium.com/article2">Article 2</a>
            <a href="https://flutter.dev/docs">Flutter Docs</a>
            <a href="https://example.com/test">Test</a>
          </body>
        </html>
      `;
            const result = gmailService.extractLinks(htmlContent);
            expect(result.linksByDomain.get('medium.com')).toHaveLength(2);
            expect(result.linksByDomain.get('flutter.dev')).toHaveLength(1);
            expect(result.linksByDomain.get('example.com')).toHaveLength(1);
        });
        it('should handle empty content', () => {
            const result = gmailService.extractLinks('');
            expect(result).toEqual({
                allLinks: [],
                flutterLinks: [],
                linksByDomain: new Map(),
                linksFound: 0
            });
        });
        it('should remove duplicate links', () => {
            const htmlContent = `
        <html>
          <body>
            <a href="https://medium.com/flutter-article">Flutter Article</a>
            <a href="https://medium.com/flutter-article">Flutter Article (duplicate)</a>
          </body>
        </html>
      `;
            const result = gmailService.extractLinks(htmlContent);
            expect(result.allLinks).toHaveLength(1);
            expect(result.flutterLinks).toHaveLength(1);
            expect(result.linksFound).toBe(2); // Original count before deduplication
        });
    });
    describe('fetchDigests', () => {
        it('should fetch and process email digests', async () => {
            const mockAuthClient = { credentials: {} };
            mockAuthService.getAuthorizedClient.mockResolvedValue(mockAuthClient);
            const mockMessages = [
                {
                    id: 'msg1',
                    payload: {
                        headers: [
                            { name: 'Subject', value: 'Medium Daily Digest' },
                            { name: 'From', value: 'Medium <noreply@medium.com>' },
                            { name: 'Date', value: 'Wed, 1 Jan 2024 12:00:00 +0000' }
                        ]
                    },
                    snippet: 'Today\'s top Flutter articles'
                }
            ];
            mockGmail.users.messages.list.mockResolvedValue({
                data: { messages: [{ id: 'msg1' }] }
            });
            mockGmail.users.messages.get.mockResolvedValue({
                data: mockMessages[0]
            });
            const filterOptions = {
                subject: 'Medium Daily Digest',
                maxResults: 10
            };
            const result = await gmailService.fetchDigests(mockUserId, filterOptions);
            expect(result).toHaveLength(1);
            expect(result[0]?.messageId).toBe('msg1');
            expect(result[0]?.subject).toBe('Medium Daily Digest');
            expect(result[0]?.sender.email).toBe('noreply@medium.com');
            expect(result[0]?.sender.name).toBe('Medium');
            expect(mockAuthService.getAuthorizedClient).toHaveBeenCalledWith(mockUserId);
        });
        it('should handle authentication errors', async () => {
            mockAuthService.getAuthorizedClient.mockRejectedValue(new Error('Authentication failed'));
            const filterOptions = {
                subject: 'Medium Daily Digest'
            };
            await expect(gmailService.fetchDigests(mockUserId, filterOptions)).rejects.toThrow('Failed to fetch email digests: Authentication failed');
        });
        it('should handle Gmail API errors', async () => {
            const mockAuthClient = { credentials: {} };
            mockAuthService.getAuthorizedClient.mockResolvedValue(mockAuthClient);
            mockGmail.users.messages.list.mockRejectedValue(new Error('Gmail API error'));
            const filterOptions = {
                subject: 'Medium Daily Digest'
            };
            await expect(gmailService.fetchDigests(mockUserId, filterOptions)).rejects.toThrow('Failed to fetch email digests: Gmail API error');
        });
    });
    describe('fetchSingleEmail', () => {
        it('should fetch and process single email', async () => {
            const mockAuthClient = { credentials: {} };
            mockAuthService.getAuthorizedClient.mockResolvedValue(mockAuthClient);
            const mockMessage = {
                id: 'msg1',
                payload: {
                    headers: [
                        { name: 'Subject', value: 'Test Email' },
                        { name: 'From', value: 'Test User <test@example.com>' }
                    ]
                },
                snippet: 'Test email content'
            };
            mockGmail.users.messages.get.mockResolvedValue({
                data: mockMessage
            });
            const result = await gmailService.fetchSingleEmail(mockUserId, 'msg1');
            expect(result).not.toBeNull();
            expect(result?.messageId).toBe('msg1');
            expect(result?.subject).toBe('Test Email');
        });
        it('should return null for non-existent message', async () => {
            const mockAuthClient = { credentials: {} };
            mockAuthService.getAuthorizedClient.mockResolvedValue(mockAuthClient);
            mockGmail.users.messages.get.mockResolvedValue({
                data: null
            });
            const result = await gmailService.fetchSingleEmail(mockUserId, 'non-existent');
            expect(result).toBeNull();
        });
        it('should handle API errors gracefully', async () => {
            const mockAuthClient = { credentials: {} };
            mockAuthService.getAuthorizedClient.mockResolvedValue(mockAuthClient);
            mockGmail.users.messages.get.mockRejectedValue(new Error('Message not found'));
            const result = await gmailService.fetchSingleEmail(mockUserId, 'msg1');
            expect(result).toBeNull();
        });
    });
    describe('getQuotaUsage', () => {
        it('should return quota usage information', async () => {
            const mockAuthClient = { credentials: {} };
            mockAuthService.getAuthorizedClient.mockResolvedValue(mockAuthClient);
            const mockProfile = {
                messagesTotal: 5000,
                threadsTotal: 3000,
                historyId: '12345',
                emailAddress: 'test@example.com'
            };
            mockGmail.users.getProfile.mockResolvedValue({
                data: mockProfile
            });
            const result = await gmailService.getQuotaUsage(mockUserId);
            expect(result).toEqual({
                totalMessages: 5000,
                threadsTotal: 3000,
                historyId: '12345',
                emailAddress: 'test@example.com'
            });
        });
    });
    describe('Cache Management', () => {
        it('should clear cache when requested', () => {
            // Add something to cache
            gmailService.cache.set('test-key', 'test-value');
            expect(gmailService.cache.size).toBe(1);
            gmailService.clearCache();
            expect(gmailService.cache.size).toBe(0);
        });
        it('should generate consistent cache keys', () => {
            const userId = 'test-user';
            const query = 'test-query';
            const key1 = gmailService.getCacheKey(userId, query);
            const key2 = gmailService.getCacheKey(userId, query);
            expect(key1).toBe(key2);
            expect(key1).toBe('test-user:test-query');
        });
    });
});
//# sourceMappingURL=GmailService.test.js.map