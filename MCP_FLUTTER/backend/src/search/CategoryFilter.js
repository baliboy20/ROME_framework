/**
 * CategoryFilter - Category filtering implementation
 * Backend Engineer: Reena
 */

class CategoryFilter {
  filter(results, categories) {
    if (!categories || categories.length === 0) {
      return results;
    }

    return results.filter(result => {
      const resultCategories = result.metadata?.categories || [];
      return categories.some(category => 
        resultCategories.includes(category)
      );
    });
  }

  filterByPrimaryCategory(results, category) {
    return results.filter(result => {
      const primaryCategory = result.metadata?.categories?.[0];
      return primaryCategory === category;
    });
  }

  filterByAllCategories(results, categories) {
    if (!categories || categories.length === 0) {
      return results;
    }

    return results.filter(result => {
      const resultCategories = result.metadata?.categories || [];
      return categories.every(category => 
        resultCategories.includes(category)
      );
    });
  }

  getCategoryDistribution(results) {
    const distribution = {};
    
    results.forEach(result => {
      const categories = result.metadata?.categories || [];
      categories.forEach(category => {
        distribution[category] = (distribution[category] || 0) + 1;
      });
    });

    return Object.entries(distribution)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  filterMultiple(results, categoryGroups) {
    // Filter results that match at least one category from each group
    if (!categoryGroups || categoryGroups.length === 0) {
      return results;
    }
    
    return results.filter(result => {
      const resultCategories = result.metadata?.categories || [];
      
      // Must have at least one category from each group
      return categoryGroups.every(group => {
        return group.some(category => resultCategories.includes(category));
      });
    });
  }

  applyCategoryBoost(results, boostMap) {
    return results.map(result => {
      const categories = result.metadata?.categories || [];
      let boost = 1.0;

      categories.forEach(category => {
        if (boostMap[category]) {
          boost *= boostMap[category];
        }
      });

      return {
        ...result,
        score: (result.score || 1.0) * boost,
        categoryBoost: boost
      };
    });
  }
}

module.exports = { CategoryFilter };