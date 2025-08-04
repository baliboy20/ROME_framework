import type { AuthConfig } from '@/types/auth.types.js';
export declare const authConfig: AuthConfig;
export declare const authSettings: {
    tokenExpiryBuffer: number;
    stateExpiryTime: number;
    maxRetries: number;
    retryDelay: number;
    tokenStoragePath: string;
};
export declare const validateAuthConfig: () => boolean;
//# sourceMappingURL=auth.config.d.ts.map