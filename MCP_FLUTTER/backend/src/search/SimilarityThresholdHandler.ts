/**
 * SimilarityThresholdHandler Implementation
 * Handles similarity thresholding with adaptive and contextual features
 */

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

interface ThresholdParams {
  minSimilarity: number;
  adaptiveThreshold?: boolean;
  contextualBoost?: boolean;
}

interface ThresholdAnalysis {
  originalCount: number;
  filteredCount: number;
  thresholdUsed: number;
  averageSimilarity: number;
  distribution: {
    high: number;    // > 0.8
    medium: number;  // 0.6 - 0.8  
    low: number;     // < 0.6
  };
}

export class SimilarityThresholdHandler {
  private readonly contextualBoostFactors = {
    categories: {
      'architecture': 0.1,
      'patterns': 0.15,
      'state-management': 0.1,
      'performance': 0.05,
      'security': 0.05
    },
    frameworks: {
      'flutter': 0.05,
      'firebase': 0.05,
      'provider': 0.1,
      'bloc': 0.1,
      'riverpod': 0.1
    },
    codeTypes: {
      'pattern': 0.15,
      'template': 0.1,
      'snippet': 0.05
    },
    complexity: {
      'complex': 0.1,
      'moderate': 0.05,
      'simple': 0.0
    }
  };

  private calculateContextualBoost(result: SearchResult): number {
    let boost = 0;

    // Category boost
    for (const category of result.metadata.categories) {
      const categoryBoost = this.contextualBoostFactors.categories[category as keyof typeof this.contextualBoostFactors.categories];
      if (categoryBoost) {
        boost += categoryBoost;
      }
    }

    // Framework boost
    for (const framework of result.metadata.frameworks) {
      const frameworkBoost = this.contextualBoostFactors.frameworks[framework as keyof typeof this.contextualBoostFactors.frameworks];
      if (frameworkBoost) {
        boost += frameworkBoost;
      }
    }

    // Code type boost
    if (result.metadata.codeType) {
      const codeTypeBoost = this.contextualBoostFactors.codeTypes[result.metadata.codeType as keyof typeof this.contextualBoostFactors.codeTypes];
      if (codeTypeBoost) {
        boost += codeTypeBoost;
      }
    }

    // Complexity boost
    const complexityBoost = this.contextualBoostFactors.complexity[result.metadata.complexity as keyof typeof this.contextualBoostFactors.complexity];
    if (complexityBoost) {
      boost += complexityBoost;
    }

    // Content quality indicators
    if (result.content.includes('/**') || result.content.includes('///')) {
      boost += 0.02; // Well-documented code
    }

    if (result.content.includes('example') || result.content.includes('Example')) {
      boost += 0.03; // Contains examples
    }

    if (result.title && result.title.length > 10) {
      boost += 0.01; // Has descriptive title
    }

    return Math.min(0.3, boost); // Cap boost at 0.3
  }

  private calculateAdaptiveThreshold(results: SearchResult[], baseThreshold: number): number {
    if (results.length === 0) {
      return baseThreshold;
    }

    // Calculate similarity statistics
    const similarities = results.map(r => r.similarity).sort((a, b) => b - a);
    const count = similarities.length;
    
    const mean = similarities.reduce((sum, sim) => sum + sim, 0) / count;
    const median = similarities[Math.floor(count / 2)];
    const stdDev = Math.sqrt(
      similarities.reduce((sum, sim) => sum + Math.pow(sim - mean, 2), 0) / count
    );

    // Adaptive threshold logic
    let adaptiveThreshold = baseThreshold;

    // If results are very similar (low std dev), we can be more strict
    if (stdDev < 0.1 && mean > 0.7) {
      adaptiveThreshold = Math.max(baseThreshold, mean - 0.1);
    }
    
    // If we have very few high-quality results, lower the threshold
    const highQualityCount = similarities.filter(sim => sim > 0.8).length;
    if (highQualityCount < 3 && count > 10) {
      adaptiveThreshold = Math.min(baseThreshold, (median || 0) * 0.9);
    }

    // If we have too many results and they're all high quality, raise the threshold
    if (count > 50 && mean > 0.8) {
      adaptiveThreshold = Math.max(baseThreshold, mean - 0.05);
    }

    // If we have very few results, lower the threshold to be more inclusive
    if (count < 5) {
      adaptiveThreshold = Math.min(baseThreshold, 0.5);
    }

    // Ensure adaptive threshold is within reasonable bounds
    return Math.max(0.3, Math.min(0.95, adaptiveThreshold));
  }

  private applyContextualAdjustments(results: SearchResult[], params: ThresholdParams): SearchResult[] {
    if (!params.contextualBoost) {
      return results;
    }

    return results.map(result => ({
      ...result,
      similarity: Math.min(1.0, result.similarity + this.calculateContextualBoost(result))
    }));
  }

