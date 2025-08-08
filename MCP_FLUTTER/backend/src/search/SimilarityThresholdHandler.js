/**
 * SimilarityThresholdHandler - Similarity threshold management
 * Backend Engineer: Reena
 */

class SimilarityThresholdHandler {
  constructor(defaultThreshold = 0.7) {
    this.defaultThreshold = defaultThreshold;
    this.adaptiveThresholds = new Map();
  }

  threshold(results, params = null) {
    // Handle both direct minSimilarity value and params object
    let threshold = this.defaultThreshold;
    let adaptiveThreshold = false;
    let contextualBoost = false;
    
    if (params !== null) {
      if (typeof params === 'number') {
        // Direct similarity value
        threshold = params;
      } else if (typeof params === 'object') {
        // ThresholdParams object
        threshold = params.minSimilarity !== undefined ? params.minSimilarity : this.defaultThreshold;
        adaptiveThreshold = params.adaptiveThreshold || false;
        contextualBoost = params.contextualBoost || false;
      }
    }
    
    let filteredResults = results.filter(result => {
      const similarity = result.similarity || result.score || 0;
      return similarity >= threshold;
    });
    
    // Apply adaptive thresholding if requested
    if (adaptiveThreshold && filteredResults.length > 0) {
      filteredResults = this.adaptiveThreshold(filteredResults, { resultCount: Math.min(5, filteredResults.length) });
    }
    
    // Apply contextual boosts if requested
    if (contextualBoost) {
      filteredResults = this.applyContextualBoost(filteredResults, { 
        preferredCategories: ['architecture', 'patterns'],
        usePopularity: true 
      });
    }
    
    return filteredResults;
  }

  adaptiveThreshold(results, context = {}) {
    // Adjust threshold based on context
    let threshold = this.defaultThreshold;
    
    if (context.category) {
      // Use category-specific threshold if available
      threshold = this.adaptiveThresholds.get(context.category) || threshold;
    }

    if (context.resultCount && results.length > 0) {
      // Adjust threshold to get desired result count
      const scores = results
        .map(r => r.similarity || r.score || 0)
        .sort((a, b) => b - a);
      
      if (scores.length > context.resultCount) {
        threshold = scores[context.resultCount - 1];
      }
    }

    return this.threshold(results, threshold);
  }

  applyContextualBoost(results, context = {}) {
    return results.map(result => {
      let boost = 1.0;
      
      // Apply recency boost
      if (context.preferRecent && result.metadata?.timestamp) {
        const age = Date.now() - new Date(result.metadata.timestamp).getTime();
        const daysSinceUpdate = age / (1000 * 60 * 60 * 24);
        boost *= Math.max(0.5, 1 - (daysSinceUpdate / 365));
      }

      // Apply category boost
      if (context.preferredCategories && result.metadata?.categories) {
        const hasPreferred = result.metadata.categories.some(cat =>
          context.preferredCategories.includes(cat)
        );
        if (hasPreferred) {
          boost *= 1.2;
        }
      }

      // Apply popularity boost
      if (context.usePopularity && result.metadata?.views) {
        const popularityBoost = Math.min(1.5, 1 + Math.log10(result.metadata.views + 1) / 10);
        boost *= popularityBoost;
      }

      return {
        ...result,
        originalScore: result.score || result.similarity,
        score: (result.score || result.similarity || 0) * boost,
        appliedBoost: boost
      };
    });
  }

  setAdaptiveThreshold(category, threshold) {
    this.adaptiveThresholds.set(category, threshold);
  }

  getThresholdStats(results) {
    const scores = results.map(r => r.similarity || r.score || 0);
    
    if (scores.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0 };
    }

    scores.sort((a, b) => a - b);
    
    return {
      min: scores[0],
      max: scores[scores.length - 1],
      mean: scores.reduce((a, b) => a + b, 0) / scores.length,
      median: scores[Math.floor(scores.length / 2)],
      distribution: this.getDistribution(scores)
    };
  }

  getDistribution(scores) {
    const buckets = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const distribution = {};
    
    for (let i = 0; i < buckets.length - 1; i++) {
      const min = buckets[i];
      const max = buckets[i + 1];
      const key = `${min}-${max}`;
      distribution[key] = scores.filter(s => s >= min && s < max).length;
    }
    
    return distribution;
  }

  recommendThreshold(results, targetCount) {
    const scores = results
      .map(r => r.similarity || r.score || 0)
      .sort((a, b) => b - a);
    
    if (scores.length === 0 || targetCount <= 0) {
      return this.defaultThreshold;
    }

    if (targetCount >= scores.length) {
      return scores[scores.length - 1] * 0.9; // Slightly below minimum
    }

    return scores[targetCount - 1];
  }
}

module.exports = { SimilarityThresholdHandler };