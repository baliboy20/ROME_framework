/**
 * ResultProcessor Implementation
 * Processes and ranks search results with advanced relevance scoring
 */

interface RawResult {
  id: string;
  content: string;
  score: number;
  properties: Record<string, any>;
}

interface ProcessedResult {
  id: string;
  content: string;
  title: string;
  similarity: number;
  metadata: {
    categories: string[];
    tags: string[];
    language: string;
    codeType?: string;
    complexity: string;
    frameworks: string[];
    path: string;
    lastModified: Date;
  };
  rank: number;
  relevanceScore: number;
  snippet: string;
}

interface RankingCriteria {
  weights: {
    similarity: number;
    freshness: number;
    popularity: number;
    exactMatch: number;
  };
  boosts: {
    categories?: Record<string, number>;
    frameworks?: Record<string, number>;
    codeTypes?: Record<string, number>;
  };
}

interface SearchResult {
  id: string;
  content: string;
  title: string;
  similarity: number;
  metadata: {
    categories: string[];
    tags: string[];
    language: string;
    codeType?: string;
    complexity: string;
    frameworks: string[];
    path: string;
    lastModified: Date;
  };
}

export class ResultProcessor {
  private readonly defaultRankingCriteria: RankingCriteria = {
    weights: {
      similarity: 0.5,
      freshness: 0.2,
      popularity: 0.2,
      exactMatch: 0.1
    },
    boosts: {
      categories: {},
      frameworks: {},
      codeTypes: {}
    }
  };

  private calculateFreshnessScore(lastModified: Date): number {
    const now = new Date();
    const ageInDays = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
    
    // Exponential decay: newer content scores higher
    if (ageInDays <= 30) return 1.0;
    if (ageInDays <= 90) return 0.8;
    if (ageInDays <= 180) return 0.6;
    if (ageInDays <= 365) return 0.4;
    if (ageInDays <= 730) return 0.2;
    return 0.1;
  }

  private calculatePopularityScore(result: SearchResult): number {
    // In a real implementation, this would consider:
    // - View count, download count, usage metrics
    // - Star ratings, favorites, bookmarks  
    // - Copy/paste frequency, reference count
    
    // For now, use heuristics based on content characteristics
    let score = 0.5; // Base score
    
    // Boost for comprehensive content
    const contentLength = result.content.length;
    if (contentLength > 1000) score += 0.2;
    else if (contentLength > 500) score += 0.1;
    
    // Boost for well-documented code
    if (result.content.includes('/**') || result.content.includes('///')) {
      score += 0.1;
    }
    
    // Boost for examples and patterns
    if (result.metadata.codeType === 'pattern') score += 0.2;
    else if (result.metadata.codeType === 'template') score += 0.1;
    
    // Boost for popular frameworks
    const popularFrameworks = ['flutter', 'react', 'angular', 'firebase'];
    const hasPopularFramework = result.metadata.frameworks.some(fw => 
      popularFrameworks.includes(fw.toLowerCase())
    );
    if (hasPopularFramework) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private calculateExactMatchScore(query: string, result: SearchResult): number {
    const queryLower = query.toLowerCase();
    const contentLower = result.content.toLowerCase();
    const titleLower = result.title.toLowerCase();
    
    let score = 0;
    
    // Exact phrase match in title (highest boost)
    if (titleLower.includes(queryLower)) {
      score += 0.5;
    }
    
    // Exact phrase match in content
    if (contentLower.includes(queryLower)) {
      score += 0.3;
    }
    
    // Individual word matches
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    const matchingWords = queryWords.filter(word => 
      titleLower.includes(word) || contentLower.includes(word)
    );
    
    if (queryWords.length > 0) {
      score += (matchingWords.length / queryWords.length) * 0.2;
    }
    
    // Tag matches
    const tagMatches = result.metadata.tags.filter(tag => 
      queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)
    );
    score += tagMatches.length * 0.05;
    
    return Math.min(1.0, score);
  }

  private applyBoosts(baseScore: number, result: SearchResult, criteria: RankingCriteria): number {
    let boostedScore = baseScore;
    
    // Category boosts
    if (criteria.boosts.categories) {
      for (const category of result.metadata.categories) {
        const boost = criteria.boosts.categories[category];
        if (boost) {
          boostedScore *= boost;
        }
      }
    }
    
    // Framework boosts
    if (criteria.boosts.frameworks) {
      for (const framework of result.metadata.frameworks) {
        const boost = criteria.boosts.frameworks[framework];
        if (boost) {
          boostedScore *= boost;
        }
      }
    }
    
    // Code type boosts
    if (criteria.boosts.codeTypes && result.metadata.codeType) {
      const boost = criteria.boosts.codeTypes[result.metadata.codeType];
      if (boost) {
        boostedScore *= boost;
      }
    }
    
    return boostedScore;
  }

  private generateSnippet(content: string, query?: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content.trim();
    }
    
