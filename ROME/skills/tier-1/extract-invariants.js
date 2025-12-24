/**
 * /extract-invariants skill
 *
 * Extracts and classifies business rules (invariants) from AORDL requirements.
 *
 * Classification types:
 * - validation: Data format, type, required fields
 * - constraint: Business limits, ranges, maximums
 * - uniqueness: Duplicate prevention, uniqueness constraints
 * - relationship: Entity association rules
 * - state: Status and state transition rules
 * - temporal: Time-based and ordering rules
 * - authorization: Access control and permissions
 * - business_policy: General business policies
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load classification patterns from manifest
const manifestPath = path.join(__dirname, '../registry/extract-invariants.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const RULE_TYPES = manifest.rule_types;

class ExtractInvariants {
  static async execute(params, executionId) {
    const {
      requirement_file,
      classify_rules = true,
      output_format = 'json',
      output_file = null
    } = params;

    try {
      // Load requirement file
      const requirementContent = fs.readFileSync(requirement_file, 'utf8');
      const requirement = yaml.load(requirementContent);

      // Extract invariants
      const invariants = this.extractInvariantsFromRequirement(
        requirement,
        classify_rules
      );

      // Generate statistics
      const statistics = this.generateStatistics(invariants);

      // Build result
      const result = {
        requirement_id: requirement.ID || 'UNKNOWN',
        requirement_file,
        invariants,
        statistics,
        execution_id: executionId,
        timestamp: new Date().toISOString()
      };

      // Write output file if requested
      if (output_file) {
        const outputContent = output_format === 'yaml'
          ? yaml.dump(result)
          : JSON.stringify(result, null, 2);
        fs.writeFileSync(output_file, outputContent);
      }

      return {
        invariants,
        statistics,
        requirement_id: requirement.ID,
        output_file
      };

    } catch (error) {
      throw new Error(`Invariant extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract and classify invariants from requirement
   */
  static extractInvariantsFromRequirement(requirement, classify) {
    if (!requirement.Invariants || !Array.isArray(requirement.Invariants)) {
      return [];
    }

    return requirement.Invariants.map((invariantText, index) => {
      const invariant = {
        id: `INV-${String(index + 1).padStart(3, '0')}`,
        text: invariantText,
        classifications: [],
        entities: [],
        attributes: [],
        semantic: {}
      };

      if (classify) {
        // Classify invariant type
        invariant.classifications = this.classifyInvariant(invariantText);

        // Extract entities mentioned
        invariant.entities = this.extractEntitiesFromInvariant(invariantText);

        // Extract attributes mentioned
        invariant.attributes = this.extractAttributesFromInvariant(invariantText);

        // Parse semantic structure
        invariant.semantic = this.parseInvariantSemantics(invariantText);
      }

      return invariant;
    });
  }

  /**
   * Classify invariant by matching rule type keywords
   */
  static classifyInvariant(invariantText) {
    const classifications = [];
    const textLower = invariantText.toLowerCase();

    for (const [ruleType, config] of Object.entries(RULE_TYPES)) {
      const keywords = config.keywords || [];

      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          classifications.push({
            type: ruleType,
            confidence: this.calculateConfidence(textLower, keyword),
            matched_keyword: keyword
          });
          break; // Only match once per rule type
        }
      }
    }

    // Sort by confidence
    classifications.sort((a, b) => b.confidence - a.confidence);

    return classifications;
  }

  /**
   * Calculate confidence score for classification
   * Higher score = more certain classification
   */
  static calculateConfidence(text, keyword) {
    // Base confidence
    let confidence = 0.5;

    // Exact keyword match at start = higher confidence
    if (text.startsWith(keyword.toLowerCase())) {
      confidence += 0.3;
    }

    // Multiple occurrences = higher confidence
    const occurrences = (text.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    confidence += Math.min(0.2, occurrences * 0.1);

    return Math.min(1.0, confidence);
  }

  /**
   * Extract entities mentioned in invariant
   */
  static extractEntitiesFromInvariant(invariantText) {
    const entities = new Set();

    // Pattern 1: Capitalized words (entity names)
    const capitalizedPattern = /\b([A-Z][a-z]+(?:[A-Z][a-z]+)*)\b/g;
    const capitalizedMatches = invariantText.matchAll(capitalizedPattern);

    for (const match of capitalizedMatches) {
      entities.add(match[1]);
    }

    // Pattern 2: Hyphenated compound entities
    const hyphenatedPattern = /\b([a-z]+-[a-z]+(?:-[a-z]+)*)\b/gi;
    const hyphenatedMatches = invariantText.matchAll(hyphenatedPattern);

    for (const match of hyphenatedMatches) {
      // Normalize to PascalCase
      const parts = match[1].split('-');
      const pascalCase = parts
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join('');
      entities.add(pascalCase);
    }

    // Pattern 3: Common business entities
    const knownEntities = [
      'project', 'task', 'user', 'team', 'member', 'comment', 'attachment',
      'webhook', 'token', 'notification', 'permission', 'role', 'organization',
      'status', 'priority', 'assignee', 'owner', 'creator'
    ];

    const textLower = invariantText.toLowerCase();
    for (const entity of knownEntities) {
      const pattern = new RegExp(`\\b${entity}\\b`, 'i');
      if (pattern.test(textLower)) {
        entities.add(entity.charAt(0).toUpperCase() + entity.slice(1));
      }
    }

    return Array.from(entities);
  }

  /**
   * Extract attributes mentioned in invariant
   */
  static extractAttributesFromInvariant(invariantText) {
    const attributes = new Set();

    // Common attribute keywords
    const attributeKeywords = [
      'name', 'title', 'description', 'status', 'type', 'state',
      'date', 'time', 'timestamp', 'email', 'phone', 'address',
      'owner', 'creator', 'assignee', 'priority', 'id', 'key',
      'value', 'count', 'amount', 'total', 'price', 'cost'
    ];

    const textLower = invariantText.toLowerCase();

    for (const attr of attributeKeywords) {
      const pattern = new RegExp(`\\b${attr}\\b`, 'i');
      if (pattern.test(textLower)) {
        attributes.add(attr);
      }
    }

    // Pattern: "entity attribute" (e.g., "task status", "project name")
    const entityAttrPattern = /\b[a-z]+\s+(name|title|status|type|date|time|id|owner)\b/gi;
    const matches = invariantText.matchAll(entityAttrPattern);

    for (const match of matches) {
      const attr = match[1].toLowerCase();
      attributes.add(attr);
    }

    return Array.from(attributes);
  }

  /**
   * Parse semantic structure of invariant
   * Identifies: modality (must/cannot), subject, predicate, object
   */
  static parseInvariantSemantics(invariantText) {
    const semantic = {
      modality: null,      // must, cannot, should, may
      subject: null,       // what entity/attribute
      predicate: null,     // action/state
      constraint: null,    // the rule itself
      negation: false      // is this a prohibition?
    };

    const textLower = invariantText.toLowerCase();

    // Detect modality
    if (textLower.includes('must') || textLower.includes('required')) {
      semantic.modality = 'must';
      semantic.negation = false;
    } else if (textLower.includes('cannot') || textLower.includes('must not')) {
      semantic.modality = 'must';
      semantic.negation = true;
    } else if (textLower.includes('should')) {
      semantic.modality = 'should';
    } else if (textLower.includes('may') || textLower.includes('can')) {
      semantic.modality = 'may';
    }

    // Extract subject (first noun phrase)
    const subjectPattern = /^([A-Z][a-z]+(?:\s+[a-z]+)?)\s+/;
    const subjectMatch = invariantText.match(subjectPattern);
    if (subjectMatch) {
      semantic.subject = subjectMatch[1];
    }

    // Extract predicate (main verb/action)
    const predicatePatterns = [
      /\s+(must|cannot|should)\s+([a-z]+)/i,
      /\s+(is|are|has|have)\s+/i,
      /\s+(exists|belongs|contains|includes)\s+/i
    ];

    for (const pattern of predicatePatterns) {
      const match = invariantText.match(pattern);
      if (match) {
        semantic.predicate = match[2] || match[1];
        break;
      }
    }

    // Store full constraint text
    semantic.constraint = invariantText;

    return semantic;
  }

  /**
   * Generate statistics about extracted invariants
   */
  static generateStatistics(invariants) {
    const stats = {
      total_count: invariants.length,
      by_type: {},
      entities_mentioned: new Set(),
      attributes_mentioned: new Set(),
      avg_classifications_per_rule: 0
    };

    let totalClassifications = 0;

    for (const inv of invariants) {
      // Count by type (use primary classification)
      if (inv.classifications.length > 0) {
        const primaryType = inv.classifications[0].type;
        stats.by_type[primaryType] = (stats.by_type[primaryType] || 0) + 1;
        totalClassifications += inv.classifications.length;
      } else {
        stats.by_type['unclassified'] = (stats.by_type['unclassified'] || 0) + 1;
      }

      // Collect entities
      for (const entity of inv.entities) {
        stats.entities_mentioned.add(entity);
      }

      // Collect attributes
      for (const attr of inv.attributes) {
        stats.attributes_mentioned.add(attr);
      }
    }

    // Calculate averages
    stats.avg_classifications_per_rule = invariants.length > 0
      ? (totalClassifications / invariants.length).toFixed(2)
      : 0;

    // Convert Sets to Arrays
    stats.entities_mentioned = Array.from(stats.entities_mentioned);
    stats.attributes_mentioned = Array.from(stats.attributes_mentioned);

    return stats;
  }
}

module.exports = ExtractInvariants;
