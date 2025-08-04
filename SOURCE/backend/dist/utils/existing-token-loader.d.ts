import type { AuthTokens } from '@/types/auth.types.js';
/**
 * Utility to load existing Google OAuth tokens from token.json file
 * This helps migrate from existing token files to the new AuthService system
 */
export declare class ExistingTokenLoader {
    /**
     * Load tokens from the existing token.json file format
     */
    static loadFromTokenFile(tokenFilePath: string): Promise<AuthTokens | null>;
    /**
     * Pre-populate AuthService with existing refresh token for a user
     */
    static migrateExistingToken(authService: any, userId: string, tokenFilePath: string): Promise<boolean>;
}
/**
 * Helper function to migrate the existing token.json to the new AuthService
 * Call this during application startup if needed
 */
export declare function migrateExistingGmailToken(authService: any): Promise<void>;
//# sourceMappingURL=existing-token-loader.d.ts.map