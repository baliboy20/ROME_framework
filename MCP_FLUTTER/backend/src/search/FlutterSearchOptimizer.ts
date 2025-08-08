/**
 * Flutter Search Optimizer
 * Enhances search queries for Flutter/Dart coding assistance
 * Implements intelligent query expansion and result ranking
 */

import { SemanticSearchEngine } from './SemanticSearchEngine.js';
import { FlutterMetadata } from '../document/FlutterMetadataExtractor.js';

export interface FlutterSearchQuery {
  query: string;
  intent?: 'implementation' | 'debug' | 'pattern' | 'api' | 'example' | 'error-fix';
  context?: {
    currentWidget?: string;
    stateManagement?: string;
    errorMessage?: string;
    platform?: string;
  };
  filters?: {
    category?: FlutterMetadata['category'];
    complexity?: FlutterMetadata['complexity'];
    patterns?: string[];
    platforms?: string[];
  };
}

export interface FlutterSearchResult {
  content: string;
  score: number;
  metadata: FlutterMetadata;
  relevanceFactors: {
    semanticScore: number;
    patternMatch: number;
    contextMatch: number;
    recency: number;
    completeness: number;
  };
  codeSnippets?: Array<{
    code: string;
    language: string;
    description?: string;
  }>;
  quickFix?: {
    problem: string;
    solution: string;
    code?: string;
  };
}

export class FlutterSearchOptimizer {
  private readonly QUERY_EXPANSIONS = {
    // Widget-related expansions
    'widget': ['StatelessWidget', 'StatefulWidget', 'build method', 'context'],
    'state': ['setState', 'State class', 'StatefulWidget', 'state management'],
    'navigation': ['Navigator', 'Route', 'push', 'pop', 'navigation stack'],
    'list': ['ListView', 'ListView.builder', 'ListTile', 'scrolling'],
    'form': ['Form', 'TextFormField', 'validation', 'FormState', 'GlobalKey'],
    
    // State management expansions
    'bloc': ['Bloc', 'Cubit', 'BlocProvider', 'BlocBuilder', 'events', 'states'],
    'provider': ['Provider', 'ChangeNotifier', 'Consumer', 'context.read', 'context.watch'],
    'getx': ['GetX', 'GetBuilder', 'Controller', 'Obx', 'reactive'],
    'riverpod': ['Riverpod', 'ConsumerWidget', 'ref.watch', 'StateNotifier'],
    
    // Common issues expansions
    'null': ['null safety', 'nullable', 'late', 'required', '?', '!'],
    'async': ['Future', 'async', 'await', 'FutureBuilder', 'then'],
    'stream': ['Stream', 'StreamBuilder', 'StreamController', 'listen'],
    'error': ['try catch', 'Exception', 'Error', 'error handling', 'stack trace'],
    
    // Architecture expansions
    'clean': ['clean architecture', 'use case', 'repository', 'domain', 'data layer'],
    'test': ['test', 'testWidgets', 'expect', 'mock', 'integration test']
  };

  private readonly INTENT_KEYWORDS = {
    implementation: ['how to', 'implement', 'create', 'build', 'make', 'develop'],
    debug: ['error', 'bug', 'issue', 'problem', 'fix', 'solve', 'debug'],
    pattern: ['pattern', 'best practice', 'approach', 'architecture', 'design'],
    api: ['api', 'method', 'property', 'class', 'interface', 'parameter'],
    example: ['example', 'sample', 'demo', 'code', 'snippet', 'show'],
    'error-fix': ['error', 'exception', 'failed', 'cannot', 'unable', 'null']
  };

  private readonly SCORING_WEIGHTS = {
    semanticScore: 0.35,
    patternMatch: 0.25,
    contextMatch: 0.20,
    recency: 0.10,
    completeness: 0.10
  };

  constructor(private searchEngine: SemanticSearchEngine) {}

  async searchFlutterDocs(query: FlutterSearchQuery): Promise<FlutterSearchResult[]> {
    // Detect intent if not provided
    const intent = query.intent || this.detectIntent(query.query);
    
    // Expand query based on Flutter context
    const expandedQuery = this.expandQuery(query.query, intent, query.context);
    
    // Perform semantic search
    const searchResults = await this.searchEngine.search({
      query: expandedQuery,
      limit: 20, // Get more results for re-ranking
      threshold: 0.5
    });
    
    // Convert and enhance results
    const flutterResults = searchResults.map(result => 
      this.enhanceResult(result, query, intent)
    );
    
    // Re-rank based on Flutter-specific factors
    const rankedResults = this.rankResults(flutterResults, query, intent);
    
    // Add code snippets and quick fixes
    const enhancedResults = await this.addCodeSnippetsAndFixes(rankedResults, intent);
    
    // Return top results
    return enhancedResults.slice(0, 10);
  }

