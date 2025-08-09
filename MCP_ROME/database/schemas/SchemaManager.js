"use strict";
/**
 * SchemaManager - Vector Database Schema Implementation
 * Implements contracts defined in vector-database-schema.contract.test.ts
 *
 * Author: Ashok (Data Architect)
 * Purpose: Manage Weaviate schema for FlutterDoc class with full validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaManager = void 0;
const weaviate_ts_client_1 = __importDefault(require("weaviate-ts-client"));
class SchemaManager {
    client;
    schemaDefinition;
    constructor(config) {
        this.client = weaviate_ts_client_1.default.client({
            scheme: config.scheme,
            host: `${config.host}:${config.port || 8080}`,
            apiKey: config.apiKey,
        });
        this.schemaDefinition = {
            class: 'FlutterDoc',
            description: 'Flutter documentation chunks with semantic search',
            properties: [
                {
                    name: 'content',
                    dataType: ['text'],
                    description: 'Documentation content chunk',
                    tokenization: 'word',
                    moduleConfig: {
                        'text2vec-openai': {
                            skip: false,
                            vectorizePropertyName: false,
                        },
                    },
                },
                {
                    name: 'category',
                    dataType: ['string'],
                    description: 'Document category',
                    indexFilterable: true,
                    indexSearchable: true,
                },
                {
                    name: 'subcategory',
                    dataType: ['string'],
                    description: 'Document subcategory',
                    indexFilterable: true,
                },
                {
                    name: 'source',
                    dataType: ['string'],
                    description: 'Source file path',
                    indexFilterable: true,
                },
                {
                    name: 'section',
                    dataType: ['string'],
                    description: 'Document section/heading',
                    indexSearchable: true,
                },
                {
                    name: 'tags',
                    dataType: ['string[]'],
                    description: 'Searchable tags',
                    indexSearchable: true,
                },
                {
                    name: 'codeType',
                    dataType: ['string'],
                    description: 'Type of code: snippet, template, example, rule',
                    indexFilterable: true,
                },
                {
                    name: 'version',
                    dataType: ['string'],
                    description: 'Documentation version',
                    indexFilterable: true,
                },
                {
                    name: 'lastUpdated',
                    dataType: ['date'],
                    description: 'Last update timestamp',
                },
            ],
            vectorizer: 'text2vec-openai',
            moduleConfig: {
                'text2vec-openai': {
                    model: 'text-embedding-3-small',
                    type: 'text',
                    vectorizeClassName: false,
                },
            },
            vectorIndexType: 'hnsw',
            vectorIndexConfig: {
                distance: 'cosine',
                ef: 100,
                efConstruction: 128,
                maxConnections: 32,
            },
        };
    }
    /**
     * Get the complete schema definition
     * Contract requirement: Must return exact schema structure
     */
    getSchemaDefinition() {
        return this.schemaDefinition;
    }
    /**
     * Create schema in Weaviate
     * Contract requirement: Must complete within 5 seconds
     */
    async createSchema() {
        try {
            // Check if schema already exists
            const existingClass = await this.client.schema
                .classGetter()
                .withClassName(this.schemaDefinition.class)
                .do()
                .catch(() => null);
            if (existingClass) {
                // Schema already exists - return true gracefully
                return true;
            }
            // Create new schema
            const result = await this.client.schema
                .classCreator()
                .withClass(this.schemaDefinition)
                .do();
            return result !== null && result !== undefined;
        }
        catch (error) {
            console.error('Schema creation failed:', error);
            return false;
        }
    }
    /**
     * Validate schema exists and matches definition
     * Contract requirement: Must complete within 2 seconds
     */
    async validateSchema() {
        try {
            const existingClass = await this.client.schema
                .classGetter()
                .withClassName(this.schemaDefinition.class)
                .do();
            if (!existingClass) {
                return false;
            }
            // Validate class name
            if (existingClass.class !== this.schemaDefinition.class) {
                return false;
            }
            // Validate properties exist
            const expectedProps = this.schemaDefinition.properties.map(p => p.name);
            const actualProps = existingClass.properties?.map((p) => p.name) || [];
            for (const expectedProp of expectedProps) {
                if (!actualProps.includes(expectedProp)) {
                    return false;
                }
            }
            // Validate vectorizer
            if (existingClass.vectorizer !== this.schemaDefinition.vectorizer) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Schema validation failed:', error);
            return false;
        }
    }
    /**
     * Check if schema is healthy and operational
     * Contract requirement: Must complete within 1 second
     */
    async isSchemaHealthy() {
        try {
            // Check if Weaviate is reachable
            const ready = await this.client.misc.readyChecker().do();
            if (!ready) {
                return false;
            }
            // Check if our schema exists
            const schemaExists = await this.validateSchema();
            if (!schemaExists) {
                return false;
            }
            // Check if vectorizer is working (OpenAI module)
            const modules = await this.client.misc.metaGetter().do();
            const hasOpenAI = modules.modules?.['text2vec-openai'];
            return Boolean(hasOpenAI);
        }
        catch (error) {
            console.error('Schema health check failed:', error);
            return false;
        }
    }
    /**
     * Delete schema from Weaviate
     * Contract requirement: Clean deletion with proper error handling
     */
    async deleteSchema() {
        try {
            const result = await this.client.schema
                .classDeleter()
                .withClassName(this.schemaDefinition.class)
                .do();
            return true;
        }
        catch (error) {
            // If schema doesn't exist, consider deletion successful
            if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
                return true;
            }
            console.error('Schema deletion failed:', error);
            return false;
        }
    }
    /**
     * Get schema statistics and metadata
     * Additional utility method for monitoring
     */
    async getSchemaStats() {
        try {
            const exists = await this.validateSchema();
            if (!exists) {
                return {
                    exists: false,
                    objectCount: 0,
                    vectorizerStatus: 'unknown',
                };
            }
            // Get object count
            const objectCount = await this.client.graphql
                .aggregate()
                .withClassName(this.schemaDefinition.class)
                .withFields('meta { count }')
                .do();
            // Check vectorizer status
            const healthy = await this.isSchemaHealthy();
            return {
                exists: true,
                objectCount: objectCount?.data?.Aggregate?.FlutterDoc?.[0]?.meta?.count || 0,
                lastUpdated: new Date().toISOString(),
                vectorizerStatus: healthy ? 'healthy' : 'unhealthy',
            };
        }
        catch (error) {
            return {
                exists: false,
                objectCount: 0,
                vectorizerStatus: 'error',
            };
        }
    }
}
exports.SchemaManager = SchemaManager;
//# sourceMappingURL=SchemaManager.js.map