    // If query provided, try to find relevant section
    if (query) {
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      const contentLower = content.toLowerCase();
      
      // Find best match position
      let bestPosition = 0;
      let bestScore = 0;
      
      for (let i = 0; i < content.length - maxLength; i += 50) {
        const section = contentLower.substring(i, i + maxLength);
        const matches = queryWords.filter(word => section.includes(word)).length;
        if (matches > bestScore) {
          bestScore = matches;
          bestPosition = i;
        }
      }
      
      if (bestScore > 0) {
        // Extract snippet around best match, trying to break at word boundaries
        let start = bestPosition;
        let end = bestPosition + maxLength;
        
        // Try to start at beginning of sentence or word
        while (start > 0 && content[start] !== '.' && content[start] !== '\n' && content[start] !== ' ') {
          start--;
          if (bestPosition - start > 50) break; // Don't go too far back
        }
        if (content[start] === '.' || content[start] === '\n') start++;
        
        // Try to end at end of sentence or word
        while (end < content.length && content[end] !== '.' && content[end] !== '\n' && content[end] !== ' ') {
          end++;
          if (end - (bestPosition + maxLength) > 50) break; // Don't go too far forward
        }
        
        let snippet = content.substring(start, end).trim();
        
        // Add ellipsis if needed
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        
        return snippet;
      }
    }
    
    // Fallback: take first maxLength characters, breaking at word boundary
    let snippet = content.substring(0, maxLength);
    const lastSpace = snippet.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      snippet = snippet.substring(0, lastSpace);
    }
    
    return snippet.trim() + (content.length > maxLength ? '...' : '');
  }

  private transformRawToSearchResult(raw: RawResult): SearchResult {
    const props = raw.properties;
    
    // Extract and normalize metadata
    const tags = Array.isArray(props.tags) ? props.tags : 
                 typeof props.tags === 'string' ? props.tags.split(',').map((t: string) => t.trim()) : [];
    
    const frameworks = Array.isArray(props.frameworks) ? props.frameworks :
                      typeof props.frameworks === 'string' ? props.frameworks.split(',').map((f: string) => f.trim()) : [];
    
    const categories = Array.isArray(props.categories) ? props.categories :
                      typeof props.categories === 'string' ? props.categories.split(',').map((c: string) => c.trim()) :
                      props.category ? [props.category] : [];

    // Generate title from available data
    const title = props.section || props.title || 
                  this.extractTitleFromContent(raw.content) ||
                  this.extractTitleFromPath(props.source) ||
                  'Untitled';

    return {
      id: raw.id,
      content: raw.content,
      title,
      similarity: raw.score,
      metadata: {
        categories,
        tags,
        language: props.language || 'unknown',
        codeType: props.codeType,
        complexity: props.complexity || 'simple',
        frameworks,
        path: props.source || props.path || 'unknown',
        lastModified: props.lastUpdated ? new Date(props.lastUpdated) : new Date()
      }
    };
  }

  private extractTitleFromContent(content: string): string | null {
    // Try to extract class name
    const classMatch = content.match(/class\s+(\w+)/);
    if (classMatch) return `Class ${classMatch[1]}`;
    
    // Try to extract function name
    const functionMatch = content.match(/(?:function|fun|def)\s+(\w+)/);
    if (functionMatch) return `Function ${functionMatch[1]}`;
    
    // Try to extract from comment
    const commentMatch = content.match(/^\/\/\s*(.+)$/m);
    if (commentMatch && commentMatch[1]) return commentMatch[1].substring(0, 50);
    
    return null;
  }

  private extractTitleFromPath(path: string): string | null {
    if (!path || path === 'unknown') return null;
    
    const filename = path.split('/').pop();
    if (filename) {
      return filename.replace(/\.[^/.]+$/, ''); // Remove extension
    }
    
    return null;
  }

  process(results: RawResult[], criteria: RankingCriteria = this.defaultRankingCriteria, query?: string): ProcessedResult[] {
    if (results.length === 0) {
      return [];
    }

    // Transform raw results to search results
    const searchResults = results.map(raw => this.transformRawToSearchResult(raw));

    // Calculate relevance scores for each result
    const scoredResults = searchResults.map((result) => {
      const similarity = result.similarity;
      const freshness = this.calculateFreshnessScore(result.metadata.lastModified);
      const popularity = this.calculatePopularityScore(result);
      const exactMatch = query ? this.calculateExactMatchScore(query, result) : 0;

      // Calculate weighted base score
      const baseRelevanceScore = 
        similarity * criteria.weights.similarity +
        freshness * criteria.weights.freshness +
        popularity * criteria.weights.popularity +
        exactMatch * criteria.weights.exactMatch;

      // Apply boosts
      const finalRelevanceScore = this.applyBoosts(baseRelevanceScore, result, criteria);

      return {
        ...result,
        relevanceScore: Math.min(1.0, finalRelevanceScore)
      };
    });

    // Sort by relevance score (descending)
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Add rank and generate snippets
    const processedResults: ProcessedResult[] = scoredResults.map((result, index) => ({
      ...result,
      rank: index + 1,
      snippet: this.generateSnippet(result.content, query)
    }));

    return processedResults;
  }

  // Utility method to process with default criteria
  processWithDefaults(results: RawResult[], query?: string): ProcessedResult[] {
    return this.process(results, this.defaultRankingCriteria, query);
  }

  // Utility method to create category-boosted criteria
  createCategoryBoostCriteria(categoryBoosts: Record<string, number>): RankingCriteria {
    return {
      ...this.defaultRankingCriteria,
      boosts: {
        ...this.defaultRankingCriteria.boosts,
        categories: categoryBoosts
      }
    };
  }

  // Utility method to create framework-boosted criteria
  createFrameworkBoostCriteria(frameworkBoosts: Record<string, number>): RankingCriteria {
    return {
      ...this.defaultRankingCriteria,
      boosts: {
        ...this.defaultRankingCriteria.boosts,
        frameworks: frameworkBoosts
      }
    };
  }
}