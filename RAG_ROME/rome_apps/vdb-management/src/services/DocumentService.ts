import { Logger } from '../utils/Logger.js';
import { WeaviateService } from './WeaviateService.js';

export class DocumentService {
  constructor(private weaviate: WeaviateService, private logger: Logger) {}

  async getById(documentId: string): Promise<any | null> {
    this.logger.info('Getting document by ID', { documentId });
    
    // Mock document retrieval
    const mockDocuments = {
      'doc_1': {
        id: 'doc_1',
        title: 'ROME TDD Protocol Step 1',
        content: 'Read and understand requirements thoroughly before beginning implementation',
        rome_category: 'protocols',
        robot_type: 'all',
        created_at: new Date().toISOString()
      },
      'doc_2': {
        id: 'doc_2',
        title: 'API Contract Template',
        content: 'Standard template for API contract definition including endpoints, schemas, and test cases',
        rome_category: 'contracts',
        robot_type: 'backend',
        created_at: new Date().toISOString()
      }
    };

    return (mockDocuments as any)[documentId] || null;
  }

  async getStats(): Promise<any> {
    this.logger.info('Getting document statistics');
    
    // Get stats from Weaviate service
    const weaviateStats = await this.weaviate.getStats();
    
    return {
      ...weaviateStats,
      robot_types: {
        'all': Math.floor(weaviateStats.total_documents * 0.4),
        'pma': Math.floor(weaviateStats.total_documents * 0.2),
        'backend': Math.floor(weaviateStats.total_documents * 0.15),
        'frontend': Math.floor(weaviateStats.total_documents * 0.15),
        'data': Math.floor(weaviateStats.total_documents * 0.05),
        'devops': Math.floor(weaviateStats.total_documents * 0.03),
        'qa': Math.floor(weaviateStats.total_documents * 0.02)
      }
    };
  }

  async search(params: any): Promise<any[]> {
    this.logger.info('Document search via DocumentService', { params });
    // Delegate to WeaviateService for actual search
    return this.weaviate.search(params);
  }

  async create(document: any): Promise<any> {
    this.logger.info('Creating document', { 
      title: document.title,
      category: document.rome_category 
    });
    
    try {
      const documentId = await this.weaviate.addDocument(document);
      return { 
        success: true, 
        document_id: documentId,
        document: {
          id: documentId,
          ...document,
          created_at: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to create document', { error });
      throw error;
    }
  }

  async update(documentId: string, updates: any): Promise<any> {
    this.logger.info('Updating document', { documentId, updates });
    
    try {
      await this.weaviate.updateDocument(documentId, updates);
      return { 
        success: true, 
        document_id: documentId, 
        updated_at: new Date().toISOString() 
      };
    } catch (error) {
      this.logger.error('Failed to update document', { error, documentId });
      throw error;
    }
  }

  async delete(documentId: string): Promise<any> {
    this.logger.info('Deleting document', { documentId });
    
    try {
      await this.weaviate.deleteDocument(documentId);
      return { 
        success: true, 
        document_id: documentId, 
        deleted_at: new Date().toISOString() 
      };
    } catch (error) {
      this.logger.error('Failed to delete document', { error, documentId });
      throw error;
    }
  }
}