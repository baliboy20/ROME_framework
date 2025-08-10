/**
 * ROME Search Handler - search_rome_docs tool
 * 
 * Handles semantic search requests against ROME methodology documentation
 * Provides intelligent search with ROME-specific categories and robot context
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface SearchRomeArgs {
  query: string;
  category?: 'methodology' | 'protocols' | 'contracts' | 'coordination' | 'standards' | 'examples';
  robot_type?: 'pma' | 'backend' | 'frontend' | 'data' | 'devops' | 'qa';
  phase?: 'planning' | 'development' | 'integration' | 'deployment';
  limit?: number;
}

interface RomeSearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  robot_type?: string;
  phase?: string;
  relevance_score: number;
  metadata: {
    source?: string;
    section?: string;
    protocol_step?: number;
    contract_type?: string;
    rome_tags?: string[];
  };
}

export class SearchRomeDocsHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validCategories = [
    'methodology', 'protocols', 'contracts', 'coordination', 'standards', 'examples'
  ];
  private readonly validRobotTypes = [
    'pma', 'backend', 'frontend', 'data', 'devops', 'qa'
  ];
  private readonly validPhases = [
    'planning', 'development', 'integration', 'deployment'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('search_rome_docs', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'search_rome_docs',
      description: 'Search ROME methodology documentation with specialized categories and robot context',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for ROME methodology documentation, protocols, and examples'
          },
          category: {
            type: 'string',
            description: 'ROME-specific category filter',
            enum: this.validCategories
          },
          robot_type: {
            type: 'string',
            description: 'Filter by robot role/type for relevant guidance',
            enum: this.validRobotTypes
          },
          phase: {
            type: 'string', 
            description: 'Filter by project phase',
            enum: this.validPhases
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (1-20)',
            default: 5,
            minimum: 1,
            maximum: 20
          }
        },
        required: ['query']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: SearchRomeArgs = { query: '' };

    // Validate query (required)
    const queryError = this.validateString(parsedArgs.query, 'query', true, 500);
    if (queryError) {
      errors.push(queryError);
    } else {
      sanitizedArgs.query = this.sanitizeString(parsedArgs.query);
    }

    // Validate category (optional)
    if (parsedArgs.category !== undefined) {
      const categoryError = this.validateEnum(parsedArgs.category, 'category', this.validCategories, false);
      if (categoryError) {
        errors.push(categoryError);
      } else {
        sanitizedArgs.category = parsedArgs.category as any;
      }
    }

    // Validate robot_type (optional)
    if (parsedArgs.robot_type !== undefined) {
      const robotError = this.validateEnum(parsedArgs.robot_type, 'robot_type', this.validRobotTypes, false);
      if (robotError) {
        errors.push(robotError);
      } else {
        sanitizedArgs.robot_type = parsedArgs.robot_type as any;
      }
    }

    // Validate phase (optional)
    if (parsedArgs.phase !== undefined) {
      const phaseError = this.validateEnum(parsedArgs.phase, 'phase', this.validPhases, false);
      if (phaseError) {
        errors.push(phaseError);
      } else {
        sanitizedArgs.phase = parsedArgs.phase as any;
      }
    }

    // Validate limit (optional)
    if (parsedArgs.limit !== undefined) {
      const limitError = this.validateNumber(parsedArgs.limit, 'limit', false, 1, 20);
      if (limitError) {
        errors.push(limitError);
      } else {
        sanitizedArgs.limit = parseInt(parsedArgs.limit.toString());
      }
    } else {
      sanitizedArgs.limit = 5; // Default value
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { query, category, robot_type, phase, limit } = args as SearchRomeArgs;
    const startTime = Date.now();

    try {
      this.logger.info(`Executing ROME search: "${query}"`, { category, robot_type, phase, limit });

      // Call VDB Management Service for search
      const searchResults = await this.performRomeSearch(query, category, robot_type, phase, limit);
      const queryTime = Date.now() - startTime;

      // Format results for response
      const formattedText = this.formatRomeSearchResults(searchResults, query);
      
      const meta = {
        total_results: searchResults.length,
        query_time_ms: queryTime,
        rome_context: {
          category: category || 'all',
          robot_type: robot_type || 'any',
          phase: phase || 'any'
        },
        suggested_next_tools: this.getSuggestedNextTools(searchResults, category),
        results: searchResults
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`ROME search execution failed: ${errorMessage}`, { query, category, robot_type, phase, limit, error });
      return this.createErrorResponse(
        `ROME search failed: ${errorMessage}`,
        { query, category, robot_type, phase, limit, error: errorMessage }
      );
    }
  }

  private async performRomeSearch(
    query: string, 
    category?: string, 
    robot_type?: string, 
    phase?: string, 
    limit: number = 5
  ): Promise<RomeSearchResult[]> {
    try {
      // Build search parameters for VDB service
      const searchParams: any = {
        query,
        limit,
        rome_mode: true
      };

      // Add ROME-specific filters
      const filters: any = {};
      if (category) filters.rome_category = category;
      if (robot_type) filters.robot_type = robot_type;
      if (phase) filters.project_phase = phase;

      if (Object.keys(filters).length > 0) {
        searchParams.filters = filters;
      }

      // Call VDB Management Service
      const response = await axios.post(`${this.vdbServiceUrl}/api/v1/documents/search`, searchParams, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.success) {
        throw new Error(`VDB search failed: ${response.data.message || 'Unknown error'}`);
      }

      const documents = response.data.results || [];
      
      // Transform to RomeSearchResult format
      return documents.map((doc: any, index: number): RomeSearchResult => ({
        id: doc.id || `rome_result_${index}`,
        title: this.extractRomeTitle(doc.content, doc.section, doc.rome_category),
        content: this.truncateContent(doc.content, 400),
        category: doc.rome_category || category || 'general',
        robot_type: doc.robot_type,
        phase: doc.project_phase,
        relevance_score: doc.relevance || doc.certainty || 0,
        metadata: {
          source: doc.source,
          section: doc.section,
          protocol_step: doc.protocol_step,
          contract_type: doc.contract_type,
          rome_tags: doc.rome_tags || doc.tags || []
        }
      }));

    } catch (error) {
      this.logger.error('VDB service search error', { error, query, category, robot_type, phase, limit });
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('VDB Management Service is not available. Please check if the service is running.');
        }
        if (error.response?.status === 404) {
          throw new Error('Search endpoint not found in VDB Management Service.');
        }
      }
      
      throw new Error(`VDB service search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private extractRomeTitle(content: string, section?: string, category?: string): string {
    if (section) {
      return section;
    }

    // Extract title based on ROME content patterns
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // Look for ROME-specific patterns
    if (firstLine && firstLine.includes('Step ')) {
      return firstLine.replace(/^#+\s*/, ''); // Protocol step
    }
    
    if (firstLine && (firstLine.includes('Contract') || firstLine.includes('TDD'))) {
      return firstLine.replace(/^#+\s*/, ''); // Contract template
    }
    
    if (firstLine && firstLine.length > 0 && firstLine.length < 100) {
      return firstLine.replace(/^#+\s*/, ''); // Regular title
    }

    // Fallback based on category
    switch (category) {
      case 'protocols': return 'ROME Protocol';
      case 'contracts': return 'TDD Contract Template';
      case 'standards': return 'ROME Standards';
      case 'coordination': return 'Project Coordination';
      default: return 'ROME Documentation';
    }
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    const boundary = Math.max(lastPeriod, lastNewline);
    if (boundary > maxLength * 0.8) {
      return truncated.substring(0, boundary + 1);
    }

    return truncated + '...';
  }

  private formatRomeSearchResults(results: RomeSearchResult[], query: string): string {
    if (results.length === 0) {
      return `ROME Search Results:\n\nNo ROME methodology documents found for "${query}".\n\nSuggestions:\n- Try broader terms like "TDD protocol" or "robot coordination"\n- Check if ROME documentation has been ingested\n- Use get_robot_protocol for step-by-step guidance`;
    }

    let formatted = `ROME Search Results:\n\nFound ${results.length} relevant ROME document${results.length === 1 ? '' : 's'} for "${query}":\n\n`;

    results.forEach((result, index) => {
      const relevancePercent = Math.round(result.relevance_score * 100);
      
      formatted += `${index + 1}. **${result.title}**\n`;
      formatted += `   Category: ${result.category}`;
      
      if (result.robot_type) {
        formatted += ` | Robot: ${result.robot_type}`;
      }
      
      if (result.phase) {
        formatted += ` | Phase: ${result.phase}`;
      }
      
      formatted += `\n   Relevance: ${relevancePercent}%\n`;
      formatted += `   Content: ${result.content}\n`;
      
      if (result.metadata.protocol_step) {
        formatted += `   Protocol Step: ${result.metadata.protocol_step}/8\n`;
      }
      
      if (result.metadata.contract_type) {
        formatted += `   Contract Type: ${result.metadata.contract_type}\n`;
      }
      
      if (result.metadata.rome_tags && result.metadata.rome_tags.length > 0) {
        formatted += `   Tags: ${result.metadata.rome_tags.join(', ')}\n`;
      }
      
      formatted += '\n';
    });

    // Add ROME-specific suggestions
    formatted += '---\n';
    formatted += '**Next Steps:**\n';
    formatted += '- Use get_contract_template to generate TDD contracts\n';
    formatted += '- Use get_robot_protocol for detailed 8-step guidance\n';
    formatted += '- Use check_roma_approval for standards validation\n';

    return formatted;
  }

  private getSuggestedNextTools(results: RomeSearchResult[], category?: string): string[] {
    const suggestions: string[] = [];
    
    // Suggest tools based on search results and category
    if (category === 'contracts' || results.some(r => r.metadata.contract_type)) {
      suggestions.push('get_contract_template');
    }
    
    if (category === 'protocols' || results.some(r => r.metadata.protocol_step)) {
      suggestions.push('get_robot_protocol');
    }
    
    if (category === 'standards' || results.some(r => r.category === 'standards')) {
      suggestions.push('check_roma_approval');
    }
    
    if (category === 'coordination' || results.some(r => r.robot_type)) {
      suggestions.push('get_coordination_status');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('get_rome_standards', 'get_robot_protocol');
    }
    
    return suggestions;
  }
}