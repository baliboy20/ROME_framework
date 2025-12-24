/**
 * /optimize-data-model skill (Tier 3)
 *
 * Analyzes data dictionary for optimization opportunities.
 *
 * Optimization checks:
 * 1. Normalization Violations - Denormalization and repeating groups
 * 2. Naming Inconsistencies - Inconsistent naming patterns
 * 3. Redundant Attributes - Duplicate or redundant attributes
 * 4. Missing Relationships - Implied but missing relationships
 * 5. Entity Granularity - Entities that should be split or merged
 * 6. Attribute Distribution - Unbalanced attribute distribution
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class OptimizeDataModel {
  static async execute(params, executionId) {
    const {
      data_dictionary_file,
      output_file = null,
      check_normalization = true,
      check_naming = true,
      suggest_consolidation = true
    } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🔧 OPTIMIZING DATA MODEL');
      console.log('='.repeat(70));
      console.log('');

      const issues = [];
      const recommendations = [];
      let checksRun = 0;

      // Load data dictionary
      console.log('Loading data dictionary...\n');
      const dataDict = JSON.parse(fs.readFileSync(data_dictionary_file, 'utf8'));

      // Check 1: Normalization Violations
      if (check_normalization) {
        console.log('✓ Check 1/6: Normalization Violations');
        checksRun++;
        this.checkNormalizationViolations(dataDict, issues, recommendations);
      }

      // Check 2: Naming Inconsistencies
      if (check_naming) {
        console.log('✓ Check 2/6: Naming Inconsistencies');
        checksRun++;
        this.checkNamingInconsistencies(dataDict, issues, recommendations);
      }

      // Check 3: Redundant Attributes
      console.log('✓ Check 3/6: Redundant Attributes');
      checksRun++;
      this.checkRedundantAttributes(dataDict, issues, recommendations);

      // Check 4: Missing Relationships
      console.log('✓ Check 4/6: Missing Relationships');
      checksRun++;
      this.checkMissingRelationships(dataDict, issues, recommendations);

      // Check 5: Entity Granularity
      if (suggest_consolidation) {
        console.log('✓ Check 5/6: Entity Granularity');
        checksRun++;
        this.checkEntityGranularity(dataDict, issues, recommendations);
      }

      // Check 6: Attribute Distribution
      console.log('✓ Check 6/6: Attribute Distribution');
      checksRun++;
      this.checkAttributeDistribution(dataDict, issues, recommendations);

      // Calculate metrics
      const metrics = this.calculateMetrics(dataDict, issues, recommendations);

      // Determine optimization status
      const critical = issues.filter(i => i.severity === 'CRITICAL');
      const warnings = issues.filter(i => i.severity === 'WARNING');
      const info = issues.filter(i => i.severity === 'INFO');

      let optimizationStatus;
      if (critical.length > 0) {
        optimizationStatus = 'CRITICAL';
      } else if (warnings.length > 5) {
        optimizationStatus = 'NEEDS_WORK';
      } else {
        optimizationStatus = 'OPTIMIZED';
      }

      // Generate report
      const report = {
        optimization_status: optimizationStatus,
        checks_run: checksRun,
        issues_found: issues,
        recommendations,
        metrics,
        summary: {
          total_issues: issues.length,
          critical: critical.length,
          warnings: warnings.length,
          info: info.length,
          total_recommendations: recommendations.length
        },
        timestamp: new Date().toISOString()
      };

      // Write report if requested
      if (output_file) {
        fs.writeFileSync(output_file, JSON.stringify(report, null, 2));
      }

      console.log('');
      console.log('='.repeat(70));
      console.log(`Optimization Status: ${optimizationStatus}`);
      console.log('='.repeat(70));
      console.log(`Checks Run: ${checksRun}`);
      console.log(`Critical: ${critical.length}`);
      console.log(`Warnings: ${warnings.length}`);
      console.log(`Info: ${info.length}`);
      console.log(`Recommendations: ${recommendations.length}`);
      console.log('');

      if (issues.length > 0) {
        console.log('Issues:');
        issues.forEach(issue => {
          console.log(`  [${issue.severity}] ${issue.check}: ${issue.message}`);
        });
        console.log('');
      }

      return {
        optimization_status: optimizationStatus,
        checks_run: checksRun,
        issues_found: issues,
        recommendations,
        metrics
      };

    } catch (error) {
      throw new Error(`Data model optimization failed: ${error.message}`);
    }
  }

  /**
   * Check 1: Normalization Violations
   */
  static checkNormalizationViolations(dataDict, issues, recommendations) {
    const entities = dataDict.entities || [];

    entities.forEach(entity => {
      const attributes = entity.attributes || [];

      // Check for repeating groups (arrays in attributes)
      attributes.forEach(attr => {
        const attrName = typeof attr === 'string' ? attr : attr.name;
        const attrType = typeof attr === 'string' ? null : attr.type;

        if (attrType && (attrType.includes('array') || attrType.includes('[]'))) {
          issues.push({
            severity: 'WARNING',
            check: 'normalization_violations',
            entity: entity.name,
            message: `Attribute "${attrName}" is an array type - consider normalizing to separate entity`
          });
        }
      });

      // Check for too many attributes (possible denormalization)
      if (attributes.length > 15) {
        issues.push({
          severity: 'WARNING',
          check: 'normalization_violations',
          entity: entity.name,
          message: `Entity has ${attributes.length} attributes - consider splitting into multiple entities`
        });
        recommendations.push({
          check: 'normalization_violations',
          entity: entity.name,
          message: `Consider splitting "${entity.name}" into smaller, focused entities`
        });
      }
    });
  }

  /**
   * Check 2: Naming Inconsistencies
   */
  static checkNamingInconsistencies(dataDict, issues, recommendations) {
    const entities = dataDict.entities || [];

    // Check entity naming patterns
    const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;
    const snake_casePattern = /^[a-z][a-z0-9_]*$/;
    const kebabCasePattern = /^[a-z][a-z0-9-]*$/;

    const entityNameStyles = new Map();

    entities.forEach(entity => {
      let style = 'unknown';
      if (pascalCasePattern.test(entity.name)) style = 'PascalCase';
      else if (camelCasePattern.test(entity.name)) style = 'camelCase';
      else if (snake_casePattern.test(entity.name)) style = 'snake_case';
      else if (kebabCasePattern.test(entity.name)) style = 'kebab-case';

      entityNameStyles.set(entity.name, style);
    });

    // Check for mixed naming styles
    const styles = new Set(entityNameStyles.values());
    if (styles.size > 1) {
      issues.push({
        severity: 'WARNING',
        check: 'naming_inconsistencies',
        message: `Mixed entity naming styles detected: ${Array.from(styles).join(', ')}`
      });
      recommendations.push({
        check: 'naming_inconsistencies',
        message: 'Standardize entity naming to PascalCase for consistency'
      });
    }

    // Check attribute naming within each entity
    entities.forEach(entity => {
      const attributes = entity.attributes || [];
      const attrStyles = new Set();

      attributes.forEach(attr => {
        const attrName = typeof attr === 'string' ? attr : attr.name;
        let style = 'unknown';
        if (pascalCasePattern.test(attrName)) style = 'PascalCase';
        else if (camelCasePattern.test(attrName)) style = 'camelCase';
        else if (snake_casePattern.test(attrName)) style = 'snake_case';
        else if (kebabCasePattern.test(attrName)) style = 'kebab-case';

        attrStyles.add(style);
      });

      if (attrStyles.size > 1) {
        issues.push({
          severity: 'WARNING',
          check: 'naming_inconsistencies',
          entity: entity.name,
          message: `Mixed attribute naming styles in "${entity.name}": ${Array.from(attrStyles).join(', ')}`
        });
      }
    });
  }

  /**
   * Check 3: Redundant Attributes
   */
  static checkRedundantAttributes(dataDict, issues, recommendations) {
    const entities = dataDict.entities || [];

    // Build attribute frequency map across all entities
    const attributeFrequency = new Map();

    entities.forEach(entity => {
      const attributes = entity.attributes || [];
      attributes.forEach(attr => {
        const attrName = typeof attr === 'string' ? attr : attr.name;
        if (!attributeFrequency.has(attrName)) {
          attributeFrequency.set(attrName, []);
        }
        attributeFrequency.get(attrName).push(entity.name);
      });
    });

    // Check for common attributes that might belong in a base entity
    attributeFrequency.forEach((entityList, attrName) => {
      if (entityList.length >= 3 && !['id', 'createdAt', 'updatedAt', 'name'].includes(attrName)) {
        recommendations.push({
          check: 'redundant_attributes',
          message: `Attribute "${attrName}" appears in ${entityList.length} entities: ${entityList.join(', ')} - consider inheritance or composition`
        });
      }
    });

    // Check for similar attribute names within entities (likely typos or redundancy)
    entities.forEach(entity => {
      const attributes = entity.attributes || [];
      for (let i = 0; i < attributes.length; i++) {
        for (let j = i + 1; j < attributes.length; j++) {
          const name1 = (typeof attributes[i] === 'string' ? attributes[i] : attributes[i].name).toLowerCase();
          const name2 = (typeof attributes[j] === 'string' ? attributes[j] : attributes[j].name).toLowerCase();

          // Check for very similar names (Levenshtein distance approximation)
          if (this.isSimilar(name1, name2)) {
            issues.push({
              severity: 'WARNING',
              check: 'redundant_attributes',
              entity: entity.name,
              message: `Similar attribute names "${name1}" and "${name2}" in "${entity.name}" - possible redundancy`
            });
          }
        }
      }
    });
  }

  /**
   * Check 4: Missing Relationships
   */
  static checkMissingRelationships(dataDict, issues, recommendations) {
    const entities = dataDict.entities || [];
    const relationships = dataDict.relationships || [];

    // Build map of entity names
    const entityNames = new Set(entities.map(e => e.name.toLowerCase()));

    // Check for attributes that reference other entities but lack relationships
    entities.forEach(entity => {
      const attributes = entity.attributes || [];

      attributes.forEach(attr => {
        const attrName = typeof attr === 'string' ? attr : attr.name;

        // Check for foreign key naming patterns
        if (attrName.endsWith('Id') || attrName.endsWith('_id')) {
          const referencedEntityName = attrName.replace(/(Id|_id)$/, '').toLowerCase();

          if (entityNames.has(referencedEntityName)) {
            // Check if relationship exists
            const hasRelationship = relationships.some(rel => {
              const from = (rel.from_entity || rel.from || '').toLowerCase();
              const to = (rel.to_entity || rel.to || '').toLowerCase();
              return (from === entity.name.toLowerCase() && to === referencedEntityName) ||
                     (to === entity.name.toLowerCase() && from === referencedEntityName);
            });

            if (!hasRelationship) {
              recommendations.push({
                check: 'missing_relationships',
                entity: entity.name,
                message: `Attribute "${attrName}" in "${entity.name}" suggests relationship to "${referencedEntityName}" - consider adding explicit relationship`
              });
            }
          }
        }
      });
    });
  }

  /**
   * Check 5: Entity Granularity
   */
  static checkEntityGranularity(dataDict, issues, recommendations) {
    const entities = dataDict.entities || [];

    // Check for entities with too few attributes (might need consolidation)
    entities.forEach(entity => {
      const attributes = entity.attributes || [];
      const nonStandardAttrs = attributes.filter(a => {
        const attrName = typeof a === 'string' ? a : a.name;
        return !['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(attrName);
      });

      if (nonStandardAttrs.length < 3 && entity.type === 'primary') {
        issues.push({
          severity: 'INFO',
          check: 'entity_granularity',
          entity: entity.name,
          message: `Entity "${entity.name}" has only ${nonStandardAttrs.length} business attributes - consider if it should be merged with related entity`
        });
      }
    });

    // Check for entities with very similar attribute sets (candidates for merging)
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const attrs1 = new Set((entities[i].attributes || []).map(a => typeof a === 'string' ? a : a.name));
        const attrs2 = new Set((entities[j].attributes || []).map(a => typeof a === 'string' ? a : a.name));

        const intersection = new Set([...attrs1].filter(x => attrs2.has(x)));
        const union = new Set([...attrs1, ...attrs2]);

        const similarity = union.size > 0 ? intersection.size / union.size : 0;

        if (similarity > 0.6) {
          recommendations.push({
            check: 'entity_granularity',
            message: `Entities "${entities[i].name}" and "${entities[j].name}" have ${Math.round(similarity * 100)}% similar attributes - consider merging or using inheritance`
          });
        }
      }
    }
  }

  /**
   * Check 6: Attribute Distribution
   */
  static checkAttributeDistribution(dataDict, issues, recommendations) {
    const entities = dataDict.entities || [];
    const primaryEntities = entities.filter(e => e.type === 'primary');

    if (primaryEntities.length === 0) return;

    const attributeCounts = primaryEntities.map(e => (e.attributes || []).length);
    const avgAttributes = attributeCounts.reduce((a, b) => a + b, 0) / attributeCounts.length;
    const maxAttributes = Math.max(...attributeCounts);
    const minAttributes = Math.min(...attributeCounts);

    // Check for high variance
    const variance = attributeCounts.reduce((sum, count) => sum + Math.pow(count - avgAttributes, 2), 0) / attributeCounts.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > avgAttributes * 0.5) {
      issues.push({
        severity: 'INFO',
        check: 'attribute_distribution',
        message: `High variance in attribute distribution (avg: ${avgAttributes.toFixed(1)}, min: ${minAttributes}, max: ${maxAttributes}) - consider rebalancing`
      });
    }
  }

  /**
   * Calculate optimization metrics
   */
  static calculateMetrics(dataDict, issues, recommendations) {
    const entities = dataDict.entities || [];
    const relationships = dataDict.relationships || [];
    const primaryEntities = entities.filter(e => e.type === 'primary');

    const totalAttributes = entities.reduce((sum, e) => sum + (e.attributes || []).length, 0);
    const avgAttributesPerEntity = entities.length > 0 ? totalAttributes / entities.length : 0;

    return {
      total_entities: entities.length,
      primary_entities: primaryEntities.length,
      secondary_entities: entities.filter(e => e.type === 'secondary').length,
      total_relationships: relationships.length,
      total_attributes: totalAttributes,
      avg_attributes_per_entity: parseFloat(avgAttributesPerEntity.toFixed(2)),
      relationship_to_entity_ratio: entities.length > 0 ? parseFloat((relationships.length / entities.length).toFixed(2)) : 0,
      optimization_score: this.calculateOptimizationScore(issues, recommendations)
    };
  }

  /**
   * Calculate optimization score (0-100)
   */
  static calculateOptimizationScore(issues, recommendations) {
    let score = 100;

    issues.forEach(issue => {
      if (issue.severity === 'CRITICAL') score -= 10;
      else if (issue.severity === 'WARNING') score -= 5;
      else if (issue.severity === 'INFO') score -= 2;
    });

    recommendations.forEach(() => {
      score -= 1;
    });

    return Math.max(0, score);
  }

  /**
   * Check if two strings are similar (simple similarity check)
   */
  static isSimilar(str1, str2) {
    if (str1 === str2) return false; // Exact match doesn't count as "similar"

    // Check for common prefixes/suffixes
    if (str1.startsWith(str2) || str2.startsWith(str1)) return true;
    if (str1.endsWith(str2) || str2.endsWith(str1)) return true;

    // Check for length similarity and character overlap
    if (Math.abs(str1.length - str2.length) <= 2) {
      let matches = 0;
      const minLen = Math.min(str1.length, str2.length);
      for (let i = 0; i < minLen; i++) {
        if (str1[i] === str2[i]) matches++;
      }
      if (matches / minLen > 0.8) return true;
    }

    return false;
  }
}

module.exports = OptimizeDataModel;
