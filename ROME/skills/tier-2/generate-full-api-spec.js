/**
 * /generate-full-api-spec skill (Tier 2)
 *
 * Generates unified OpenAPI 3.0 specification from all AORDL requirements.
 *
 * Process:
 * 1. Scan requirements directory
 * 2. Generate individual OpenAPI specs using /generate-api-spec
 * 3. Merge all paths, schemas, and components
 * 4. Deduplicate schemas
 * 5. Group by resource tags
 * 6. Generate unified spec
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class GenerateFullAPISpec {
  static async execute(params, executionId) {
    const {
      requirements_directory,
      output_file = null,
      api_version = '1.0.0',
      api_title = 'Generated API',
      api_description = 'API generated from AORDL requirements',
      base_path = '/api/v1',
      group_by_resource = true
    } = params;

    try {
      // Lazy load invokeSkill
      const { invokeSkill } = require('../lib/SkillInvoker');

      // Find all requirement files
      const requirementFiles = this.findRequirementFiles(requirements_directory);

      console.log(`Generating unified API spec from ${requirementFiles.length} requirements...\n`);

      // Generate individual specs
      const individualSpecs = [];

      for (const reqFile of requirementFiles) {
        const reqId = path.basename(reqFile, '.yaml');

        try {
          console.log(`  Processing ${reqId}...`);

          const spec = await invokeSkill('generate-api-spec', {
            requirement_file: reqFile,
            api_version,
            base_path
          });

          individualSpecs.push({
            requirement_id: reqId,
            spec: spec.openapi_spec
          });

        } catch (error) {
          console.warn(`  Warning: Failed to generate spec for ${reqId}: ${error.message}`);
        }
      }

      console.log(`\n✓ Generated ${individualSpecs.length} individual specs`);

      // Merge all specs into unified spec
      const unifiedSpec = this.mergeSpecs(
        individualSpecs,
        api_title,
        api_description,
        api_version,
        base_path,
        group_by_resource
      );

      // Write output file if requested
      if (output_file) {
        const content = output_file.endsWith('.json')
          ? JSON.stringify(unifiedSpec, null, 2)
          : yaml.dump(unifiedSpec);
        fs.writeFileSync(output_file, content);
      }

      const endpointCount = Object.keys(unifiedSpec.paths).length;
      const resourceCount = unifiedSpec.tags ? unifiedSpec.tags.length : 0;

      console.log(`\n✓ Unified spec generated:`);
      console.log(`  Endpoints: ${endpointCount}`);
      console.log(`  Resources: ${resourceCount}`);
      console.log(`  Schemas: ${Object.keys(unifiedSpec.components.schemas).length}`);

      return {
        openapi_spec: unifiedSpec,
        endpoint_count: endpointCount,
        resource_count: resourceCount,
        output_file
      };

    } catch (error) {
      throw new Error(`Full API spec generation failed: ${error.message}`);
    }
  }

  /**
   * Find all requirement files
   */
  static findRequirementFiles(directory) {
    const files = fs.readdirSync(directory);

    return files
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
      .filter(file => file.match(/^REQ-\d{3}\.yaml$/))
      .map(file => path.join(directory, file))
      .sort();
  }

  /**
   * Merge individual OpenAPI specs into unified spec
   */
  static mergeSpecs(individualSpecs, title, description, version, basePath, groupByResource) {
    const unifiedSpec = {
      openapi: '3.0.3',
      info: {
        title,
        description,
        version
      },
      servers: [
        {
          url: basePath,
          description: 'API Server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        { BearerAuth: [] }
      ],
      tags: []
    };

    const resourceTags = new Set();

    // Merge paths and schemas
    individualSpecs.forEach(({ spec }) => {
      // Merge paths
      Object.entries(spec.paths).forEach(([path, pathItem]) => {
        if (!unifiedSpec.paths[path]) {
          unifiedSpec.paths[path] = {};
        }

        // Merge methods (get, post, put, etc.)
        Object.entries(pathItem).forEach(([method, operation]) => {
          unifiedSpec.paths[path][method] = operation;

          // Collect resource tags
          if (operation.tags && operation.tags.length > 0) {
            operation.tags.forEach(tag => resourceTags.add(tag));
          }
        });
      });

      // Merge schemas
      if (spec.components && spec.components.schemas) {
        Object.entries(spec.components.schemas).forEach(([schemaName, schemaDefinition]) => {
          // Avoid overwriting if schema already exists with same name
          if (!unifiedSpec.components.schemas[schemaName]) {
            unifiedSpec.components.schemas[schemaName] = schemaDefinition;
          }
        });
      }
    });

    // Generate tags if grouping by resource
    if (groupByResource && resourceTags.size > 0) {
      unifiedSpec.tags = Array.from(resourceTags)
        .sort()
        .map(tag => ({
          name: tag,
          description: `${tag} operations`
        }));
    }

    return unifiedSpec;
  }
}

module.exports = GenerateFullAPISpec;
