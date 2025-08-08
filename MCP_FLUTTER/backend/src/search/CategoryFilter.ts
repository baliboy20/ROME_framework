/**
 * CategoryFilter Implementation
 * Filters search results by categories with exact and partial matching
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

interface FilterOptions {
  matchType?: 'exact' | 'partial' | 'any';
  caseSensitive?: boolean;
  includeSubcategories?: boolean;
}

interface CategoryHierarchy {
  [category: string]: string[];
}

export class CategoryFilter {
  private readonly categoryHierarchy: CategoryHierarchy = {
    'architecture': ['state-management', 'patterns', 'design-patterns', 'mvvm', 'mvc', 'bloc'],
    'ui': ['widgets', 'components', 'layouts', 'animations', 'themes', 'styling'],
    'data': ['database', 'api', 'storage', 'caching', 'persistence'],
    'services': ['authentication', 'networking', 'notifications', 'background-tasks'],
    'testing': ['unit-testing', 'widget-testing', 'integration-testing', 'mocking'],
    'performance': ['optimization', 'memory', 'rendering', 'lazy-loading'],
    'security': ['encryption', 'certificates', 'permissions', 'biometrics'],
    'development': ['debugging', 'tooling', 'ci-cd', 'build-configuration']
  };

  private readonly categoryAliases: Record<string, string> = {
    'auth': 'authentication',
    'db': 'database',
    'net': 'networking',
    'perf': 'performance',
    'sec': 'security',
    'test': 'testing',
    'dev': 'development',
    'ui-component': 'ui',
    'component': 'ui',
    'widget': 'ui',
    'state': 'state-management',
    'pattern': 'patterns',
    'api-service': 'api',
    'rest': 'api',
    'http': 'networking'
  };

  private normalizeCategory(category: string, caseSensitive: boolean = false): string {
    const normalized = caseSensitive ? category : category.toLowerCase();
    return this.categoryAliases[normalized] || normalized;
  }

  private getAllSubcategories(category: string): string[] {
    const normalized = this.normalizeCategory(category);
    const subcategories = this.categoryHierarchy[normalized] || [];
    return [normalized, ...subcategories];
  }

  private exactMatch(resultCategories: string[], filterCategories: string[], options: FilterOptions): boolean {
    const normalizedResultCategories = resultCategories.map(cat => 
      this.normalizeCategory(cat, options.caseSensitive)
    );
    const normalizedFilterCategories = filterCategories.map(cat => 
      this.normalizeCategory(cat, options.caseSensitive)
    );

    // All filter categories must be present in result categories
    return normalizedFilterCategories.every(filterCat => {
      if (options.includeSubcategories) {
        const allSubcategories = this.getAllSubcategories(filterCat);
        return allSubcategories.some(subCat => 
          normalizedResultCategories.includes(subCat)
        );
      } else {
        return normalizedResultCategories.includes(filterCat);
      }
    });
  }

  private partialMatch(resultCategories: string[], filterCategories: string[], options: FilterOptions): boolean {
    const normalizedResultCategories = resultCategories.map(cat => 
      this.normalizeCategory(cat, options.caseSensitive)
    );

    // Check if any filter category partially matches any result category
    for (const filterCat of filterCategories) {
      const normalizedFilterCat = this.normalizeCategory(filterCat, options.caseSensitive);
      
      const hasPartialMatch = normalizedResultCategories.some(resultCat => {
        if (options.includeSubcategories) {
          const allSubcategories = this.getAllSubcategories(normalizedFilterCat);
          return allSubcategories.some(subCat => 
            resultCat.includes(subCat) || subCat.includes(resultCat)
          );
        } else {
          return resultCat.includes(normalizedFilterCat) || normalizedFilterCat.includes(resultCat);
        }
      });

      if (hasPartialMatch) return true;
    }

    return false;
  }

  private anyMatch(resultCategories: string[], filterCategories: string[], options: FilterOptions): boolean {
    const normalizedResultCategories = resultCategories.map(cat => 
      this.normalizeCategory(cat, options.caseSensitive)
    );
    const normalizedFilterCategories = filterCategories.map(cat => 
      this.normalizeCategory(cat, options.caseSensitive)
    );

    // At least one filter category must match one result category
    return normalizedFilterCategories.some(filterCat => {
      if (options.includeSubcategories) {
        const allSubcategories = this.getAllSubcategories(filterCat);
        return allSubcategories.some(subCat => 
          normalizedResultCategories.includes(subCat)
        );
      } else {
        return normalizedResultCategories.includes(filterCat);
      }
    });
  }

  private matchesFilter(result: SearchResult, categories: string[], options: FilterOptions): boolean {
    if (!categories || categories.length === 0) {
      return true; // No filter applied
    }

    if (!result.metadata.categories || result.metadata.categories.length === 0) {
      return false; // Result has no categories to match
    }

    const matchType = options.matchType || 'any';

    switch (matchType) {
      case 'exact':
        return this.exactMatch(result.metadata.categories, categories, options);
      case 'partial':
        return this.partialMatch(result.metadata.categories, categories, options);
      case 'any':
      default:
        return this.anyMatch(result.metadata.categories, categories, options);
    }
  }

  filter(results: SearchResult[], categories: string[], options: FilterOptions = {}): SearchResult[] {
    if (!results || results.length === 0) {
      return [];
    }

    if (!categories || categories.length === 0) {
      return results; // No filtering needed
    }

    // Filter and validate categories
    const validCategories = categories
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    if (validCategories.length === 0) {
      return results;
    }

    // Apply the filter
    const filteredResults = results.filter(result => 
      this.matchesFilter(result, validCategories, options)
    );

    return filteredResults;
  }

  // Utility method for exact category matching
  filterExact(results: SearchResult[], categories: string[]): SearchResult[] {
    return this.filter(results, categories, { matchType: 'exact' });
  }

  // Utility method for partial category matching
  filterPartial(results: SearchResult[], categories: string[]): SearchResult[] {
    return this.filter(results, categories, { matchType: 'partial' });
  }

  // Utility method for any category matching with subcategories
  filterWithSubcategories(results: SearchResult[], categories: string[]): SearchResult[] {
    return this.filter(results, categories, { 
      matchType: 'any', 
      includeSubcategories: true 
    });
  }

  // Method to get all valid categories (for validation/suggestion purposes)
  getAllCategories(): string[] {
    const mainCategories = Object.keys(this.categoryHierarchy);
    const subcategories = Object.values(this.categoryHierarchy).flat();
    const aliases = Object.keys(this.categoryAliases);
    
    return [...new Set([...mainCategories, ...subcategories, ...aliases])].sort();
  }

  // Method to suggest categories based on partial input
  suggestCategories(partialCategory: string, limit: number = 10): string[] {
    const normalized = partialCategory.toLowerCase();
    const allCategories = this.getAllCategories();
    
    const suggestions = allCategories
      .filter(category => category.toLowerCase().includes(normalized))
      .sort((a, b) => {
        // Prioritize exact start matches
        const aStarts = a.toLowerCase().startsWith(normalized);
        const bStarts = b.toLowerCase().startsWith(normalized);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Then by length (shorter first)
        return a.length - b.length;
      })
      .slice(0, limit);

    return suggestions;
  }

  // Method to get category hierarchy for a given category
  getCategoryHierarchy(category: string): string[] {
    const normalized = this.normalizeCategory(category);
    return this.getAllSubcategories(normalized);
  }

  // Method to validate if categories are valid
  validateCategories(categories: string[]): { valid: string[], invalid: string[] } {
    const allValidCategories = this.getAllCategories();
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const category of categories) {
      const normalized = this.normalizeCategory(category);
      if (allValidCategories.includes(normalized)) {
        valid.push(category);
      } else {
        invalid.push(category);
      }
    }

    return { valid, invalid };
  }

  // Method to get statistics about category usage in results
  getCategoryStats(results: SearchResult[]): Record<string, number> {
    const categoryCount: Record<string, number> = {};

    for (const result of results) {
      if (result.metadata.categories) {
        for (const category of result.metadata.categories) {
          const normalized = this.normalizeCategory(category);
          categoryCount[normalized] = (categoryCount[normalized] || 0) + 1;
        }
      }
    }

    // Sort by count (descending)
    return Object.fromEntries(
      Object.entries(categoryCount).sort(([,a], [,b]) => b - a)
    );
  }
}