export declare const appConfig: {
    port: number;
    nodeEnv: string;
    appName: string;
    version: string;
    corsOrigin: string;
    sessionSecret: string;
    sessionMaxAge: number;
    rateLimitWindowMs: number;
    rateLimitMax: number;
    logLevel: string;
    logFile: string;
    dataPath: string;
    articlesPath: string;
    gmailBatchSize: number;
    maxConcurrentScrapes: number;
    scrapeTimeout: number;
    scrapeRetries: number;
};
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const isTest: () => boolean;
//# sourceMappingURL=app.config.d.ts.map