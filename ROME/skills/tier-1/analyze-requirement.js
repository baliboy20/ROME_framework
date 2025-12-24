/**
 * /analyze-requirement skill
 *
 * Provides comprehensive analysis of a single AORDL requirement by:
 * - Validating against AORDL standards
 * - Extracting entities and attributes
 * - Extracting and classifying invariants
 * - Deriving API endpoint design
 * - Calculating complexity metrics
 * - Generating improvement recommendations
 *
 * This is a meta-skill that orchestrates other skills.
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load configuration from manifest
const manifestPath = path.join(__dirname, '../registry/analyze-requirement.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const VERB_TO_HTTP = manifest.verb_to_http_method;
const API_PATH_PATTERNS = manifest.api_path_patterns;
const COMPLEXITY_CRITERIA = manifest.complexity_criteria;

class AnalyzeRequirement {
  static async execute(params, executionId) {
    const {
      requirement_file,
      output_file = null,
      output_format = 'json',
      include_recommendations = true
    } = params;

    try {
      // Lazy load invokeSkill to avoid circular dependency
      const { invokeSkill } = require('../lib/SkillInvoker');

      // Load requirement for basic info
      const requirementContent = fs.readFileSync(requirement_file, 'utf8');
      const requirement = yaml.load(requirementContent);

      console.log(`Analyzing requirement: ${requirement.ID || 'UNKNOWN'}`);

      // 1. Validate requirement
      console.log('  - Running validation...');
      const validation = await invokeSkill('validate-aordl', {
        requirement_file,
        mode: 'STRICT'
      });

      // 2. Extract entities
      console.log('  - Extracting entities...');
      const entityExtraction = await invokeSkill('extract-entities', {
        requirement_file,
        include_relationships: true
      });

      // 3. Extract invariants
      console.log('  - Extracting invariants...');
      const invariantExtraction = await invokeSkill('extract-invariants', {
        requirement_file,
        classify_rules: true
      });

      // 4. Derive API endpoint
      console.log('  - Deriving API endpoint...');
      const apiEndpoint = this.deriveAPIEndpoint(requirement);

      // 5. Calculate complexity
      console.log('  - Calculating complexity...');
      const complexity = this.calculateComplexity(
        requirement,
        entityExtraction,
        invariantExtraction
      );

      // 6. Generate recommendations
      const recommendations = include_recommendations
        ? this.generateRecommendations(
            requirement,
            validation,
            entityExtraction,
            invariantExtraction,
            complexity
          )
        : [];

      // 7. Build analysis report
      const analysis = {
        metadata: {
          analyzed_at: new Date().toISOString(),
          execution_id: executionId,
          requirement_file
        },
        requirement_id: requirement.ID || 'UNKNOWN',
        requirement_intent: requirement.Intent,
        requirement_actor: requirement.Actor,
        validation: {
          status: validation.status,
          violations_count: validation.violations.length,
          warnings_count: validation.warnings.length,
          violations: validation.violations,
          warnings: validation.warnings
        },
        entities: {
          total_count: entityExtraction.entities.length,
          primary_entities: entityExtraction.entities.filter(e => e.type === 'primary'),
          secondary_entities: entityExtraction.entities.filter(e => e.type === 'secondary'),
          relationships: entityExtraction.relationships
        },
        invariants: {
          total_count: invariantExtraction.invariants.length,
          by_type: invariantExtraction.statistics.by_type,
          invariants: invariantExtraction.invariants
        },
        api_endpoint: apiEndpoint,
        complexity,
        recommendations
      };

      // 8. Write output file if requested
      if (output_file) {
        this.writeOutputFile(output_file, analysis, output_format);
      }

      console.log('  ✓ Analysis complete');

      return {
        requirement_id: requirement.ID,
        validation_status: validation.status,
        entities: entityExtraction.entities,
        invariants: invariantExtraction.invariants,
        api_endpoint: apiEndpoint,
        complexity,
        recommendations,
        output_file
      };

    } catch (error) {
      throw new Error(`Requirement analysis failed: ${error.message}`);
    }
  }

  /**
   * Derive API endpoint design from requirement
   */
  static deriveAPIEndpoint(requirement) {
    if (!requirement.Intent) {
      return null;
    }

    const words = requirement.Intent.trim().split(/\s+/);
    const verb = words[0].toLowerCase();
    const businessObject = words.slice(1).join(' ');

    // Derive HTTP method
    const httpMethod = VERB_TO_HTTP[verb] || 'POST';

    // Derive resource path (convert business object to kebab-case)
    const resource = businessObject
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Derive path pattern
    let pathPattern = API_PATH_PATTERNS[verb] || 'POST /{resource}';
    const path = pathPattern.replace('{resource}', resource).split(' ')[1];

    // Derive request/response structure
    const requestBody = this.deriveRequestBody(requirement, verb);
    const responseBody = this.deriveResponseBody(requirement);

    // Derive query parameters (for GET/search)
    const queryParams = this.deriveQueryParams(requirement, verb);

    return {
      method: httpMethod,
      path,
      resource,
      full_endpoint: `${httpMethod} ${path}`,
      request_body: requestBody,
      response_body: responseBody,
      query_parameters: queryParams,
      authentication_required: true, // Assume all endpoints require auth
      authorization: {
        required_role: requirement.Actor || 'User',
        permission: `${verb}_${resource}`
      }
    };
  }

  /**
   * Derive request body structure
   */
  static deriveRequestBody(requirement, verb) {
    // Only POST, PUT, PATCH typically have request bodies
    if (!['POST', 'PUT', 'PATCH'].includes(VERB_TO_HTTP[verb])) {
      return null;
    }

    const fields = [];

    // Extract fields from Conditions
    if (requirement.Conditions && Array.isArray(requirement.Conditions)) {
      for (const condition of requirement.Conditions) {
        const fieldMatches = condition.match(/\b([a-z]+[-_]?[a-z]+)\s+(?:is|must|contains)/gi);
        if (fieldMatches) {
          for (const match of fieldMatches) {
            const field = match.split(/\s+/)[0];
            if (!fields.includes(field)) {
              fields.push(field);
            }
          }
        }
      }
    }

    return {
      type: 'object',
      required_fields: fields.length > 0 ? fields : ['data'],
      example: {}
    };
  }

  /**
   * Derive response body structure
   */
  static deriveResponseBody(requirement) {
    const businessObject = requirement.Intent
      ? requirement.Intent.split(/\s+/).slice(1).join('_').toLowerCase()
      : 'resource';

    return {
      type: 'object',
      structure: {
        id: 'string',
        [businessObject]: 'object',
        created_at: 'datetime',
        updated_at: 'datetime'
      }
    };
  }

  /**
   * Derive query parameters (for GET/search endpoints)
   */
  static deriveQueryParams(requirement, verb) {
    if (!['GET', 'search'].includes(verb)) {
      return [];
    }

    const params = [];

    // Search endpoints typically have filters
    if (verb === 'search') {
      params.push({ name: 'q', type: 'string', description: 'Search query' });
      params.push({ name: 'limit', type: 'integer', description: 'Results per page', default: 20 });
      params.push({ name: 'offset', type: 'integer', description: 'Pagination offset', default: 0 });
    }

    // List endpoints have pagination
    if (verb === 'list' || verb === 'view') {
      params.push({ name: 'page', type: 'integer', description: 'Page number', default: 1 });
      params.push({ name: 'per_page', type: 'integer', description: 'Items per page', default: 20 });
    }

    return params;
  }

  /**
   * Calculate complexity metrics
   */
  static calculateComplexity(requirement, entityExtraction, invariantExtraction) {
    const scores = {
      entities: entityExtraction.entities.length * COMPLEXITY_CRITERIA.entities.weight,
      invariants: invariantExtraction.invariants.length * COMPLEXITY_CRITERIA.invariants.weight,
      conditions: (requirement.Conditions?.length || 0) * COMPLEXITY_CRITERIA.conditions.weight,
      errors: (requirement.Errors?.length || 0) * COMPLEXITY_CRITERIA.errors.weight,
      relationships: entityExtraction.relationships.length * COMPLEXITY_CRITERIA.relationships.weight
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Determine complexity level
    let level;
    if (totalScore < 10) {
      level = 'LOW';
    } else if (totalScore < 25) {
      level = 'MEDIUM';
    } else if (totalScore < 50) {
      level = 'HIGH';
    } else {
      level = 'VERY_HIGH';
    }

    return {
      total_score: totalScore,
      level,
      breakdown: scores,
      factors: {
        entity_count: entityExtraction.entities.length,
        invariant_count: invariantExtraction.invariants.length,
        condition_count: requirement.Conditions?.length || 0,
        error_count: requirement.Errors?.length || 0,
        relationship_count: entityExtraction.relationships.length
      }
    };
  }

  /**
   * Generate improvement recommendations
   */
  static generateRecommendations(requirement, validation, entityExtraction, invariantExtraction, complexity) {
    const recommendations = [];

    // Validation issues
    if (validation.violations.length > 0) {
      recommendations.push({
        type: 'CRITICAL',
        category: 'validation',
        message: `Fix ${validation.violations.length} validation violation(s) before proceeding`,
        action: 'Review and address all validation errors'
      });
    }

    if (validation.warnings.length > 0) {
      recommendations.push({
        type: 'WARNING',
        category: 'validation',
        message: `Address ${validation.warnings.length} validation warning(s) for better quality`,
        action: 'Review warnings and improve requirement clarity'
      });
    }

    // Complexity recommendations
    if (complexity.level === 'VERY_HIGH') {
      recommendations.push({
        type: 'WARNING',
        category: 'complexity',
        message: 'Very high complexity detected - consider splitting into multiple requirements',
        action: 'Break down into smaller, more focused requirements'
      });
    } else if (complexity.level === 'HIGH') {
      recommendations.push({
        type: 'INFO',
        category: 'complexity',
        message: 'High complexity - ensure adequate testing and documentation',
        action: 'Add comprehensive test scenarios'
      });
    }

    // Entity recommendations
    const primaryEntities = entityExtraction.entities.filter(e => e.type === 'primary');
    if (primaryEntities.length === 0) {
      recommendations.push({
        type: 'WARNING',
        category: 'entities',
        message: 'No primary entity identified - Intent may be unclear',
        action: 'Clarify the business object in Intent field'
      });
    }

    if (primaryEntities.length > 1) {
      recommendations.push({
        type: 'INFO',
        category: 'entities',
        message: 'Multiple primary entities - may indicate compound intent',
        action: 'Consider splitting into separate requirements'
      });
    }

    // Invariant recommendations
    if (invariantExtraction.invariants.length === 0) {
      recommendations.push({
        type: 'WARNING',
        category: 'invariants',
        message: 'No business rules defined - requirement may be incomplete',
        action: 'Add domain constraints and business rules to Invariants'
      });
    }

    const unclassifiedInvariants = invariantExtraction.invariants.filter(
      inv => inv.classifications.length === 0
    );

    if (unclassifiedInvariants.length > 0) {
      recommendations.push({
        type: 'INFO',
        category: 'invariants',
        message: `${unclassifiedInvariants.length} invariant(s) could not be classified`,
        action: 'Review unclassified invariants for clarity'
      });
    }

    // Error handling recommendations
    if (!requirement.Errors || requirement.Errors.length === 0) {
      recommendations.push({
        type: 'INFO',
        category: 'error-handling',
        message: 'No error conditions defined',
        action: 'Add expected error scenarios to Errors field'
      });
    }

    return recommendations;
  }

  /**
   * Write output file in specified format
   */
  static writeOutputFile(filePath, analysis, format) {
    let content;

    if (format === 'yaml') {
      content = yaml.dump(analysis);
    } else if (format === 'markdown') {
      content = this.formatAsMarkdown(analysis);
    } else {
      content = JSON.stringify(analysis, null, 2);
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * Format analysis as Markdown
   */
  static formatAsMarkdown(analysis) {
    let md = `# Requirement Analysis: ${analysis.requirement_id}\n\n`;
    md += `**Analyzed:** ${analysis.metadata.analyzed_at}\n\n`;
    md += `**Intent:** ${analysis.requirement_intent}\n`;
    md += `**Actor:** ${analysis.requirement_actor}\n\n`;

    md += '---\n\n';
    md += '## Validation\n\n';
    md += `**Status:** ${analysis.validation.status}\n`;
    md += `- Violations: ${analysis.validation.violations_count}\n`;
    md += `- Warnings: ${analysis.validation.warnings_count}\n\n`;

    if (analysis.validation.violations.length > 0) {
      md += '### Violations\n\n';
      analysis.validation.violations.forEach((v, i) => {
        md += `${i + 1}. **[${v.severity}]** ${v.field}: ${v.violation}\n`;
      });
      md += '\n';
    }

    md += '---\n\n';
    md += '## Entities\n\n';
    md += `**Total:** ${analysis.entities.total_count}\n\n`;
    md += `- Primary: ${analysis.entities.primary_entities.length}\n`;
    md += `- Secondary: ${analysis.entities.secondary_entities.length}\n`;
    md += `- Relationships: ${analysis.entities.relationships.length}\n\n`;

    md += '---\n\n';
    md += '## Business Rules (Invariants)\n\n';
    md += `**Total:** ${analysis.invariants.total_count}\n\n`;

    md += '---\n\n';
    md += '## API Endpoint\n\n';
    md += `**Endpoint:** \`${analysis.api_endpoint.full_endpoint}\`\n`;
    md += `**Resource:** ${analysis.api_endpoint.resource}\n`;
    md += `**Auth Required:** ${analysis.api_endpoint.authentication_required}\n`;
    md += `**Required Role:** ${analysis.api_endpoint.authorization.required_role}\n\n`;

    md += '---\n\n';
    md += '## Complexity\n\n';
    md += `**Level:** ${analysis.complexity.level}\n`;
    md += `**Score:** ${analysis.complexity.total_score}\n\n`;

    md += '**Breakdown:**\n';
    for (const [factor, score] of Object.entries(analysis.complexity.breakdown)) {
      md += `- ${factor}: ${score}\n`;
    }
    md += '\n';

    if (analysis.recommendations.length > 0) {
      md += '---\n\n';
      md += '## Recommendations\n\n';
      analysis.recommendations.forEach((rec, i) => {
        md += `### ${i + 1}. [${rec.type}] ${rec.message}\n\n`;
        md += `**Action:** ${rec.action}\n\n`;
      });
    }

    return md;
  }
}

module.exports = AnalyzeRequirement;
