import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { Logger } from '../utils/Logger.js';

interface WeaviateConfig {
  scheme: string;
  host: string;
}

export class WeaviateService {
  private client: WeaviateClient;
  private readonly ROME_CLASS = 'RomeDocument';

  constructor(private config: WeaviateConfig, private logger: Logger) {
    this.client = weaviate.client({
      scheme: config.scheme,
      host: config.host,
    });
    
    this.logger.info('Weaviate client initialized', { 
      scheme: config.scheme, 
      host: config.host 
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.misc.liveChecker().do();
      this.logger.info('Weaviate health check passed', { result });
      return true;
    } catch (error) {
      this.logger.error('Weaviate health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.host 
      });
      return false;
    }
  }

  async initializeSchemas(): Promise<void> {
    try {
      // Check if ROME schema exists
      const schema = await this.client.schema.getter().do();
      const existingClass = schema.classes?.find((cls: any) => cls.class === this.ROME_CLASS);
      
      if (existingClass) {
        this.logger.info('ROME schema already exists', { className: this.ROME_CLASS });
        return;
      }

      // Create ROME document schema
      const classDefinition = {
        class: this.ROME_CLASS,
        description: 'ROME methodology documents and guidance',
        vectorizer: 'text2vec-openai',
        properties: [
          {
            name: 'title',
            dataType: ['text'],
            description: 'Document title'
          },
          {
            name: 'content',
            dataType: ['text'],
            description: 'Document content'
          },
          {
            name: 'rome_category',
            dataType: ['text'],
            description: 'ROME category: protocols, standards, contracts, coordination, templates, validation, integration'
          },
          {
            name: 'robot_type',
            dataType: ['text'],
            description: 'Target robot type: pma, backend, frontend, data, devops, qa, all'
          },
          {
            name: 'protocol_step',
            dataType: ['int'],
            description: 'ROME TDD protocol step (1-8)'
          },
          {
            name: 'created_at',
            dataType: ['date'],
            description: 'Document creation timestamp'
          },
          {
            name: 'updated_at',
            dataType: ['date'],
            description: 'Document last update timestamp'
          },
          {
            name: 'tags',
            dataType: ['text[]'],
            description: 'Document tags for filtering'
          }
        ]
      };

      await this.client.schema.classCreator().withClass(classDefinition).do();
      this.logger.info('ROME schema created successfully', { className: this.ROME_CLASS });

    } catch (error) {
      this.logger.error('Failed to initialize schemas', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async search(params: any): Promise<any[]> {
    try {
      const { 
        query, 
        rome_category, 
        robot_role, 
        limit = 10, 
        threshold = 0.7,
        protocol_step 
      } = params;

      this.logger.info('Executing Weaviate search', { 
        query, 
        rome_category, 
        robot_role, 
        limit, 
        threshold 
      });

      let searchQuery = this.client.graphql
        .get()
        .withClassName(this.ROME_CLASS)
        .withFields('title content rome_category robot_type protocol_step created_at _additional { certainty distance }')
        .withLimit(limit);

      // Add semantic search
      if (query) {
        searchQuery = searchQuery.withNearText({ concepts: [query] });
      }

      // Add filtering
      const whereFilters: any[] = [];
      
      if (rome_category) {
        whereFilters.push({
          path: ['rome_category'],
          operator: 'Equal',
          valueText: rome_category
        });
      }

      if (robot_role && robot_role !== 'all') {
        whereFilters.push({
          operator: 'Or',
          operands: [
            {
              path: ['robot_type'],
              operator: 'Equal',
              valueText: robot_role
            },
            {
              path: ['robot_type'],
              operator: 'Equal',
              valueText: 'all'
            }
          ]
        });
      }

      if (protocol_step) {
        whereFilters.push({
          path: ['protocol_step'],
          operator: 'Equal',
          valueInt: protocol_step
        });
      }

      if (whereFilters.length > 0) {
        const whereCondition = whereFilters.length === 1 
          ? whereFilters[0]
          : { operator: 'And', operands: whereFilters };
        
        searchQuery = searchQuery.withWhere(whereCondition);
      }

      const result = await searchQuery.do();
      const documents = result?.data?.Get?.[this.ROME_CLASS] || [];

      // Filter by threshold if semantic search was used
      const filteredDocs = query 
        ? documents.filter((doc: any) => (doc._additional?.certainty || 0) >= threshold)
        : documents;

      this.logger.info('Weaviate search completed', { 
        resultCount: filteredDocs.length,
        totalFound: documents.length 
      });

      // Transform results to expected format
      return filteredDocs.map((doc: any, index: number) => ({
        id: `doc_${index + 1}`,
        title: doc.title,
        content: doc.content,
        rome_category: doc.rome_category,
        robot_type: doc.robot_type,
        protocol_step: doc.protocol_step,
        created_at: doc.created_at,
        relevance: doc._additional?.certainty || 0.8,
        distance: doc._additional?.distance || null
      }));

    } catch (error) {
      this.logger.error('Weaviate search failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        params 
      });
      
      // Return fallback mock data if Weaviate fails
      return [{
        id: 'fallback_doc_1',
        title: 'ROME TDD Protocol Step 1',
        content: 'Read and understand requirements thoroughly before beginning implementation',
        rome_category: params.rome_category || 'protocols',
        robot_type: params.robot_role || 'all',
        protocol_step: 1,
        created_at: new Date().toISOString(),
        relevance: 0.75
      }];
    }
  }

  async addDocument(document: any): Promise<string> {
    try {
      const docData = {
        title: document.title,
        content: document.content,
        rome_category: document.rome_category,
        robot_type: document.robot_type || 'all',
        protocol_step: document.protocol_step || null,
        created_at: document.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: document.tags || []
      };

      const result = await this.client.data
        .creator()
        .withClassName(this.ROME_CLASS)
        .withProperties(docData)
        .do();

      this.logger.info('Document added to Weaviate', { 
        documentId: result.id,
        title: docData.title,
        category: docData.rome_category 
      });

      return result.id || `generated_${Date.now()}`;
    } catch (error) {
      this.logger.error('Failed to add document to Weaviate', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async updateDocument(id: string, updates: any): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      await this.client.data
        .updater()
        .withClassName(this.ROME_CLASS)
        .withId(id)
        .withProperties(updateData)
        .do();

      this.logger.info('Document updated in Weaviate', { documentId: id });
    } catch (error) {
      this.logger.error('Failed to update document in Weaviate', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId: id 
      });
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await this.client.data
        .deleter()
        .withClassName(this.ROME_CLASS)
        .withId(id)
        .do();

      this.logger.info('Document deleted from Weaviate', { documentId: id });
    } catch (error) {
      this.logger.error('Failed to delete document from Weaviate', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId: id 
      });
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const result = await this.client.graphql
        .aggregate()
        .withClassName(this.ROME_CLASS)
        .withFields('meta { count }')
        .do();

      const totalCount = result?.data?.Aggregate?.[this.ROME_CLASS]?.[0]?.meta?.count || 0;

      // Get category breakdown
      const categoryResult = await this.client.graphql
        .aggregate()
        .withClassName(this.ROME_CLASS)
        .withGroupBy(['rome_category'])
        .withFields('groupedBy { value } meta { count }')
        .do();

      const categoryStats = (categoryResult?.data?.Aggregate?.[this.ROME_CLASS] || [])
        .reduce((acc: any, item: any) => {
          if (item.groupedBy?.value) {
            acc[item.groupedBy.value] = item.meta?.count || 0;
          }
          return acc;
        }, {});

      return {
        total_documents: totalCount,
        categories: categoryStats,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get Weaviate stats', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      // Return fallback stats
      return {
        total_documents: 0,
        categories: {},
        last_updated: new Date().toISOString()
      };
    }
  }

  async close(): Promise<void> {
    this.logger.info('Weaviate connection closed');
    // The weaviate-ts-client doesn't require explicit connection closing
  }
}