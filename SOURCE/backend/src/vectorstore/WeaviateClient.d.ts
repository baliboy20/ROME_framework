/**
 * WeaviateClient - Database Connection Layer Implementation
 * Implements contracts defined in database-connection-layer.contract.test.ts
 *
 * Author: Ashok (Data Architect)
 * Purpose: Resilient Weaviate client with connection management, retries, and monitoring
 */
interface WeaviateConfig {
    host: string;
    scheme: 'http' | 'https';
    port?: number;
    apiKey?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}
interface ConnectionHealth {
    status: 'healthy' | 'unhealthy' | 'unknown';
    latency: number;
    lastChecked: Date;
    version?: string;
    errors?: string[];
}
interface QueryResult {
    data: any[];
    metadata: {
        totalCount: number;
        retrievedCount: number;
        queryTime: number;
    };
}
interface ConnectionMetrics {
    totalConnections: number;
    activeConnections: number;
    failedConnections: number;
    averageLatency: number;
    retryCount: number;
    lastError?: string;
    uptime: number;
}
export declare class WeaviateClient {
    private client;
    private config;
    private connected;
    private metrics;
    private connectionStartTime;
    private latencyHistory;
    constructor(config: WeaviateConfig);
    private initializeClient;
    /**
     * Establish connection to Weaviate
     * Contract requirement: Must complete within 5 seconds
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Weaviate
     * Contract requirement: Clean disconnection
     */
    disconnect(): Promise<void>;
    /**
     * Check if currently connected
     * Contract requirement: Accurate connection status
     */
    isConnected(): boolean;
    /**
     * Get detailed health information
     * Contract requirement: Must complete within 2 seconds
     */
    getHealth(): Promise<ConnectionHealth>;
    /**
     * Execute operation with retry logic
     * Contract requirement: Exponential backoff with max retries
     */
    executeWithRetry<T>(operation: () => Promise<T>): Promise<T>;
    /**
     * Handle connection errors and attempt recovery
     * Contract requirement: Graceful error handling
     */
    handleConnectionError(error: Error): Promise<void>;
    /**
     * Create schema in Weaviate
     * Contract requirement: Schema management through connection
     */
    createSchema(schema: any): Promise<boolean>;
    /**
     * Get current schema
     * Contract requirement: Schema retrieval
     */
    getSchema(): Promise<any>;
    /**
     * Delete schema class
     * Contract requirement: Schema deletion
     */
    deleteSchema(className: string): Promise<boolean>;
    /**
     * Insert single document
     * Contract requirement: Document insertion with ID return
     */
    insertDocument(className: string, document: any): Promise<string>;
    /**
     * Batch insert documents
     * Contract requirement: Efficient bulk insertion
     */
    batchInsert(className: string, documents: any[]): Promise<string[]>;
    /**
     * Execute GraphQL query
     * Contract requirement: Structured query results within 200ms
     */
    query(className: string, query: any): Promise<QueryResult>;
    /**
     * Vector similarity search
     * Contract requirement: Vector search within 300ms
     */
    vectorSearch(className: string, vector: number[], limit?: number): Promise<QueryResult>;
    /**
     * Near-text semantic search
     * Contract requirement: Text-based semantic search
     */
    nearTextSearch(className: string, text: string, limit?: number): Promise<QueryResult>;
    /**
     * Get connection metrics for monitoring
     * Contract requirement: Comprehensive connection monitoring
     */
    getConnectionMetrics(): ConnectionMetrics;
    private handleConnectionFailure;
    private updateLatencyMetrics;
    private sleep;
}
export {};
//# sourceMappingURL=WeaviateClient.d.ts.map