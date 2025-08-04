import { OAuth2Client } from 'google-auth-library';
import type { AuthTokens, AuthorizedUser, TokenStorage } from '@/types/auth.types.js';
export declare class AuthService {
    private oAuth2Client;
    private tokenStorage;
    private stateStore;
    constructor(tokenStorage?: TokenStorage);
    private setupStateCleanup;
    generateAuthUrl(): {
        url: string;
        state: string;
    };
    handleCallback(code: string, state: string): Promise<AuthorizedUser>;
    refreshAccessToken(userId: string): Promise<AuthTokens>;
    getAuthorizedClient(userId: string): Promise<OAuth2Client>;
    revokeAccess(userId: string): Promise<void>;
    validateToken(userId: string): Promise<boolean>;
    getUserInfo(userId: string): Promise<any>;
}
//# sourceMappingURL=AuthService.d.ts.map