/**
 * WeaviateClient - Database Connection Layer Implementation
 * Implements contracts defined in database-connection-layer.contract.test.ts
 *
 * Author: Ashok (Data Architect)
 * Purpose: Resilient Weaviate client with connection management, retries, and monitoring
 */
import weaviate from 'weaviate-ts-client';
export class WeaviateClient {
    client;
    config;
    connected = false;
    metrics;
    connectionStartTime;
    latencyHistory = [];
    constructor(config) {
        this.config = {
            timeout: 5000,
            retryAttempts: 3,
            retryDelay: 1000,
            port: 8080,
            ...config,
        };
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            failedConnections: 0,
            averageLatency: 0,
            retryCount: 0,
            uptime: 0,
        };
        this.connectionStartTime = Date.now();
        this.initializeClient();
    }
    initializeClient() {
        this.client = weaviate.client({
            scheme: this.config.scheme,
            host: `${this.config.host}:${this.config.port}`,
            apiKey: this.config.apiKey,
            timeout: this.config.timeout,
        });
    }
    /**
     * Establish connection to Weaviate
     * Contract requirement: Must complete within 5 seconds
     */
    async connect() {
        const startTime = Date.now();
        try {
            this.metrics.totalConnections++;
            // Test connection with ready check
            const ready = await this.client.misc.readyChecker().do();
            if (ready) {
                this.connected = true;
                this.metrics.activeConnections = 1;
                const latency = Date.now() - startTime;
                this.updateLatencyMetrics(latency);
                return true;
            }
            else {
                this.handleConnectionFailure('Weaviate not ready');
                return false;
            }
        }
        catch (error) {
            this.handleConnectionFailure(error.message);
            return false;
        }
    }
    /**
     * Disconnect from Weaviate
     * Contract requirement: Clean disconnection
     */
    async disconnect() {
        this.connected = false;
        this.metrics.activeConnections = 0;
    }
    /**
     * Check if currently connected
     * Contract requirement: Accurate connection status
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get detailed health information
     * Contract requirement: Must complete within 2 seconds
     */
    async getHealth() {
        const startTime = Date.now();
        try {
            const ready = await this.client.misc.readyChecker().do();
            const meta = await this.client.misc.metaGetter().do();
            const latency = Date.now() - startTime;
            this.updateLatencyMetrics(latency);
            return {
                status: ready ? 'healthy' : 'unhealthy',
                latency,
                lastChecked: new Date(),
                version: meta.version,
                errors: this.metrics.lastError ? [this.metrics.lastError] : [],
            };
        }
        catch (error) {
            return {
                status: 'unknown',
                latency: Date.now() - startTime,
                lastChecked: new Date(),
                errors: [error.message],
            };
        }
    }
    /**
     * Execute operation with retry logic
     * Contract requirement: Exponential backoff with max retries
     */
    async executeWithRetry(operation) {
        let lastError;
        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                this.metrics.retryCount++;
                if (attempt < this.config.retryAttempts - 1) {
                    // Exponential backoff
                    const delay = this.config.retryDelay * Math.pow(2, attempt);
                    await this.sleep(delay);
                }
            }
        }
        throw lastError;
    }
    /**
     * Handle connection errors and attempt recovery
     * Contract requirement: Graceful error handling
     */
    async handleConnectionError(error) {
        this.connected = false;
        this.metrics.failedConnections++;
        this.metrics.lastError = error.message;
        // Attempt automatic reconnection
        setTimeout(async () => {
            try {
                await this.connect();
            }
            catch (reconnectionError) {
                console.error('Auto-reconnection failed:', reconnectionError);
            }
        }, this.config.retryDelay);
    }
    /**
     * Create schema in Weaviate
     * Contract requirement: Schema management through connection
     */
    async createSchema(schema) {
        return this.executeWithRetry(async () => {
            const result = await this.client.schema.classCreator().withClass(schema).do();
            return result !== null;
        });
    }
    /**
     * Get current schema
     * Contract requirement: Schema retrieval
     */
    async getSchema() {
        return this.executeWithRetry(async () => {
            return await this.client.schema.getter().do();
        });
    }
    /**
     * Delete schema class
     * Contract requirement: Schema deletion
     */
    async deleteSchema(className) {
        return this.executeWithRetry(async () => {
            await this.client.schema.classDeleter().withClassName(className).do();
            return true;
        });
    }
    /**
     * Insert single document
     * Contract requirement: Document insertion with ID return
     */
    async insertDocument(className, document) {
        return this.executeWithRetry(async () => {
            const result = await this.client.data
                .creator()
                .withClassName(className)
                .withProperties(document)
                .do();
            return result.id;
        });
    }
    /**
     * Batch insert documents
     * Contract requirement: Efficient bulk insertion
     */
    async batchInsert(className, documents) {
        return this.executeWithRetry(async () => {
            let batcher = this.client.batch.objectsBatcher();
            documents.forEach(doc => {
                batcher = batcher.withObject({
                    class: className,
                    properties: doc,
                });
            });
            const result = await batcher.do();
            return result.map((item) => item.id);
        });
    }
    /**
     * Execute GraphQL query
     * Contract requirement: Structured query results within 200ms
     */
    async query(className, query) {
        const startTime = Date.now();
        return this.executeWithRetry(async () => {
            let graphqlQuery = this.client.graphql.get().withClassName(className);
            if (query.fields) {
                graphqlQuery = graphqlQuery.withFields(query.fields.join(' '));
            }
            if (query.limit) {
                graphqlQuery = graphqlQuery.withLimit(query.limit);
            }
            const result = await graphqlQuery.do();
            const queryTime = Date.now() - startTime;
            const data = result.data?.Get?.[className] || [];
            return {
                data,
                metadata: {
                    totalCount: data.length, // Simplified - real implementation would get actual total
                    retrievedCount: data.length,
                    queryTime,
                },
            };
        });
    }
    /**
     * Vector similarity search
     * Contract requirement: Vector search within 300ms
     */
    async vectorSearch(className, vector, limit = 10) {
        const startTime = Date.now();
        return this.executeWithRetry(async () => {
            // Validate vector dimensions (OpenAI text-embedding-3-small = 1536)
            if (vector.length !== 1536) {
                throw new Error(`Invalid vector dimension: expected 1536, got ${vector.length}`);
            }
            const result = await this.client.graphql
                .get()
                .withClassName(className)
                .withFields('content category subcategory source section tags codeType version lastUpdated _additional { certainty }')
                .withNearVector({ vector })
                .withLimit(limit)
                .do();
            const queryTime = Date.now() - startTime;
            const data = result.data?.Get?.[className] || [];
            return {
                data,
                metadata: {
                    totalCount: data.length,
                    retrievedCount: data.length,
                    queryTime,
                },
            };
        });
    }
    /**
     * Near-text semantic search
     * Contract requirement: Text-based semantic search
     */
    async nearTextSearch(className, text, limit = 10) {
        const startTime = Date.now();
        return this.executeWithRetry(async () => {
            const result = await this.client.graphql
                .get()
                .withClassName(className)
                .withFields('content category subcategory source section tags codeType version lastUpdated _additional { certainty }')
                .withNearText({ concepts: [text] })
                .withLimit(limit)
                .do();
            const queryTime = Date.now() - startTime;
            const data = result.data?.Get?.[className] || [];
            return {
                data,
                metadata: {
                    totalCount: data.length,
                    retrievedCount: data.length,
                    queryTime,
                },
            };
        });
    }
    /**
     * Get connection metrics for monitoring
     * Contract requirement: Comprehensive connection monitoring
     */
    getConnectionMetrics() {
        this.metrics.uptime = Date.now() - this.connectionStartTime;
        return { ...this.metrics };
    }
    // Private helper methods
    handleConnectionFailure(error) {
        this.connected = false;
        this.metrics.failedConnections++;
        this.metrics.lastError = error;
    }
    updateLatencyMetrics(latency) {
        this.latencyHistory.push(latency);
        // Keep only last 100 measurements
        if (this.latencyHistory.length > 100) {
            this.latencyHistory.shift();
        }
        // Calculate average latency
        this.metrics.averageLatency =
            this.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.latencyHistory.length;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=WeaviateClient.js.map