  private analyzeDistribution(results: SearchResult[]): ThresholdAnalysis['distribution'] {
    const distribution = { high: 0, medium: 0, low: 0 };

    for (const result of results) {
      if (result.similarity > 0.8) {
        distribution.high++;
      } else if (result.similarity >= 0.6) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    }

    return distribution;
  }

  private calculateAverageSimilarity(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    
    const sum = results.reduce((acc, result) => acc + result.similarity, 0);
    return sum / results.length;
  }

  threshold(results: SearchResult[], params: ThresholdParams): SearchResult[] {
    if (!results || results.length === 0) {
      return [];
    }

    // Store original results for analysis
    const originalResults = [...results];
    
    // Apply contextual adjustments if enabled
    const adjustedResults = this.applyContextualAdjustments(results, params);

    // Determine the threshold to use
    let thresholdToUse = params.minSimilarity;
    
    if (params.adaptiveThreshold) {
      thresholdToUse = this.calculateAdaptiveThreshold(adjustedResults, params.minSimilarity);
    }

    // Apply the threshold filter
    const filteredResults = adjustedResults.filter(result => 
      result.similarity >= thresholdToUse
    );

    // If adaptive threshold resulted in too few results, fall back to base threshold
    if (params.adaptiveThreshold && filteredResults.length < 2 && adjustedResults.length > 5) {
      const fallbackResults = adjustedResults.filter(result => 
        result.similarity >= params.minSimilarity
      );
      
      if (fallbackResults.length > filteredResults.length) {
        return fallbackResults.sort((a, b) => b.similarity - a.similarity);
      }
    }

    // Sort by similarity (descending)
    return filteredResults.sort((a, b) => b.similarity - a.similarity);
  }

  // Method to analyze threshold effects without applying them
  analyzeThreshold(results: SearchResult[], params: ThresholdParams): ThresholdAnalysis {
    const originalCount = results.length;
    const filteredResults = this.threshold([...results], params);
    const filteredCount = filteredResults.length;

    let thresholdUsed = params.minSimilarity;
    if (params.adaptiveThreshold) {
      thresholdUsed = this.calculateAdaptiveThreshold(results, params.minSimilarity);
    }

    return {
      originalCount,
      filteredCount,
      thresholdUsed: Math.round(thresholdUsed * 100) / 100,
      averageSimilarity: Math.round(this.calculateAverageSimilarity(filteredResults) * 100) / 100,
      distribution: this.analyzeDistribution(filteredResults)
    };
  }

  // Utility method for simple threshold filtering
  filterByMinSimilarity(results: SearchResult[], minSimilarity: number): SearchResult[] {
    return this.threshold(results, { minSimilarity });
  }

  // Utility method with adaptive threshold
  filterAdaptive(results: SearchResult[], minSimilarity: number): SearchResult[] {
    return this.threshold(results, { 
      minSimilarity, 
      adaptiveThreshold: true 
    });
  }

  // Utility method with contextual boost
  filterWithContextualBoost(results: SearchResult[], minSimilarity: number): SearchResult[] {
    return this.threshold(results, { 
      minSimilarity, 
      contextualBoost: true 
    });
  }

  // Utility method with both adaptive and contextual features
  filterSmart(results: SearchResult[], minSimilarity: number): SearchResult[] {
    return this.threshold(results, { 
      minSimilarity, 
      adaptiveThreshold: true,
      contextualBoost: true
    });
  }

  // Method to suggest optimal threshold based on result distribution
  suggestOptimalThreshold(results: SearchResult[]): number {
    if (results.length === 0) return 0.7;

    const similarities = results.map(r => r.similarity).sort((a, b) => b - a);
    const count = similarities.length;

    // Calculate percentiles
    const p90 = similarities[Math.floor(count * 0.1)] || 0;
    const p75 = similarities[Math.floor(count * 0.25)] || 0;
    const p50 = similarities[Math.floor(count * 0.5)] || 0;

    // Base suggestion on distribution
    if (p90 > 0.9 && p75 > 0.8) {
      return 0.8; // High-quality results, can be strict
    } else if (p75 > 0.7 && p50 > 0.6) {
      return 0.65; // Good quality, moderate threshold
    } else if (p50 > 0.5) {
      return 0.5; // Mixed quality, inclusive threshold
    } else {
      return 0.3; // Poor quality overall, very inclusive
    }
  }

  // Method to get threshold recommendations for different use cases
  getThresholdRecommendations(): Record<string, { threshold: number, description: string }> {
    return {
      'strict': {
        threshold: 0.85,
        description: 'High precision - only very relevant results'
      },
      'balanced': {
        threshold: 0.7,
        description: 'Good balance of precision and recall'
      },
      'inclusive': {
        threshold: 0.5,
        description: 'High recall - includes potentially relevant results'
      },
      'exploratory': {
        threshold: 0.3,
        description: 'Very inclusive - for broad exploration'
      }
    };
  }
}