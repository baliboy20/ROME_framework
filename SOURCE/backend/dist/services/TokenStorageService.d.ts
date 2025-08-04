import type { AuthTokens, TokenStorage } from '@/types/auth.types.js';
export declare class TokenStorageService implements TokenStorage {
    private storagePath;
    private encryptionKey;
    private algorithm;
    constructor(storagePath?: string);
    private deriveKey;
    private ensureStorageDirectory;
    private encrypt;
    private decrypt;
    private getTokenFilePath;
    save(userId: string, tokens: AuthTokens): Promise<void>;
    load(userId: string): Promise<AuthTokens | null>;
    remove(userId: string): Promise<void>;
    exists(userId: string): Promise<boolean>;
    listAllUsers(): Promise<string[]>;
}
//# sourceMappingURL=TokenStorageService.d.ts.map