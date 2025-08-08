/**
 * Snippet Handler - get_snippet tool
 * 
 * Retrieves specific code snippets by ID with optional context
 * Provides formatted code examples with metadata and related concepts
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';

interface SnippetArgs {
  snippet_id: string;
  include_context?: boolean;
}

interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  snippet_type: 'widget' | 'pattern' | 'template' | 'example';
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  context?: string;
  related_concepts: string[];
  metadata: {
    source?: string;
    version?: string;
    tags?: string[];
    category?: string;
  };
}

export class SnippetHandler extends BaseToolHandler {
  private weaviateClient: any;

  constructor(weaviateClient: any, logger: any) {
    super('get_snippet', logger);
    this.weaviateClient = weaviateClient;
  }

  getToolDefinition(): Tool {
    return {
      name: 'get_snippet',
      description: 'Retrieve specific code snippet by ID with optional context and related information',
      inputSchema: {
        type: 'object',
        properties: {
          snippet_id: {
            type: 'string',
            description: 'Unique identifier for the code snippet to retrieve'
          },
          include_context: {
            type: 'boolean',
            description: 'Whether to include additional context and usage examples',
            default: false
          }
        },
        required: ['snippet_id']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: SnippetArgs = { snippet_id: '' };

    // Validate snippet_id (required)
    const snippetIdError = this.validateString(parsedArgs.snippet_id, 'snippet_id', true, 200);
    if (snippetIdError) {
      errors.push(snippetIdError);
    } else {
      sanitizedArgs.snippet_id = this.sanitizeString(parsedArgs.snippet_id);
    }

    // Validate include_context (optional)
    if (parsedArgs.include_context !== undefined) {
      if (typeof parsedArgs.include_context !== 'boolean') {
        errors.push(this.createValidationError('include_context', 'include_context must be a boolean', 'INVALID_TYPE'));
      } else {
        sanitizedArgs.include_context = parsedArgs.include_context;
      }
    } else {
      sanitizedArgs.include_context = false; // Default value
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { snippet_id, include_context = false } = args as SnippetArgs;

    try {
      this.logger.info(`Retrieving snippet: ${snippet_id}`, { include_context });

      // Retrieve the snippet from Weaviate
      const snippet = await this.retrieveSnippet(snippet_id, include_context!);
      
      if (!snippet) {
        return this.createErrorResponse(
          `Snippet not found: ${snippet_id}`,
          { snippet_id, available_snippets: await this.getAvailableSnippetIds() }
        );
      }

      // Format the snippet for response
      const formattedText = this.formatSnippet(snippet, include_context!);
      
      const meta = {
        snippet_type: snippet.snippet_type,
        language: snippet.language,
        complexity_level: snippet.complexity_level,
        related_concepts: snippet.related_concepts
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Snippet retrieval failed: ${errorMessage}`, { snippet_id, error });
      return this.createErrorResponse(
        `Failed to retrieve snippet: ${errorMessage}`,
        { snippet_id, error: errorMessage }
      );
    }
  }

  private async retrieveSnippet(snippetId: string, includeContext: boolean): Promise<CodeSnippet | null> {
    try {
      // Build Weaviate query using the correct API
      const response = await this.weaviateClient.graphql
        .get()
        .withClassName('FlutterDoc')
        .withFields('content category source section tags codeType version lastUpdated _additional { id certainty }')
        .withWhere({
          operator: 'Or',
          operands: [
            { path: ['source'], operator: 'Like', valueText: `*${snippetId}*` },
            { path: ['section'], operator: 'Like', valueText: `*${snippetId}*` },
            { path: ['tags'], operator: 'ContainsAny', valueText: [snippetId] }
          ]
        })
        .withLimit(1)
        .do();
      
      if (response.errors) {
        throw new Error(`Weaviate query failed: ${JSON.stringify(response.errors)}`);
      }

      const documents = response.data?.Get?.FlutterDoc || [];
      
      if (documents.length === 0) {
        return null;
      }

      const doc = documents[0];
      
      // Extract code from content
      const code = this.extractCode(doc.content);
      if (!code) {
        return null;
      }

      // Build snippet object
      const snippet: CodeSnippet = {
        id: snippetId,
        title: doc.section || this.generateTitle(snippetId),
        code: code,
        language: this.detectLanguage(code),
        snippet_type: this.categorizeSnippet(doc.codeType, code),
        complexity_level: this.assessComplexity(code),
        description: this.extractDescription(doc.content),
        related_concepts: this.extractRelatedConcepts(doc.tags, doc.content),
        metadata: {
          source: doc.source,
          version: doc.version,
          tags: doc.tags || [],
          category: doc.category
        }
      };

      if (includeContext) {
        snippet.context = this.extractContext(doc.content, code);
      }

      return snippet;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Snippet retrieval error', { error, snippetId });
      throw new Error(`Failed to retrieve snippet: ${errorMessage}`);
    }
  }

  private extractCode(content: string): string | null {
    // Extract code blocks (markdown format)
    const codeBlockRegex = /```(?:dart|flutter)?\n?([\s\S]*?)\n?```/;
    const match = content.match(codeBlockRegex);
    
    if (match) {
      return match[1]?.trim() || '';
    }

    // Look for inline code that might be a snippet
    const inlineCodeRegex = /`([^`]+)`/g;
    const inlineMatches = [...content.matchAll(inlineCodeRegex)];
    
    if (inlineMatches.length > 0) {
      // Return the longest inline code block
      const longestMatch = inlineMatches.reduce((longest, current) => 
        (current[1]?.length || 0) > (longest[1]?.length || 0) ? current : longest
      );
      
      if (longestMatch[1] && longestMatch[1].length > 20) { // Only if reasonably substantial
        return longestMatch[1];
      }
    }

    // Look for class/method definitions
    const classRegex = /(class\s+\w+[\s\S]*?})/;
    const classMatch = content.match(classRegex);
    if (classMatch && classMatch[1]) {
      return classMatch[1];
    }

    return null;
  }

  private detectLanguage(code: string): string {
    // Simple language detection based on common patterns
    if (code.includes('class ') && code.includes('extends StatefulWidget')) {
      return 'dart';
    }
    if (code.includes('Widget ') || code.includes('BuildContext')) {
      return 'dart';
    }
    if (code.includes('pubspec.yaml') || code.includes('dependencies:')) {
      return 'yaml';
    }
    if (code.includes('{') && code.includes('}') && code.includes(';')) {
      return 'dart';
    }
    
    return 'dart'; // Default for Flutter docs
  }

  private categorizeSnippet(codeType?: string, code?: string): 'widget' | 'pattern' | 'template' | 'example' {
    if (codeType) {
      switch (codeType.toLowerCase()) {
        case 'widget': return 'widget';
        case 'pattern': return 'pattern';
        case 'template': return 'template';
        case 'example': return 'example';
      }
    }

    // Auto-categorize based on code content
    if (code) {
      if (code.includes('extends StatefulWidget') || code.includes('extends StatelessWidget')) {
        return 'widget';
      }
      if (code.includes('// Pattern:') || code.includes('// Design Pattern')) {
        return 'pattern';
      }
      if (code.includes('// Template') || code.includes('// Boilerplate')) {
        return 'template';
      }
    }

    return 'example';
  }

  private assessComplexity(code: string): 'beginner' | 'intermediate' | 'advanced' {
    // Simple complexity assessment based on code characteristics
    let complexity = 0;

    // Count complexity indicators
    const indicators = [
      /async\s+/g,
      /await\s+/g,
      /Stream<.*?>/g,
      /Future<.*?>/g,
      /setState\(/g,
      /initState\(/g,
      /dispose\(/g,
      /AnimationController/g,
      /StreamBuilder/g,
      /FutureBuilder/g,
      /Provider/g,
      /BlocProvider/g,
      /CustomPainter/g,
      /ValueListenableBuilder/g
    ];

    indicators.forEach(indicator => {
      const matches = code.match(indicator);
      if (matches) {
        complexity += matches.length;
      }
    });

    // Check for nested structures
    const braceDepth = this.calculateMaxBraceDepth(code);
    complexity += Math.max(0, braceDepth - 2);

    // Check line count
    const lineCount = code.split('\n').length;
    complexity += Math.floor(lineCount / 20);

    // Categorize complexity
    if (complexity <= 2) return 'beginner';
    if (complexity <= 6) return 'intermediate';
    return 'advanced';
  }

  private calculateMaxBraceDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }

  private extractDescription(content: string): string {
    // Extract description from content (usually first paragraph)
    const lines = content.split('\n');
    const descriptionLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('```') && !trimmed.startsWith('#')) {
        descriptionLines.push(trimmed);
        if (descriptionLines.length >= 3) break; // Limit to first few lines
      }
    }
    
    return descriptionLines.join(' ').substring(0, 200) + (descriptionLines.join(' ').length > 200 ? '...' : '');
  }

  private extractContext(content: string, code: string): string {
    // Extract context around the code block
    const codeIndex = content.indexOf(code);
    if (codeIndex === -1) return '';

    // Get text before and after the code
    const beforeText = content.substring(0, codeIndex).trim();
    const afterText = content.substring(codeIndex + code.length).trim();

    let context = '';
    
    if (beforeText) {
      const beforeLines = beforeText.split('\n').slice(-3); // Last 3 lines before code
      context += beforeLines.join('\n') + '\n\n';
    }

    if (afterText) {
      const afterLines = afterText.split('\n').slice(0, 3); // First 3 lines after code
      context += '\n\n' + afterLines.join('\n');
    }

    return context.trim();
  }

  private extractRelatedConcepts(tags?: string[], content?: string): string[] {
    const concepts = new Set<string>();

    // Add tags as concepts
    if (tags) {
      tags.forEach(tag => concepts.add(tag));
    }

    // Extract concepts from content
    if (content) {
      const conceptPatterns = [
        /\b(StatefulWidget|StatelessWidget|Widget)\b/g,
        /\b(setState|initState|dispose|build)\b/g,
        /\b(Navigator|Route|MaterialPageRoute)\b/g,
        /\b(Provider|BlocProvider|StreamBuilder)\b/g,
        /\b(Animation|AnimationController|Tween)\b/g,
        /\b(Theme|ThemeData|MaterialApp)\b/g
      ];

      conceptPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => concepts.add(match));
        }
      });
    }

    return Array.from(concepts).slice(0, 10); // Limit to 10 concepts
  }

  private generateTitle(snippetId: string): string {
    // Generate a readable title from snippet ID
    return snippetId
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatSnippet(snippet: CodeSnippet, includeContext: boolean): string {
    let formatted = `**${snippet.title}**\n\n`;
    
    if (snippet.description) {
      formatted += `${snippet.description}\n\n`;
    }

    if (includeContext && snippet.context) {
      formatted += `**Context:**\n${snippet.context}\n\n`;
    }

    // Format the code block
    formatted += `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n`;

    // Add metadata
    formatted += `**Details:**\n`;
    formatted += `- Type: ${snippet.snippet_type}\n`;
    formatted += `- Complexity: ${snippet.complexity_level}\n`;
    formatted += `- Language: ${snippet.language}\n`;

    if (snippet.related_concepts.length > 0) {
      formatted += `- Related concepts: ${snippet.related_concepts.join(', ')}\n`;
    }

    if (snippet.metadata.tags && snippet.metadata.tags.length > 0) {
      formatted += `- Tags: ${snippet.metadata.tags.join(', ')}\n`;
    }

    return formatted;
  }

  private async getAvailableSnippetIds(): Promise<string[]> {
    try {
      // Get a sample of available snippet IDs for error context
      const graphqlQuery = `
        {
          Get {
            FlutterDoc(
              where: { path: ["codeType"], operator: NotEqual, valueText: "" }
              limit: 10
            ) {
              source
              section
              tags
            }
          }
        }
      `;

      const response = await this.weaviateClient.graphql.get().withQuery(graphqlQuery).do();
      const documents = response.data?.Get?.FlutterDoc || [];
      
      const snippetIds = new Set<string>();
      documents.forEach((doc: any) => {
        if (doc.source) snippetIds.add(doc.source);
        if (doc.section) snippetIds.add(doc.section);
        if (doc.tags) doc.tags.forEach((tag: any) => snippetIds.add(tag));
      });

      return Array.from(snippetIds).slice(0, 10);
    } catch (error) {
      return ['flutter_stateful_widget_basic', 'flutter_navigation_example', 'flutter_theme_setup'];
    }
  }
}