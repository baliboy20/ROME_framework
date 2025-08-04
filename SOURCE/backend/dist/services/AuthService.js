import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { authConfig, authSettings } from '@/config/auth.config.js';
import { TokenStorageService } from './TokenStorageService.js';
export class AuthService {
    oAuth2Client;
    tokenStorage;
    stateStore = new Map();
    constructor(tokenStorage) {
        this.oAuth2Client = new google.auth.OAuth2(authConfig.clientId, authConfig.clientSecret, authConfig.redirectUri);
        this.tokenStorage = tokenStorage || new TokenStorageService();
        this.setupStateCleanup();
    }
    setupStateCleanup() {
        setInterval(() => {
            const now = new Date();
            for (const [state, authState] of this.stateStore.entries()) {
                if (authState.expiresAt < now) {
                    this.stateStore.delete(state);
                }
            }
        }, 60000); // Clean up every minute
    }
    generateAuthUrl() {
        const state = crypto.randomBytes(32).toString('hex');
        const codeVerifier = crypto.randomBytes(128).toString('base64url');
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
        const authState = {
            state,
            codeVerifier,
            codeChallenge,
            expiresAt: new Date(Date.now() + authSettings.stateExpiryTime)
        };
        this.stateStore.set(state, authState);
        const authUrl = this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: authConfig.scopes,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            prompt: 'consent' // Force consent to ensure refresh token
        });
        return { url: authUrl, state };
    }
    async handleCallback(code, state) {
        const authState = this.stateStore.get(state);
        if (!authState) {
            const error = new Error('Invalid or expired state parameter');
            error.code = 'INVALID_STATE';
            error.status = 400;
            throw error;
        }
        this.stateStore.delete(state);
        if (authState.expiresAt < new Date()) {
            const error = new Error('Authentication state has expired');
            error.code = 'STATE_EXPIRED';
            error.status = 400;
            throw error;
        }
        try {
            const { tokens } = await this.oAuth2Client.getToken({
                code,
                codeVerifier: authState.codeVerifier
            });
            this.oAuth2Client.setCredentials(tokens);
            const authTokens = {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || undefined,
                expiryDate: tokens.expiry_date || undefined,
                scope: tokens.scope || undefined,
                tokenType: tokens.token_type || undefined
            };
            // Get user info
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oAuth2Client });
            const { data } = await oauth2.userinfo.get();
            const userId = data.id || data.email || 'unknown';
            const email = data.email || undefined;
            // Save tokens
            await this.tokenStorage.save(userId, authTokens);
            return {
                client: this.oAuth2Client,
                tokens: authTokens,
                email: email || undefined,
                userId
            };
        }
        catch (error) {
            const authError = new Error('Failed to exchange authorization code');
            authError.code = 'TOKEN_EXCHANGE_FAILED';
            authError.status = 401;
            throw authError;
        }
    }
    async refreshAccessToken(userId) {
        const savedTokens = await this.tokenStorage.load(userId);
        if (!savedTokens || !savedTokens.refreshToken) {
            const error = new Error('No refresh token available');
            error.code = 'NO_REFRESH_TOKEN';
            error.status = 401;
            throw error;
        }
        this.oAuth2Client.setCredentials({
            refresh_token: savedTokens.refreshToken
        });
        try {
            const { credentials } = await this.oAuth2Client.refreshAccessToken();
            const newTokens = {
                accessToken: credentials.access_token,
                refreshToken: credentials.refresh_token || savedTokens.refreshToken,
                expiryDate: credentials.expiry_date || undefined,
                scope: credentials.scope || savedTokens.scope,
                tokenType: credentials.token_type || savedTokens.tokenType
            };
            await this.tokenStorage.save(userId, newTokens);
            return newTokens;
        }
        catch (error) {
            const authError = new Error('Failed to refresh access token');
            authError.code = 'REFRESH_FAILED';
            authError.status = 401;
            throw authError;
        }
    }
    async getAuthorizedClient(userId) {
        const tokens = await this.tokenStorage.load(userId);
        if (!tokens) {
            const error = new Error('User not authenticated');
            error.code = 'NOT_AUTHENTICATED';
            error.status = 401;
            throw error;
        }
        // Check if token is expired or about to expire
        if (tokens.expiryDate) {
            const expiryTime = tokens.expiryDate - authSettings.tokenExpiryBuffer;
            if (Date.now() > expiryTime) {
                const refreshedTokens = await this.refreshAccessToken(userId);
                tokens.accessToken = refreshedTokens.accessToken;
                tokens.expiryDate = refreshedTokens.expiryDate;
            }
        }
        const client = new google.auth.OAuth2(authConfig.clientId, authConfig.clientSecret, authConfig.redirectUri);
        client.setCredentials({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken || null,
            expiry_date: tokens.expiryDate || null,
            token_type: tokens.tokenType || null
        });
        return client;
    }
    async revokeAccess(userId) {
        try {
            const tokens = await this.tokenStorage.load(userId);
            if (tokens && tokens.accessToken) {
                await this.oAuth2Client.revokeToken(tokens.accessToken);
            }
        }
        catch (error) {
            console.error('Failed to revoke token:', error);
        }
        finally {
            await this.tokenStorage.remove(userId);
        }
    }
    async validateToken(userId) {
        try {
            const client = await this.getAuthorizedClient(userId);
            const oauth2 = google.oauth2({ version: 'v2', auth: client });
            await oauth2.userinfo.get();
            return true;
        }
        catch {
            return false;
        }
    }
    async getUserInfo(userId) {
        const client = await this.getAuthorizedClient(userId);
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data } = await oauth2.userinfo.get();
        return data;
    }
}
//# sourceMappingURL=AuthService.js.map