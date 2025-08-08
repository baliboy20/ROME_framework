/**
 * SchemaManager - Vector Database Schema Implementation
 * Implements contracts defined in vector-database-schema.contract.test.ts
 *
 * Author: Ashok (Data Architect)
 * Purpose: Manage Weaviate schema for FlutterDoc class with full validation
 */
interface WeaviateSchemaProperty {
    name: string;
    dataType: string[];
    description: string;
    tokenization?: string;
    indexFilterable?: boolean;
    indexSearchable?: boolean;
    moduleConfig?: {
        'text2vec-openai': {
            skip: boolean;
            vectorizePropertyName: boolean;
        };
    };
}
interface WeaviateSchema {
    class: string;
    description: string;
    properties: WeaviateSchemaProperty[];
    vectorizer: string;
    moduleConfig: {
        'text2vec-openai': {
            model: string;
            type: string;
            vectorizeClassName: boolean;
        };
    };
    vectorIndexType: string;
    vectorIndexConfig: {
        distance: string;
        ef: number;
        efConstruction: number;
        maxConnections: number;
    };
}
interface WeaviateConfig {
    host: string;
    scheme: 'http' | 'https';
    port?: number;
    apiKey?: string;
}
export declare class SchemaManager {
    private client;
    private schemaDefinition;
    constructor(config: WeaviateConfig);
    /**
     * Get the complete schema definition
     * Contract requirement: Must return exact schema structure
     */
    getSchemaDefinition(): WeaviateSchema;
    /**
     * Create schema in Weaviate
     * Contract requirement: Must complete within 5 seconds
     */
    createSchema(): Promise<boolean>;
    /**
     * Validate schema exists and matches definition
     * Contract requirement: Must complete within 2 seconds
     */
    validateSchema(): Promise<boolean>;
    /**
     * Check if schema is healthy and operational
     * Contract requirement: Must complete within 1 second
     */
    isSchemaHealthy(): Promise<boolean>;
    /**
     * Delete schema from Weaviate
     * Contract requirement: Clean deletion with proper error handling
     */
    deleteSchema(): Promise<boolean>;
    /**
     * Get schema statistics and metadata
     * Additional utility method for monitoring
     */
    getSchemaStats(): Promise<{
        exists: boolean;
        objectCount: number;
        lastUpdated?: string;
        vectorizerStatus: string;
    }>;
}
export {};
//# sourceMappingURL=SchemaManager.d.ts.map