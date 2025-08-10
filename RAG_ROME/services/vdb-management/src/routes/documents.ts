/**
 * Documents API Routes
 * 
 * Handles document search, indexing, and retrieval for ROME methodology
 * Primary endpoint used by MCP server for semantic document search
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface ServiceRequest extends Request {
  services?: {
    weaviate: any;
    coordination: any;
    documents: any;
    logger: any;
  };
}

const router = Router();

/**
 * Search documents endpoint
 * POST /api/v1/documents/search
 * 
 * Primary endpoint called by MCP server handlers
 * Supports ROME-specific categories and robot-role filtering
 */
router.post('/search', async (req: ServiceRequest, res: Response) => {
  try {
    const { query, rome_category, robot_role, limit = 10, threshold = 0.7 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required and must be a string',
        timestamp: new Date().toISOString()
      });
    }

    req.services?.logger?.info('Document search requested', {
      query,
      rome_category,
      robot_role,
      limit,
      threshold
    });

    // Execute search via Weaviate service
    const searchParams = {
      query,
      rome_category,
      robot_role,
      limit: Math.min(limit, 50), // Cap at 50 results
      threshold
    };

    const results = await req.services?.weaviate?.search(searchParams);

    res.status(200).json({
      success: true,
      results: results || [],
      query_info: {
        original_query: query,
        rome_category,
        robot_role,
        results_count: results?.length || 0,
        search_params: searchParams
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Document search failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Document search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * List available ROME categories endpoint
 * GET /api/v1/documents/categories
 */
router.get('/categories', async (req: ServiceRequest, res: Response) => {
  try {
    const categories = [
      'protocols',
      'standards', 
      'contracts',
      'coordination',
      'templates',
      'validation',
      'integration',
      'documentation'
    ];

    res.status(200).json({
      success: true,
      categories,
      total_categories: categories.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Categories retrieval failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Categories retrieval failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Document statistics endpoint
 * GET /api/v1/documents/stats
 */
router.get('/stats', async (req: ServiceRequest, res: Response) => {
  try {
    req.services?.logger?.info('Document statistics requested');

    // Get stats from document service
    const stats = await req.services?.documents?.getStats() || {
      total_documents: 0,
      categories: {},
      robot_types: {},
      last_updated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Document statistics failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      message: 'Document statistics retrieval failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get document by ID endpoint
 * GET /api/v1/documents/:id
 */
router.get('/:id', async (req: ServiceRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
        timestamp: new Date().toISOString()
      });
    }

    req.services?.logger?.info('Document retrieval requested', { document_id: id });

    // Get document via document service
    const document = await req.services?.documents?.getById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        document_id: id,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      document,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Document retrieval failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      document_id: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Document retrieval failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Create document endpoint
 * POST /api/v1/documents
 */
router.post('/', async (req: ServiceRequest, res: Response) => {
  try {
    const { title, content, rome_category, robot_type, protocol_step, tags } = req.body;

    if (!title || !content || !rome_category) {
      return res.status(400).json({
        success: false,
        message: 'title, content, and rome_category are required',
        timestamp: new Date().toISOString()
      });
    }

    req.services?.logger?.info('Document creation requested', {
      title,
      rome_category,
      robot_type
    });

    const document = {
      title,
      content,
      rome_category,
      robot_type: robot_type || 'all',
      protocol_step: protocol_step || null,
      tags: tags || [],
      created_at: new Date().toISOString()
    };

    const result = await req.services?.documents?.create(document);

    res.status(201).json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.services?.logger?.error('Document creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: 'Document creation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Bulk upload endpoint
 * POST /api/v1/documents/bulk-upload
 * 
 * Processes all markdown files in the uploads directory
 */
router.post('/bulk-upload', async (req: ServiceRequest, res: Response) => {
  try {
    req.services?.logger?.info('Bulk upload started');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.status(400).json({
        success: false,
        message: 'Uploads directory not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Recursively find all .md files from uploads directory and subfolders
    const getAllMarkdownFiles = (dir: string, relativePath = ''): { file: string, fullPath: string, relativePath: string }[] => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      let files: { file: string, fullPath: string, relativePath: string }[] = [];
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const itemRelativePath = path.join(relativePath, item.name);
        
        if (item.isDirectory()) {
          // Recursively scan subdirectories
          files = files.concat(getAllMarkdownFiles(fullPath, itemRelativePath));
        } else if (item.isFile() && item.name.endsWith('.md')) {
          files.push({
            file: item.name,
            fullPath: fullPath,
            relativePath: itemRelativePath
          });
        }
      }
      
      return files;
    };
    
    const files = getAllMarkdownFiles(uploadsDir);
    
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No markdown files found in uploads directory',
        timestamp: new Date().toISOString()
      });
    }
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const fileInfo of files) {
      try {
        const content = fs.readFileSync(fileInfo.fullPath, 'utf-8');
        
        // Extract title from filename (remove .md extension) and include subfolder context
        const baseTitle = path.basename(fileInfo.file, '.md').replace(/[-_]/g, ' ');
        const folderContext = path.dirname(fileInfo.relativePath) !== '.' ? 
          path.dirname(fileInfo.relativePath).replace(/[\/\\]/g, ' - ') + ' - ' : '';
        const title = folderContext + baseTitle;
        
        // Determine ROME category based on filename and folder path keywords
        let rome_category = 'documentation';
        let robot_type = 'all';
        let protocol_step = null;
        
        const lowerFile = fileInfo.relativePath.toLowerCase();
        if (lowerFile.includes('protocol') || lowerFile.includes('tdd')) {
          rome_category = 'protocols';
          if (lowerFile.includes('step')) {
            const stepMatch = lowerFile.match(/step[\s-_]*(\d+)/);
            if (stepMatch) protocol_step = parseInt(stepMatch[1]);
          }
        } else if (lowerFile.includes('contract') || lowerFile.includes('api')) {
          rome_category = 'contracts';
        } else if (lowerFile.includes('standard') || lowerFile.includes('guide')) {
          rome_category = 'standards';
        } else if (lowerFile.includes('coordination') || lowerFile.includes('pma')) {
          rome_category = 'coordination';
          robot_type = 'pma';
        }
        
        // Determine robot type from filename
        if (lowerFile.includes('backend') || lowerFile.includes('api') || lowerFile.includes('server')) {
          robot_type = 'backend';
        } else if (lowerFile.includes('frontend') || lowerFile.includes('ui') || lowerFile.includes('component')) {
          robot_type = 'frontend';
        } else if (lowerFile.includes('data') || lowerFile.includes('database')) {
          robot_type = 'data';
        } else if (lowerFile.includes('devops') || lowerFile.includes('deploy')) {
          robot_type = 'devops';
        } else if (lowerFile.includes('qa') || lowerFile.includes('test')) {
          robot_type = 'qa';
        } else if (lowerFile.includes('pma') || lowerFile.includes('coordination')) {
          robot_type = 'pma';
        }
        
        const document = {
          title: title,
          content: content,
          rome_category: rome_category,
          robot_type: robot_type,
          protocol_step: protocol_step,
          tags: [rome_category, robot_type].filter(tag => tag && tag !== 'all'),
          source_file: fileInfo.relativePath
        };
        
        const result = await req.services?.documents?.create(document);
        
        if (result.success) {
          successCount++;
          results.push({
            file: fileInfo.relativePath,
            status: 'success',
            document_id: result.document_id,
            title: title,
            category: rome_category,
            robot_type: robot_type
          });
        } else {
          errorCount++;
          results.push({
            file: fileInfo.relativePath,
            status: 'error',
            error: 'Creation failed'
          });
        }
        
      } catch (error) {
        errorCount++;
        results.push({
          file: fileInfo.relativePath,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        req.services?.logger?.error('Failed to process file', { 
          file: fileInfo.relativePath, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    req.services?.logger?.info('Bulk upload completed', {
      total_files: files.length,
      success_count: successCount,
      error_count: errorCount
    });
    
    res.status(200).json({
      success: true,
      message: `Bulk upload completed: ${successCount} successful, ${errorCount} failed`,
      summary: {
        total_files: files.length,
        successful_uploads: successCount,
        failed_uploads: errorCount
      },
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    req.services?.logger?.error('Bulk upload failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    res.status(500).json({
      success: false,
      message: 'Bulk upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as documentsRouter };