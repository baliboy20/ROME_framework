/**
 * /extract-entities skill
 *
 * Extracts business entities from AORDL requirement files.
 *
 * Extraction includes:
 * - Primary entity from Intent (business object)
 * - Secondary entities mentioned in conditions/outcomes
 * - Entity attributes (properties, fields)
 * - Relationships between entities
 * - Entity context from Actor and business rules
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load entity patterns from manifest
const manifestPath = path.join(__dirname, '../registry/extract-entities.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const RELATIONSHIP_KEYWORDS = manifest.relationship_keywords;
const ATTRIBUTE_KEYWORDS = manifest.attribute_keywords;

class ExtractEntities {
  static async execute(params, executionId) {
    const {
      requirement_file,
      output_format = 'json',
      include_relationships = true,
      output_file = null
    } = params;

    try {
      // Load requirement file
      const requirementContent = fs.readFileSync(requirement_file, 'utf8');
      const requirement = yaml.load(requirementContent);

      // Extract entities
      const entities = this.extractEntitiesFromRequirement(requirement);

      // Extract relationships if requested
      const relationships = include_relationships
        ? this.extractRelationships(requirement, entities)
        : [];

      // Build result
      const result = {
        requirement_id: requirement.ID || 'UNKNOWN',
        requirement_file,
        entities,
        relationships,
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
        entities,
        relationships,
        requirement_id: requirement.ID,
        output_file
      };

    } catch (error) {
      throw new Error(`Entity extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract all entities from requirement
   */
  static extractEntitiesFromRequirement(requirement) {
    const entities = new Map(); // entity_name -> entity_data

    // 1. Extract primary entity from Intent
    const primaryEntity = this.extractPrimaryEntity(requirement.Intent);
    if (primaryEntity) {
      entities.set(primaryEntity.name, {
        name: primaryEntity.name,
        type: 'primary',
        source_fields: ['Intent'],
        attributes: new Set(),
        contexts: [requirement.Intent]
      });
    }

    // 2. Extract entities from Actor (sometimes Actor references entities)
    const actorEntity = this.extractActorEntity(requirement.Actor);
    if (actorEntity && !entities.has(actorEntity.name)) {
      entities.set(actorEntity.name, {
        name: actorEntity.name,
        type: 'actor',
        source_fields: ['Actor'],
        attributes: new Set(),
        contexts: [requirement.Actor]
      });
    }

    // 3. Scan all text fields for entity mentions
    const fieldsToScan = [
      'Preconditions',
      'Conditions',
      'Postconditions',
      'Outcomes',
      'Invariants'
    ];

    for (const field of fieldsToScan) {
      if (requirement[field]) {
        const content = Array.isArray(requirement[field])
          ? requirement[field].join(' ')
          : JSON.stringify(requirement[field]);

        const foundEntities = this.findEntitiesInText(content);

        for (const entityName of foundEntities) {
          if (entities.has(entityName)) {
            // Update existing entity
            const entity = entities.get(entityName);
            entity.source_fields.push(field);
            entity.contexts.push(content);
          } else {
            // Add new secondary entity
            entities.set(entityName, {
              name: entityName,
              type: 'secondary',
              source_fields: [field],
              attributes: new Set(),
              contexts: [content]
            });
          }
        }

        // Extract attributes for entities
        this.extractAttributes(content, entities);
      }
    }

    // 4. Extract attributes from Errors field
    if (requirement.Errors && Array.isArray(requirement.Errors)) {
      for (const error of requirement.Errors) {
        const errorText = JSON.stringify(error);
        this.extractAttributes(errorText, entities);
      }
    }

    // Convert Sets to Arrays for JSON serialization
    const result = Array.from(entities.values()).map(entity => ({
      ...entity,
      attributes: Array.from(entity.attributes),
      source_fields: [...new Set(entity.source_fields)] // Remove duplicates
    }));

    return result;
  }

  /**
   * Extract primary entity from Intent field
   * Intent format: "<verb> <business-object>"
   */
  static extractPrimaryEntity(intent) {
    if (!intent) return null;

    const words = intent.trim().split(/\s+/);

    // Skip first word (verb), take rest as business object
    if (words.length < 2) return null;

    const businessObject = words.slice(1).join(' ');
    const entityName = this.normalizeEntityName(businessObject);

    return {
      name: entityName,
      original: businessObject
    };
  }

  /**
   * Extract entity from Actor field
   * Some actors reference business entities (e.g., "ProjectManager" → "Project")
   */
  static extractActorEntity(actor) {
    if (!actor) return null;

    // Don't create entity for simple roles
    const simpleRoles = ['admin', 'administrator', 'manager', 'user', 'guest'];
    if (simpleRoles.includes(actor.toLowerCase())) {
      return null;
    }

    return {
      name: actor,
      original: actor
    };
  }

  /**
   * Find entity mentions in text
   * Looks for:
   * - Capitalized words (proper nouns)
   * - Hyphenated compound terms (e.g., "team-member", "api-token")
   * - Common business entity names
   */
  static findEntitiesInText(text) {
    const entities = new Set();

    // Pattern 1: Hyphenated compound entities (e.g., "team-member", "api-token")
    const hyphenatedPattern = /\b([a-z]+-[a-z]+(?:-[a-z]+)*)\b/gi;
    const hyphenatedMatches = text.matchAll(hyphenatedPattern);
    for (const match of hyphenatedMatches) {
      const entityName = this.normalizeEntityName(match[1]);
      entities.add(entityName);
    }

    // Pattern 2: Capitalized words that might be entities
    // (but not at start of sentence, and not common words)
    const capitalizedPattern = /(?<!^|\.\s)([A-Z][a-z]+(?:[A-Z][a-z]+)*)/g;
    const capitalizedMatches = text.matchAll(capitalizedPattern);

    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'Which', 'Who'];

    for (const match of capitalizedMatches) {
      const word = match[1];
      if (!commonWords.includes(word)) {
        entities.add(word);
      }
    }

    // Pattern 3: Known business terms
    const knownEntities = [
      'project', 'task', 'user', 'team', 'member', 'comment', 'attachment',
      'webhook', 'token', 'notification', 'permission', 'role', 'organization',
      'workspace', 'board', 'sprint', 'epic', 'issue', 'ticket', 'request'
    ];

    const textLower = text.toLowerCase();
    for (const entity of knownEntities) {
      const pattern = new RegExp(`\\b${entity}\\b`, 'i');
      if (pattern.test(textLower)) {
        entities.add(this.normalizeEntityName(entity));
      }
    }

    return entities;
  }

  /**
   * Extract attributes for entities based on context
   */
  static extractAttributes(text, entities) {
    // Look for patterns like "task name", "project title", "user email"
    for (const [entityName, entity] of entities.entries()) {
      const nameLower = entityName.toLowerCase();

      // Check for explicit attribute mentions
      for (const attrKeyword of ATTRIBUTE_KEYWORDS) {
        const pattern = new RegExp(`${nameLower}[\\s-]${attrKeyword}`, 'i');
        if (pattern.test(text)) {
          entity.attributes.add(attrKeyword);
        }

        // Also check reverse pattern: "name of task"
        const reversePattern = new RegExp(`${attrKeyword}[\\s]+(?:of|for)[\\s]+${nameLower}`, 'i');
        if (reversePattern.test(text)) {
          entity.attributes.add(attrKeyword);
        }
      }

      // Look for common attribute patterns in Invariants
      // e.g., "Task status must be...", "Project name cannot..."
      const statusPattern = new RegExp(`${nameLower}[\\s]+(?:status|state|type|name|title)`, 'i');
      const statusMatch = text.match(statusPattern);
      if (statusMatch) {
        const attr = statusMatch[0].split(/\s+/).pop();
        entity.attributes.add(attr.toLowerCase());
      }
    }
  }

  /**
   * Extract relationships between entities
   */
  static extractRelationships(requirement, entities) {
    const relationships = [];
    const entityNames = entities.map(e => e.name.toLowerCase());

    // Scan all text fields for relationship patterns
    const fieldsToScan = [
      'Preconditions',
      'Conditions',
      'Postconditions',
      'Outcomes',
      'Invariants'
    ];

    for (const field of fieldsToScan) {
      if (requirement[field]) {
        const content = Array.isArray(requirement[field])
          ? requirement[field].join(' ')
          : JSON.stringify(requirement[field]);

        // Look for relationship keywords between entities
        for (const keyword of RELATIONSHIP_KEYWORDS) {
          const pattern = new RegExp(`(${entityNames.join('|')})\\s+${keyword}\\s+(${entityNames.join('|')})`, 'gi');
          const matches = content.matchAll(pattern);

          for (const match of matches) {
            relationships.push({
              from_entity: this.normalizeEntityName(match[1]),
              relationship_type: keyword,
              to_entity: this.normalizeEntityName(match[2]),
              source_field: field,
              context: match[0]
            });
          }
        }

        // Look for implicit ownership patterns
        // e.g., "project's tasks", "task belongs to project"
        const ownershipPattern = new RegExp(`(${entityNames.join('|')})'s\\s+(${entityNames.join('|')})`, 'gi');
        const ownershipMatches = content.matchAll(ownershipPattern);

        for (const match of ownershipMatches) {
          relationships.push({
            from_entity: this.normalizeEntityName(match[1]),
            relationship_type: 'has_many',
            to_entity: this.normalizeEntityName(match[2]),
            source_field: field,
            context: match[0]
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Normalize entity names to consistent format
   * - Singular form
   * - PascalCase for compound words
   * - Remove hyphens for internal representation
   */
  static normalizeEntityName(name) {
    if (!name) return '';

    // Convert hyphenated to PascalCase: "team-member" → "TeamMember"
    const parts = name.split(/[-\s]+/);
    const pascalCase = parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');

    // Simple pluralization removal (not perfect, but good enough)
    let singular = pascalCase;
    if (singular.endsWith('ies')) {
      singular = singular.slice(0, -3) + 'y'; // "Categories" → "Category"
    } else if (singular.endsWith('ses')) {
      singular = singular.slice(0, -2); // "Addresses" → "Addres" (edge case)
    } else if (singular.endsWith('s') && !singular.endsWith('ss')) {
      singular = singular.slice(0, -1); // "Tasks" → "Task"
    }

    return singular;
  }
}

module.exports = ExtractEntities;
