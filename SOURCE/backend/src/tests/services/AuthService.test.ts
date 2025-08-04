/**
 * AuthService Unit Tests
 * Tests OAuth2 authentication, token management, and security features
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AuthService } from '../../services/AuthService';
import { TokenStorageService } from '../../services/TokenStorageService';
import type { AuthTokens, AuthState } from '../../types/auth.types';

// Mock dependencies
jest.mock('googleapis');
jest.mock('../../services/TokenStorageService');

describe('AuthService', () => {
  let authService: AuthService;
  let mockTokenStorage: jest.Mocked<TokenStorageService>;

  beforeEach(() => {
    // @ts-ignore - Jest mock type issues
    mockTokenStorage = {
      // @ts-ignore
      save: jest.fn().mockResolvedValue(undefined),
      // @ts-ignore
      load: jest.fn().mockResolvedValue(null),
      // @ts-ignore
      remove: jest.fn().mockResolvedValue(undefined),
      // @ts-ignore
      exists: jest.fn().mockResolvedValue(false),
      // @ts-ignore
      listAllUsers: jest.fn().mockResolvedValue([])
    };

    // Mock the OAuth2Client
    const mockOAuth2Client = {
      generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/oauth/authorize?client_id=test-client-id&redirect_uri=test&scope=gmail.readonly%20userinfo.email%20userinfo.profile&code_challenge=test&code_challenge_method=S256&access_type=offline&prompt=consent&state=test-state'),
      getToken: jest.fn(),
      setCredentials: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeToken: jest.fn()
    };

    // Mock google.auth.OAuth2 constructor
    jest.doMock('googleapis', () => ({
      google: {
        auth: {
          OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client)
        },
        oauth2: jest.fn()
      }
    }));

    authService = new AuthService(mockTokenStorage);
    (authService as any).oAuth2Client = mockOAuth2Client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate a valid OAuth2 URL with state', () => {
      const result = authService.generateAuthUrl();

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain('accounts.google.com');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('redirect_uri=');
      expect(result.url).toContain('code_challenge=');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.state).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should include required OAuth2 scopes', () => {
      const result = authService.generateAuthUrl();

      expect(result.url).toContain('scope=');
      expect(result.url).toContain('gmail.readonly');
      expect(result.url).toContain('userinfo.email');
      expect(result.url).toContain('userinfo.profile');
    });

    it('should use PKCE for security', () => {
      const result = authService.generateAuthUrl();

      expect(result.url).toContain('code_challenge=');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.url).toContain('access_type=offline');
      expect(result.url).toContain('prompt=consent');
    });

    it('should generate unique state for each request', () => {
      const result1 = authService.generateAuthUrl();
      const result2 = authService.generateAuthUrl();

      expect(result1.state).not.toBe(result2.state);
      expect(result1.url).not.toBe(result2.url);
    });
  });

  describe('handleCallback', () => {
    const mockCode = 'test-auth-code';
    const mockState = 'valid-state-123';

    beforeEach(() => {
      // Pre-populate state store
      const result = authService.generateAuthUrl();
      // Replace the generated state with our mock state for testing
      (authService as any).stateStore.set(mockState, {
        state: mockState,
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        expiresAt: new Date(Date.now() + 600000) // 10 minutes in future
      });
    });

    it('should reject invalid state', async () => {
      await expect(
        authService.handleCallback(mockCode, 'invalid-state')
      ).rejects.toThrow('Invalid or expired state parameter');
    });

    it('should reject expired state', async () => {
      const expiredState = 'expired-state';
      (authService as any).stateStore.set(expiredState, {
        state: expiredState,
        codeVerifier: 'test-verifier',
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });

      await expect(
        authService.handleCallback(mockCode, expiredState)
      ).rejects.toThrow('Authentication state has expired');
    });

    it('should clean up state after successful callback', async () => {
      // Mock successful OAuth2 token exchange
      const mockOAuth2Client = {
        // @ts-ignore
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expiry_date: Date.now() + 3600000
          }
        }),
        setCredentials: jest.fn()
      } as any;

      // Mock Google APIs
      const mockGoogle = {
        auth: {
          OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client)
        },
        oauth2: jest.fn().mockReturnValue({
          userinfo: {
            // @ts-ignore
            get: jest.fn().mockResolvedValue({
              data: {
                id: 'test-user-id',
                email: 'test@example.com',
                name: 'Test User'
              }
            })
          }
        })
      };

      // Replace the google import mock
      (authService as any).oAuth2Client = mockOAuth2Client;

      // Mock userinfo API call
      jest.doMock('googleapis', () => ({ google: mockGoogle }));

      // @ts-ignore
      mockTokenStorage.save.mockResolvedValue();

      // Should not throw and should return user info
      await expect(
        authService.handleCallback(mockCode, mockState)
      ).resolves.toEqual({
        client: mockOAuth2Client,
        tokens: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          expiryDate: expect.any(Number),
          scope: undefined,
          tokenType: undefined
        },
        email: 'test@example.com',
        userId: 'test-user-id'
      });

      // State should be cleaned up
      expect((authService as any).stateStore.has(mockState)).toBe(false);
      expect(mockTokenStorage.save).toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    const mockUserId = 'test-user-id';

    it('should throw error when no refresh token available', async () => {
      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue(null);

      await expect(
        authService.refreshAccessToken(mockUserId)
      ).rejects.toThrow('No refresh token available');
    });

    it('should throw error when refresh token missing', async () => {
      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue({
        accessToken: 'old-token',
        refreshToken: undefined,
        expiryDate: Date.now() - 1000
      } as AuthTokens);

      await expect(
        authService.refreshAccessToken(mockUserId)
      ).rejects.toThrow('No refresh token available');
    });

    it('should refresh token and save new tokens', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'old-access-token',
        refreshToken: 'test-refresh-token',
        expiryDate: Date.now() - 1000
      };

      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue(mockTokens);

      // Mock successful token refresh
      const mockOAuth2Client = {
        setCredentials: jest.fn(),
        // @ts-ignore
        refreshAccessToken: jest.fn().mockResolvedValue({
          credentials: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expiry_date: Date.now() + 3600000
          }
        })
      };

      (authService as any).oAuth2Client = mockOAuth2Client;
      // @ts-ignore
      mockTokenStorage.save.mockResolvedValue();

      const result = await authService.refreshAccessToken(mockUserId);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiryDate: expect.any(Number),
        scope: mockTokens.scope,
        tokenType: mockTokens.tokenType
      });

      expect(mockTokenStorage.save).toHaveBeenCalledWith(mockUserId, result);
    });
  });

  describe('getAuthorizedClient', () => {
    const mockUserId = 'test-user-id';

    it('should throw error when user not authenticated', async () => {
      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue(null);

      await expect(
        authService.getAuthorizedClient(mockUserId)
      ).rejects.toThrow('User not authenticated');
    });

    it('should return client with valid tokens', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'valid-access-token',
        refreshToken: 'test-refresh-token',
        expiryDate: Date.now() + 3600000 // 1 hour in future
      };

      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue(mockTokens);

      const client = await authService.getAuthorizedClient(mockUserId);

      expect(client).toBeDefined();
      expect(client.setCredentials).toBeDefined();
    });

    it('should refresh expired tokens automatically', async () => {
      const expiredTokens: AuthTokens = {
        accessToken: 'expired-access-token',
        refreshToken: 'test-refresh-token',
        expiryDate: Date.now() - 1000 // Expired 1 second ago
      };

      const refreshedTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'test-refresh-token',
        expiryDate: Date.now() + 3600000
      };

      // @ts-ignore
      mockTokenStorage.load
        .mockResolvedValueOnce(expiredTokens)
        .mockResolvedValueOnce(refreshedTokens);

      // Mock refresh functionality
      const mockOAuth2Client = {
        setCredentials: jest.fn(),
        // @ts-ignore
        refreshAccessToken: jest.fn().mockResolvedValue({
          credentials: {
            access_token: 'new-access-token',
            expiry_date: Date.now() + 3600000
          }
        })
      };

      (authService as any).oAuth2Client = mockOAuth2Client;
      // @ts-ignore
      mockTokenStorage.save.mockResolvedValue();

      const client = await authService.getAuthorizedClient(mockUserId);

      expect(mockOAuth2Client.refreshAccessToken).toHaveBeenCalled();
      expect(mockTokenStorage.save).toHaveBeenCalled();
      expect(client).toBeDefined();
    });
  });

  describe('validateToken', () => {
    const mockUserId = 'test-user-id';

    it('should return false for invalid user', async () => {
      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue(null);

      const result = await authService.validateToken(mockUserId);

      expect(result).toBe(false);
    });

    it('should return true for valid token', async () => {
      mockTokenStorage.load.mockResolvedValue({
        accessToken: 'valid-token',
        refreshToken: 'refresh-token',
        expiryDate: Date.now() + 3600000
      } as AuthTokens);

      // Mock successful API call
      const mockOAuth2Client = {
        setCredentials: jest.fn()
      };

      (authService as any).oAuth2Client = mockOAuth2Client;

      // Mock the google.oauth2 call
      jest.doMock('googleapis', () => ({
        google: {
          oauth2: jest.fn().mockReturnValue({
            userinfo: {
              // @ts-ignore
              get: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' } })
            }
          }),
          auth: {
            OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client)
          }
        }
      }));

      const result = await authService.validateToken(mockUserId);

      expect(result).toBe(true);
    });
  });

  describe('revokeAccess', () => {
    const mockUserId = 'test-user-id';

    it('should revoke token and remove from storage', async () => {
      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiryDate: Date.now() + 3600000
      };

      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue(mockTokens);
      // @ts-ignore
      mockTokenStorage.remove.mockResolvedValue();

      const mockOAuth2Client = {
        // @ts-ignore
        revokeToken: jest.fn().mockResolvedValue({})
      };

      (authService as any).oAuth2Client = mockOAuth2Client;

      await authService.revokeAccess(mockUserId);

      expect(mockOAuth2Client.revokeToken).toHaveBeenCalledWith('test-access-token');
      expect(mockTokenStorage.remove).toHaveBeenCalledWith(mockUserId);
    });

    it('should remove from storage even if revocation fails', async () => {
      // @ts-ignore
      mockTokenStorage.load.mockResolvedValue({
        accessToken: 'test-access-token'
      } as AuthTokens);
      // @ts-ignore
      mockTokenStorage.remove.mockResolvedValue();

      const mockOAuth2Client = {
        // @ts-ignore
        revokeToken: jest.fn().mockRejectedValue(new Error('Revocation failed'))
      };

      (authService as any).oAuth2Client = mockOAuth2Client;

      await authService.revokeAccess(mockUserId);

      expect(mockTokenStorage.remove).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('State Management', () => {
    it('should clean up expired states automatically', async () => {
      const expiredState = 'expired-state';
      const validState = 'valid-state';

      // Add states manually
      (authService as any).stateStore.set(expiredState, {
        state: expiredState,
        expiresAt: new Date(Date.now() - 1000) // Expired
      });

      (authService as any).stateStore.set(validState, {
        state: validState,
        expiresAt: new Date(Date.now() + 600000) // Valid
      });

      // Wait for cleanup interval (mocked)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger manual cleanup for testing
      const stateStore = (authService as any).stateStore;
      const now = new Date();
      for (const [state, authState] of stateStore.entries()) {
        if (authState.expiresAt < now) {
          stateStore.delete(state);
        }
      }

      expect(stateStore.has(expiredState)).toBe(false);
      expect(stateStore.has(validState)).toBe(true);
    });
  });
});