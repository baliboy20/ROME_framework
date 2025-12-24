/**
 * /generate-data-dictionary skill
 *
 * Generates comprehensive data dictionary by aggregating entities from multiple
 * AORDL requirements.
 *
 * Features:
 * - Scans all requirements in directory
 * - Invokes /extract-entities for each requirement
 * - Aggregates entities (merges duplicates)
 * - Infers data types from attribute names
 * - Aggregates relationships
 * - Generates statistics
 * - Outputs in JSON, YAML, or Markdown format
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load type inference patterns from manifest
const manifestPath = path.join(__dirname, '../registry/generate-data-dictionary.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const TYPE_INFERENCE = manifest.type_inference;

class GenerateDataDictionary {
  static async execute(params, executionId) {
    const {
      requirements_directory,
      output_file = null,
      output_format = 'json',
      include_inferred_types = true,
      include_relationships = true
    } = params;

    try {
      // Lazy load invokeSkill to avoid circular dependency
      const { invokeSkill } = require('../lib/SkillInvoker');

      // 1. Find all requirement files
      const requirementFiles = this.findRequirementFiles(requirements_directory);

      console.log(`Found ${requirementFiles.length} requirement files`);

      // 2. Extract entities from all requirements
      const allExtractions = [];

      for (const reqFile of requirementFiles) {
        try {
          const extraction = await invokeSkill('extract-entities', {
            requirement_file: reqFile,
            include_relationships
          });

          allExtractions.push({
            requirement_id: extraction.requirement_id,
            requirement_file: reqFile,
            entities: extraction.entities,
            relationships: extraction.relationships || []
          });

        } catch (error) {
          console.warn(`Warning: Failed to extract entities from ${reqFile}: ${error.message}`);
        }
      }

      // 3. Aggregate entities
      const aggregatedEntities = this.aggregateEntities(allExtractions, include_inferred_types);

      // 4. Aggregate relationships
      const aggregatedRelationships = this.aggregateRelationships(allExtractions);

      // 5. Generate statistics
      const statistics = this.generateStatistics(
        aggregatedEntities,
        aggregatedRelationships,
        allExtractions
      );

      // 6. Build result
      const dataDictionary = {
        metadata: {
          generated_at: new Date().toISOString(),
          execution_id: executionId,
          source_directory: requirements_directory,
          total_requirements_analyzed: allExtractions.length
        },
        entities: aggregatedEntities,
        relationships: aggregatedRelationships,
        statistics
      };

      // 7. Write output file if requested
      if (output_file) {
        this.writeOutputFile(output_file, dataDictionary, output_format);
      }

      return {
        entities: aggregatedEntities,
        relationships: aggregatedRelationships,
        statistics,
        output_file
      };

    } catch (error) {
      throw new Error(`Data dictionary generation failed: ${error.message}`);
    }
  }

  /**
   * Find all YAML requirement files in directory
   */
  static findRequirementFiles(directory) {
    const files = fs.readdirSync(directory);

    return files
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
      .filter(file => file.match(/^REQ-\d{3}\.yaml$/)) // Match REQ-###.yaml pattern
      .map(file => path.join(directory, file))
      .sort();
  }

  /**
   * Aggregate entities from all extractions
   * Merges duplicate entities and consolidates attributes
   */
  static aggregateEntities(extractions, includeInferredTypes) {
    const entityMap = new Map(); // entity_name -> entity_data

    for (const extraction of extractions) {
      for (const entity of extraction.entities) {
        const entityName = entity.name;

        if (entityMap.has(entityName)) {
          // Merge with existing entity
          const existing = entityMap.get(entityName);

          // Promote type if this is a primary entity
          if (entity.type === 'primary' && existing.type !== 'primary') {
            existing.type = 'primary';
          }

          // Merge attributes
          for (const attr of entity.attributes) {
            if (!existing.attributes.includes(attr)) {
              existing.attributes.push(attr);
            }
          }

          // Add source requirement
          existing.source_requirements.push(extraction.requirement_id);

          // Increment mention count
          existing.mention_count++;

        } else {
          // Add new entity
          entityMap.set(entityName, {
            name: entityName,
            type: entity.type,
            attributes: [...entity.attributes],
            source_requirements: [extraction.requirement_id],
            mention_count: 1,
            inferred_attributes: []
          });
        }
      }
    }

    // Convert to array and infer types if requested
    const entities = Array.from(entityMap.values());

    if (includeInferredTypes) {
      for (const entity of entities) {
        entity.inferred_attributes = this.inferAttributeTypes(entity.attributes);
      }
    }

    // Sort by mention count (most mentioned first)
    entities.sort((a, b) => b.mention_count - a.mention_count);

    return entities;
  }

  /**
   * Infer data types for attributes based on name patterns
   */
  static inferAttributeTypes(attributes) {
    return attributes.map(attrName => {
      const inferredType = this.inferType(attrName);

      return {
        name: attrName,
        inferred_type: inferredType,
        constraints: this.inferConstraints(attrName, inferredType)
      };
    });
  }

  /**
   * Infer data type from attribute name
   */
  static inferType(attributeName) {
    const nameLower = attributeName.toLowerCase();

    // Check each type's patterns
    for (const [typeName, config] of Object.entries(TYPE_INFERENCE)) {
      const patterns = config.attribute_patterns || [];

      for (const pattern of patterns) {
        if (nameLower.includes(pattern) || nameLower === pattern) {
          return typeName;
        }
      }
    }

    // Default to string
    return 'string';
  }

  /**
   * Infer constraints based on attribute name and type
   */
  static inferConstraints(attributeName, inferredType) {
    const constraints = [];
    const nameLower = attributeName.toLowerCase();

    // Required constraints (common required fields)
    const requiredFields = ['id', 'name', 'title', 'type', 'status'];
    if (requiredFields.includes(nameLower)) {
      constraints.push('required');
    }

    // Unique constraints
    const uniqueFields = ['id', 'email', 'slug', 'key'];
    if (uniqueFields.includes(nameLower)) {
      constraints.push('unique');
    }

    // Indexed constraints (common indexed fields)
    const indexedFields = ['id', 'status', 'type', 'created', 'updated', 'owner'];
    if (indexedFields.includes(nameLower)) {
      constraints.push('indexed');
    }

    // Type-specific constraints
    if (inferredType === 'string') {
      if (nameLower === 'email') {
        constraints.push('format:email');
      } else if (nameLower === 'url') {
        constraints.push('format:url');
      } else if (nameLower.includes('phone')) {
        constraints.push('format:phone');
      }
    }

    if (inferredType === 'datetime') {
      constraints.push('immutable'); // Timestamps usually don't change
    }

    return constraints;
  }

  /**
   * Aggregate relationships from all extractions
   */
  static aggregateRelationships(extractions) {
    const relationships = [];
    const seen = new Set(); // Track duplicates

    for (const extraction of extractions) {
      for (const rel of extraction.relationships || []) {
        const key = `${rel.from_entity}:${rel.relationship_type}:${rel.to_entity}`;

        if (!seen.has(key)) {
          relationships.push({
            from_entity: rel.from_entity,
            relationship_type: rel.relationship_type,
            to_entity: rel.to_entity,
            source_requirements: [extraction.requirement_id]
          });
          seen.add(key);
        } else {
          // Add to source requirements
          const existing = relationships.find(r =>
            r.from_entity === rel.from_entity &&
            r.relationship_type === rel.relationship_type &&
            r.to_entity === rel.to_entity
          );
          if (existing) {
            existing.source_requirements.push(extraction.requirement_id);
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Generate statistics about the data model
   */
  static generateStatistics(entities, relationships, extractions) {
    const typeDistribution = {};
    const attributeFrequency = {};
    let totalAttributes = 0;

    for (const entity of entities) {
      // Count by type
      typeDistribution[entity.type] = (typeDistribution[entity.type] || 0) + 1;

      // Count attributes
      totalAttributes += entity.attributes.length;

      // Track attribute frequency
      for (const attr of entity.attributes) {
        attributeFrequency[attr] = (attributeFrequency[attr] || 0) + 1;
      }
    }

    // Find most common attributes
    const commonAttributes = Object.entries(attributeFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      total_entities: entities.length,
      total_relationships: relationships.length,
      total_attributes: totalAttributes,
      avg_attributes_per_entity: entities.length > 0
        ? (totalAttributes / entities.length).toFixed(2)
        : 0,
      entity_type_distribution: typeDistribution,
      most_mentioned_entities: entities.slice(0, 5).map(e => ({
        name: e.name,
        mention_count: e.mention_count
      })),
      most_common_attributes: commonAttributes,
      requirements_analyzed: extractions.length
    };
  }

  /**
   * Write output file in specified format
   */
  static writeOutputFile(filePath, dataDictionary, format) {
    let content;

    if (format === 'yaml') {
      content = yaml.dump(dataDictionary);
    } else if (format === 'markdown') {
      content = this.formatAsMarkdown(dataDictionary);
    } else {
      content = JSON.stringify(dataDictionary, null, 2);
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * Format data dictionary as Markdown
   */
  static formatAsMarkdown(dataDictionary) {
    let md = '# Data Dictionary\n\n';
    md += `Generated: ${dataDictionary.metadata.generated_at}\n`;
    md += `Requirements Analyzed: ${dataDictionary.metadata.total_requirements_analyzed}\n\n`;

    md += '---\n\n';
    md += '## Statistics\n\n';
    md += `- Total Entities: ${dataDictionary.statistics.total_entities}\n`;
    md += `- Total Relationships: ${dataDictionary.statistics.total_relationships}\n`;
    md += `- Total Attributes: ${dataDictionary.statistics.total_attributes}\n`;
    md += `- Avg Attributes/Entity: ${dataDictionary.statistics.avg_attributes_per_entity}\n\n`;

    md += '---\n\n';
    md += '## Entities\n\n';

    for (const entity of dataDictionary.entities) {
      md += `### ${entity.name}\n\n`;
      md += `**Type:** ${entity.type}\n`;
      md += `**Mentions:** ${entity.mention_count}\n`;
      md += `**Source Requirements:** ${entity.source_requirements.join(', ')}\n\n`;

      if (entity.inferred_attributes.length > 0) {
        md += '**Attributes:**\n\n';
        md += '| Attribute | Type | Constraints |\n';
        md += '|-----------|------|-------------|\n';

        for (const attr of entity.inferred_attributes) {
          const constraints = attr.constraints.join(', ') || '-';
          md += `| ${attr.name} | ${attr.inferred_type} | ${constraints} |\n`;
        }

        md += '\n';
      }
    }

    if (dataDictionary.relationships.length > 0) {
      md += '---\n\n';
      md += '## Relationships\n\n';

      for (const rel of dataDictionary.relationships) {
        md += `- **${rel.from_entity}** --[${rel.relationship_type}]--> **${rel.to_entity}**\n`;
        md += `  - Source: ${rel.source_requirements.join(', ')}\n`;
      }
    }

    return md;
  }
}

module.exports = GenerateDataDictionary;
