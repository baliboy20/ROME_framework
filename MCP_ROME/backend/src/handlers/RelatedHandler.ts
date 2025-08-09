/**
 * Related Handler - get_related tool
 * 
 * Retrieves related documents and concepts based on topic and context
 * Provides intelligent suggestions for further learning and exploration
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';

interface RelatedArgs {
  topic: string;
  context?: string;
  limit?: number;
}

interface RelatedDocument {
  id: string;
  title: string;
  summary: string;
  relevance_score: number;
  relationship_type: 'prerequisite' | 'related' | 'advanced' | 'alternative' | 'example';
  metadata: {
    category?: string;
    tags?: string[];
    complexity?: 'beginner' | 'intermediate' | 'advanced';
    source?: string;
  };
}

export class RelatedHandler extends BaseToolHandler {
  private weaviateClient: any;

  constructor(weaviateClient: any, logger: any) {
    super('get_related', logger);
    this.weaviateClient = weaviateClient;
  }

  getToolDefinition(): Tool {
    return {
      name: 'get_related',
      description: 'Get related documents and concepts based on a topic with optional context',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The main topic to find related content for'
          },
          context: {
            type: 'string',
            description: 'Optional context to refine the search for more relevant results'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of related items to return (1-20)',
            default: 5,
            minimum: 1,
            maximum: 20
          }
        },
        required: ['topic']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: RelatedArgs = { topic: '' };

    // Validate topic (required)
    const topicError = this.validateString(parsedArgs.topic, 'topic', true, 200);
    if (topicError) {
      errors.push(topicError);
    } else {
      sanitizedArgs.topic = this.sanitizeString(parsedArgs.topic);
    }

    // Validate context (optional)
    if (parsedArgs.context !== undefined) {
      const contextError = this.validateString(parsedArgs.context, 'context', false, 500);
      if (contextError) {
        errors.push(contextError);
      } else {
        sanitizedArgs.context = this.sanitizeString(parsedArgs.context);
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
    const { topic, context, limit } = args as RelatedArgs;

    try {
      this.logger.info(`Finding related documents for topic: "${topic}"`, { context, limit });

      // Find related documents using multiple strategies
      const relatedDocs = await this.findRelatedDocuments(topic, context, limit);
      
      if (relatedDocs.length === 0) {
        return this.createSuccessResponse(
          `Related Documents:\n\nNo related documents found for "${topic}". Try using broader search terms or different topic keywords.`,
          { topic, context, related_count: 0, documents: [] }
        );
      }

      // Format results for response
      const formattedText = this.formatRelatedDocuments(relatedDocs, topic);
      
      const meta = {
        topic,
        related_count: relatedDocs.length,
        documents: relatedDocs
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Related documents search failed: ${errorMessage}`, { topic, context, error });
      return this.createErrorResponse(
        `Failed to find related documents: ${errorMessage}`,
        { topic, context, error: errorMessage }
      );
    }
  }

  private async findRelatedDocuments(topic: string, context?: string, limit: number = 5): Promise<RelatedDocument[]> {
    try {
      // Build search query combining topic and context
      const searchConcepts = context ? [topic, context] : [topic];
      
      // Perform semantic search for related content
      const semanticResults = await this.performSemanticSearch(searchConcepts, limit * 2);
      
      // Get conceptually related documents
      const conceptualResults = await this.findConceptuallyRelated(topic, limit);
      
      // Combine and rank results
      const allResults = [...semanticResults, ...conceptualResults];
      const uniqueResults = this.deduplicateResults(allResults);
      
      // Categorize relationships and score relevance
      const categorizedResults = uniqueResults.map(doc => 
        this.categorizeRelationship(doc, topic, context)
      );

      // Sort by relevance and relationship type priority
      const sortedResults = this.sortByRelevance(categorizedResults);
      
      return sortedResults.slice(0, limit);

    } catch (error) {
      this.logger.error('Related documents search error', { error, topic, context });
      throw new Error(`Failed to find related documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async performSemanticSearch(concepts: string[], limit: number): Promise<RelatedDocument[]> {
    try {
      const response = await this.weaviateClient.graphql
        .get()
        .withClassName('FlutterDoc')
        .withFields('content category source section tags codeType version _additional { certainty distance id }')
        .withNearText({ concepts })
        .withLimit(limit)
        .do();
      
      if (response.errors) {
        throw new Error(`Weaviate query failed: ${JSON.stringify(response.errors)}`);
      }

      const documents = response.data?.Get?.FlutterDoc || [];
      
      return documents.map((doc: any): RelatedDocument => ({
        id: doc._additional?.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: this.extractTitle(doc.section, doc.content),
        summary: this.generateSummary(doc.content),
        relevance_score: doc._additional?.certainty || 0,
        relationship_type: 'related', // Will be categorized later
        metadata: {
          category: doc.category,
          tags: doc.tags || [],
          source: doc.source,
          complexity: this.assessComplexity(doc.content)
        }
      }));

    } catch (error) {
      this.logger.warn('Semantic search failed, using fallback', error);
      return [];
    }
  }

  private async findConceptuallyRelated(topic: string, limit: number): Promise<RelatedDocument[]> {
    try {
      // Build conceptual relationships based on Flutter ecosystem knowledge
      const conceptualMap = this.getConceptualRelationships(topic.toLowerCase());
      
      if (conceptualMap.length === 0) {
        return [];
      }

      // Search for documents containing related concepts
      const relatedConcepts = conceptualMap.slice(0, 5); // Limit concepts to search
      
      const conceptPromises = relatedConcepts.map(async (concept) => {
        try {
          const response = await this.weaviateClient.graphql
            .get()
            .withClassName('FlutterDoc')
            .withFields('content category section tags source _additional { id certainty }')
            .withWhere({
              operator: 'Or',
              operands: [
                { path: ['content'], operator: 'Like', valueText: `*${concept}*` },
                { path: ['tags'], operator: 'ContainsAny', valueText: [concept] },
                { path: ['section'], operator: 'Like', valueText: `*${concept}*` }
              ]
            })
            .withLimit(2)
            .do();
          const documents = response.data?.Get?.FlutterDoc || [];
          
          return documents.map((doc: any): RelatedDocument => ({
            id: doc._additional?.id || `conceptual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: this.extractTitle(doc.section, doc.content),
            summary: this.generateSummary(doc.content),
            relevance_score: 0.8, // High relevance for conceptual matches
            relationship_type: 'related',
            metadata: {
              category: doc.category,
              tags: doc.tags || [],
              source: doc.source,
              complexity: this.assessComplexity(doc.content)
            }
          }));
        } catch (error) {
          return [];
        }
      });

      const results = await Promise.all(conceptPromises);
      return results.flat();

    } catch (error) {
      this.logger.warn('Conceptual search failed', error);
      return [];
    }
  }

  private getConceptualRelationships(topic: string): string[] {
    // Conceptual relationship mapping for Flutter topics
    const relationshipMap: Record<string, string[]> = {
      // State management
      'state management': ['provider', 'bloc', 'riverpod', 'getx', 'redux', 'mobx', 'setState'],
      'provider': ['state management', 'changenotifier', 'consumer', 'selector', 'inherited widget'],
      'bloc': ['state management', 'cubit', 'event', 'state', 'stream'],
      'redux': ['state management', 'store', 'action', 'reducer', 'middleware'],

      // Widgets
      'widget': ['stateless widget', 'stateful widget', 'inherited widget', 'render object'],
      'stateful widget': ['state', 'initstate', 'dispose', 'setstate', 'widget lifecycle'],
      'stateless widget': ['build method', 'const constructor', 'immutable'],
      'custom widget': ['widget composition', 'widget tree', 'build method'],

      // Navigation
      'navigation': ['navigator', 'route', 'page route', 'named routes', 'router'],
      'router': ['go_router', 'auto_route', 'navigation', 'deep linking'],
      'navigator': ['push', 'pop', 'route', 'material page route'],

      // Animation
      'animation': ['animation controller', 'tween', 'animated widget', 'implicit animation'],
      'animation controller': ['ticker provider', 'dispose', 'duration', 'curve'],
      'tween': ['begin', 'end', 'lerp', 'animation'],

      // Performance
      'performance': ['const constructor', 'render object', 'repaint boundary', 'optimization'],
      'optimization': ['const widgets', 'widget caching', 'list optimization', 'image optimization'],

      // Testing
      'testing': ['widget test', 'unit test', 'integration test', 'test framework'],
      'widget test': ['testwidgets', 'finder', 'tester', 'pump'],

      // Theming
      'theme': ['theme data', 'color scheme', 'text theme', 'material theme'],
      'theming': ['dark theme', 'light theme', 'custom theme', 'theme extension'],

      // Layout
      'layout': ['flex', 'column', 'row', 'stack', 'positioned', 'container'],
      'responsive design': ['media query', 'layout builder', 'flexible', 'expanded'],

      // Forms
      'forms': ['text field', 'form validation', 'text editing controller', 'form state'],
      'validation': ['form validator', 'input validation', 'error handling'],

      // Networking
      'networking': ['http client', 'dio', 'rest api', 'json serialization'],
      'api': ['http', 'rest', 'graphql', 'websocket', 'dio'],

      // Database
      'database': ['sqflite', 'hive', 'shared preferences', 'floor', 'drift'],
      'local storage': ['shared preferences', 'sqflite', 'hive', 'secure storage']
    };

    const related = relationshipMap[topic] || [];
    
    // Add partial matches for compound topics
    Object.keys(relationshipMap).forEach(key => {
      if (key.includes(topic) || topic.includes(key)) {
        const keyRelated = relationshipMap[key];
        if (keyRelated) {
          related.push(...keyRelated);
        }
      }
    });

    return Array.from(new Set(related)); // Remove duplicates
  }

  private extractTitle(section?: string, content?: string): string {
    if (section && section.trim()) {
      return section.trim();
    }

    if (content) {
      // Extract first meaningful line as title
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().replace(/^#+\s*/, ''); // Remove markdown headers
        if (trimmed && trimmed.length > 5 && trimmed.length < 100) {
          return trimmed;
        }
      }
    }

    return 'Flutter Documentation';
  }

  private generateSummary(content: string): string {
    // Generate a concise summary of the content
    if (!content || content.length === 0) {
      return 'No summary available';
    }

    // Get first few sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 2).join('. ').trim();
    
    if (summary.length > 200) {
      return summary.substring(0, 197) + '...';
    }

    return summary || 'Brief documentation content';
  }

  private assessComplexity(content: string): 'beginner' | 'intermediate' | 'advanced' {
    if (!content) return 'beginner';

    let complexityScore = 0;

    // Check for advanced patterns
    const advancedPatterns = [
      /async\s+/g, /await\s+/g, /Stream</g, /Future</g,
      /AnimationController/g, /CustomPainter/g, /RenderObject/g,
      /Provider/g, /BlocProvider/g, /Cubit/g
    ];

    advancedPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexityScore += matches.length;
    });

    // Check for intermediate patterns
    const intermediatePatterns = [
      /setState/g, /initState/g, /dispose/g,
      /Navigator/g, /Route/g, /MaterialPageRoute/g,
      /StatefulWidget/g, /FutureBuilder/g, /StreamBuilder/g
    ];

    intermediatePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexityScore += matches.length * 0.5;
    });

    if (complexityScore > 5) return 'advanced';
    if (complexityScore > 2) return 'intermediate';
    return 'beginner';
  }

  private categorizeRelationship(doc: RelatedDocument, topic: string, context?: string): RelatedDocument {
    const content = doc.summary.toLowerCase();
    const topicLower = topic.toLowerCase();
    
    // Determine relationship type based on content analysis
    if (content.includes('basic') || content.includes('introduction') || content.includes('getting started')) {
      doc.relationship_type = 'prerequisite';
    } else if (content.includes('advanced') || content.includes('complex') || content.includes('deep')) {
      doc.relationship_type = 'advanced';
    } else if (content.includes('example') || content.includes('tutorial') || content.includes('demo')) {
      doc.relationship_type = 'example';
    } else if (content.includes('alternative') || content.includes('different') || content.includes('another')) {
      doc.relationship_type = 'alternative';
    } else {
      doc.relationship_type = 'related';
    }

    // Adjust relevance based on relationship type and context
    if (context) {
      const contextLower = context.toLowerCase();
      if (content.includes(contextLower)) {
        doc.relevance_score = Math.min(1.0, doc.relevance_score + 0.2);
      }
    }

    return doc;
  }

  private deduplicateResults(results: RelatedDocument[]): RelatedDocument[] {
    const seen = new Set<string>();
    return results.filter(doc => {
      const key = doc.title.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortByRelevance(documents: RelatedDocument[]): RelatedDocument[] {
    // Relationship type priority
    const relationshipPriority = {
      prerequisite: 5,
      example: 4,
      related: 3,
      advanced: 2,
      alternative: 1
    };

    return documents.sort((a, b) => {
      // First sort by relationship priority
      const priorityDiff = relationshipPriority[b.relationship_type] - relationshipPriority[a.relationship_type];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by relevance score
      return b.relevance_score - a.relevance_score;
    });
  }

  private formatRelatedDocuments(documents: RelatedDocument[], topic: string): string {
    let formatted = `Related Documents:\n\nFor topic: "${topic}"\n\nFound ${documents.length} related document${documents.length === 1 ? '' : 's'}:\n\n`;

    documents.forEach((doc, index) => {
      const relationshipIcon = this.getRelationshipIcon(doc.relationship_type);
      const complexityIcon = this.getComplexityIcon(doc.metadata.complexity);
      const relevancePercent = Math.round(doc.relevance_score * 100);
      
      formatted += `${index + 1}. ${relationshipIcon} **${doc.title}**\n`;
      formatted += `   Relationship: ${doc.relationship_type} | Complexity: ${complexityIcon} ${doc.metadata.complexity} | Relevance: ${relevancePercent}%\n`;
      formatted += `   Summary: ${doc.summary}\n`;
      
      if (doc.metadata.category) {
        formatted += `   Category: ${doc.metadata.category}\n`;
      }
      
      if (doc.metadata.tags && doc.metadata.tags.length > 0) {
        formatted += `   Tags: ${doc.metadata.tags.slice(0, 5).join(', ')}\n`;
      }
      
      formatted += '\n';
    });

    // Add footer with suggestions for further exploration
    formatted += '---\n';
    formatted += 'Use search_docs to explore these topics further, or get_snippet to see specific code examples.\n';

    return formatted;
  }

  private getRelationshipIcon(relationship: string): string {
    const icons = {
      prerequisite: '📚',
      example: '💡',
      related: '🔗',
      advanced: '🚀',
      alternative: '🔄'
    };
    return icons[relationship as keyof typeof icons] || '📄';
  }

  private getComplexityIcon(complexity?: string): string {
    const icons = {
      beginner: '🟢',
      intermediate: '🟡', 
      advanced: '🔴'
    };
    return icons[(complexity || 'beginner') as keyof typeof icons] || '⚪';
  }
}