  private detectIntent(query: string): FlutterSearchQuery['intent'] {
    const lowerQuery = query.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return intent as FlutterSearchQuery['intent'];
      }
    }
    
    return 'implementation'; // Default intent
  }

  private expandQuery(
    query: string, 
    intent: FlutterSearchQuery['intent'], 
    context?: FlutterSearchQuery['context']
  ): string {
    let expanded = query;
    
    // Add intent-specific terms
    switch (intent) {
      case 'implementation':
        expanded += ' implementation example code snippet';
        break;
      case 'debug':
        expanded += ' error handling debugging troubleshooting solution';
        break;
      case 'pattern':
        expanded += ' pattern best practice architecture design approach';
        break;
      case 'api':
        expanded += ' API reference documentation methods properties';
        break;
      case 'example':
        expanded += ' example sample demo usage code';
        break;
      case 'error-fix':
        expanded += ' error exception fix solution resolve';
        break;
    }
    
    // Add context-specific terms
    if (context) {
      if (context.currentWidget) {
        expanded += ` ${context.currentWidget} widget`;
      }
      if (context.stateManagement) {
        expanded += ` ${context.stateManagement} state management`;
      }
      if (context.errorMessage) {
        expanded += ` ${context.errorMessage}`;
      }
      if (context.platform) {
        expanded += ` ${context.platform} platform specific`;
      }
    }
    
    // Apply keyword expansions
    const words = query.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (this.QUERY_EXPANSIONS[word as keyof typeof this.QUERY_EXPANSIONS]) {
        const expansions = this.QUERY_EXPANSIONS[word as keyof typeof this.QUERY_EXPANSIONS];
        expanded += ' ' + expansions.join(' ');
      }
    }
    
    return expanded;
  }

  private enhanceResult(
    searchResult: any,
    query: FlutterSearchQuery,
    intent: FlutterSearchQuery['intent']
  ): FlutterSearchResult {
    // Parse metadata if stored as JSON string
    const metadata = typeof searchResult.metadata === 'string' 
      ? JSON.parse(searchResult.metadata) 
      : searchResult.metadata;
    
    // Calculate relevance factors
    const relevanceFactors = {
      semanticScore: searchResult.score || 0,
      patternMatch: this.calculatePatternMatch(metadata, query),
      contextMatch: this.calculateContextMatch(metadata, query.context),
      recency: this.calculateRecency(metadata),
      completeness: (metadata.completeness || 0) / 100
    };
    
    // Calculate combined score
    const score = Object.entries(relevanceFactors).reduce(
      (total, [factor, value]) => 
        total + value * this.SCORING_WEIGHTS[factor as keyof typeof this.SCORING_WEIGHTS],
      0
    );
    
    return {
      content: searchResult.content,
      score,
      metadata,
      relevanceFactors,
      codeSnippets: this.extractCodeSnippets(searchResult.content),
      quickFix: intent === 'error-fix' ? this.extractQuickFix(searchResult.content) : undefined
    };
  }

  private calculatePatternMatch(metadata: FlutterMetadata, query: FlutterSearchQuery): number {
    let score = 0;
    const queryLower = query.query.toLowerCase();
    
    // Check pattern matches
    if (metadata.patterns) {
      if (metadata.patterns.widgets?.some(w => queryLower.includes(w.toLowerCase()))) score += 0.3;
      if (metadata.patterns.stateManagement?.some(s => queryLower.includes(s))) score += 0.3;
      if (metadata.patterns.architecture?.some(a => queryLower.includes(a))) score += 0.2;
      if (metadata.patterns.features?.some(f => queryLower.includes(f))) score += 0.2;
    }
    
    // Check filter matches
    if (query.filters) {
      if (query.filters.category === metadata.category) score += 0.3;
      if (query.filters.complexity === metadata.complexity) score += 0.2;
      if (query.filters.patterns?.some(p => metadata.tags?.includes(p))) score += 0.3;
      if (query.filters.platforms?.some(p => metadata.platforms?.includes(p as any))) score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private calculateContextMatch(
    metadata: FlutterMetadata, 
    context?: FlutterSearchQuery['context']
  ): number {
    if (!context) return 0.5; // Neutral score if no context
    
    let score = 0;
    let factors = 0;
    
    if (context.currentWidget) {
      factors++;
      if (metadata.codeElements?.widgets?.includes(context.currentWidget)) score += 1;
      else if (metadata.patterns?.widgets?.includes(context.currentWidget)) score += 0.5;
    }
    
    if (context.stateManagement) {
      factors++;
      if (metadata.patterns?.stateManagement?.includes(context.stateManagement as any)) score += 1;
    }
    
    if (context.platform) {
      factors++;
      if (metadata.platforms?.includes(context.platform as any)) score += 1;
    }
    
    return factors > 0 ? score / factors : 0.5;
  }

  private calculateRecency(metadata: FlutterMetadata): number {
    if (!metadata.lastUpdated) return 0.5;
    
    const now = new Date();
    const updated = new Date(metadata.lastUpdated);
    const daysSince = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 30) return 1;
    if (daysSince < 90) return 0.8;
    if (daysSince < 180) return 0.6;
    if (daysSince < 365) return 0.4;
    return 0.2;
  }

  private rankResults(
    results: FlutterSearchResult[],
    query: FlutterSearchQuery,
    intent: FlutterSearchQuery['intent']
  ): FlutterSearchResult[] {
    // Apply intent-specific boosting
    results.forEach(result => {
      switch (intent) {
        case 'implementation':
          if (result.metadata.documentType === 'example') result.score *= 1.2;
          if (result.codeSnippets && result.codeSnippets.length > 0) result.score *= 1.1;
          break;
        case 'debug':
        case 'error-fix':
          if (result.metadata.category === 'error-handling') result.score *= 1.3;
          if (result.quickFix) result.score *= 1.2;
          break;
        case 'pattern':
          if (result.metadata.documentType === 'pattern') result.score *= 1.3;
          if (result.metadata.bestPractices?.length) result.score *= 1.1;
          break;
        case 'api':
          if (result.metadata.documentType === 'api') result.score *= 1.3;
          if (result.metadata.documentType === 'reference') result.score *= 1.1;
          break;
        case 'example':
          if (result.metadata.documentType === 'example') result.score *= 1.3;
          if (result.codeSnippets && result.codeSnippets.length > 2) result.score *= 1.1;
          break;
      }
    });
    
    // Sort by score
    return results.sort((a, b) => b.score - a.score);
  }

  private extractCodeSnippets(content: string): FlutterSearchResult['codeSnippets'] {
    const snippets: FlutterSearchResult['codeSnippets'] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'dart';
      const code = match[2].trim();
      
      // Extract description from preceding line if available
      const beforeCode = content.substring(Math.max(0, match.index - 200), match.index);
      const descMatch = beforeCode.match(/([^\n]+)\n*$/);
      const description = descMatch ? descMatch[1].trim() : undefined;
      
      snippets.push({
        code,
        language,
        description: description?.replace(/[:#]/, '').trim()
      });
    }
    
    return snippets.length > 0 ? snippets : undefined;
  }

  private extractQuickFix(content: string): FlutterSearchResult['quickFix'] | undefined {
    // Look for problem/solution patterns
    const problemMatch = content.match(/(?:Problem|Issue|Error):\s*([^\n]+)/i);
    const solutionMatch = content.match(/(?:Solution|Fix|Resolution):\s*([^\n]+)/i);
    
    if (problemMatch && solutionMatch) {
      // Look for code after solution
      const afterSolution = content.substring(content.indexOf(solutionMatch[0]));
      const codeMatch = afterSolution.match(/```\w*\n([\s\S]*?)```/);
      
      return {
        problem: problemMatch[1].trim(),
        solution: solutionMatch[1].trim(),
        code: codeMatch ? codeMatch[1].trim() : undefined
      };
    }
    
    return undefined;
  }

  private async addCodeSnippetsAndFixes(
    results: FlutterSearchResult[],
    intent: FlutterSearchQuery['intent']
  ): Promise<FlutterSearchResult[]> {
    // This is where you could add additional processing,
    // such as fetching related code examples from a separate index
    // or generating quick fixes using AI
    
    return results;
  }

  // Helper method to generate Flutter-specific search suggestions
  generateSearchSuggestions(partialQuery: string): string[] {
    const suggestions: string[] = [];
    const lower = partialQuery.toLowerCase();
    
    // Widget suggestions
    const widgets = [
      'Container', 'Row', 'Column', 'Stack', 'Scaffold', 'ListView',
      'GridView', 'TextField', 'Button', 'AppBar', 'Card', 'Dialog'
    ];
    suggestions.push(...widgets.filter(w => w.toLowerCase().startsWith(lower)));
    
    // Pattern suggestions
    const patterns = [
      'Bloc pattern', 'Provider pattern', 'Clean architecture',
      'Error handling', 'Navigation', 'State management', 'Testing'
    ];
    suggestions.push(...patterns.filter(p => p.toLowerCase().includes(lower)));
    
    // Common queries
    const common = [
      'How to create a custom widget',
      'How to handle errors',
      'How to navigate between screens',
      'How to manage state',
      'How to test widgets',
      'How to use async/await'
    ];
    suggestions.push(...common.filter(c => c.toLowerCase().includes(lower)));
    
    return suggestions.slice(0, 10);
  }
}