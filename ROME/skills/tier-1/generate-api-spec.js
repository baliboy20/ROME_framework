/**
 * /generate-api-spec skill
 *
 * Generates OpenAPI 3.0 specification from AORDL requirement.
 *
 * Generates:
 * - Endpoint path and method
 * - Request/response schemas
 * - Error responses
 * - Security requirements
 * - Parameter definitions
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load configuration from manifest
const manifestPath = path.join(__dirname, '../registry/generate-api-spec.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const RESPONSE_CODES = manifest.response_codes;
const ERROR_RESPONSES = manifest.error_responses;

// Reuse verb mapping from analyze-requirement
const VERB_TO_HTTP = {
  create: 'POST', read: 'GET', retrieve: 'GET', view: 'GET', list: 'GET',
  search: 'GET', update: 'PUT', modify: 'PUT', delete: 'DELETE', remove: 'DELETE',
  submit: 'POST', approve: 'PATCH', reject: 'PATCH', archive: 'PATCH', restore: 'PATCH',
  export: 'GET', import: 'POST', generate: 'POST'
};

class GenerateAPISpec {
  static async execute(params, executionId) {
    const {
      requirement_file,
      output_file = null,
      api_version = '1.0.0',
      base_path = '/api/v1'
    } = params;

    try {
      // Lazy load invokeSkill
      const { invokeSkill } = require('../lib/SkillInvoker');

      // Load requirement
      const requirementContent = fs.readFileSync(requirement_file, 'utf8');
      const requirement = yaml.load(requirementContent);

      // Use analyze-requirement to get API endpoint details
      const analysis = await invokeSkill('analyze-requirement', {
        requirement_file,
        include_recommendations: false
      });

      const apiEndpoint = analysis.api_endpoint;

      // Build OpenAPI spec
      const openApiSpec = this.buildOpenAPISpec(
        requirement,
        apiEndpoint,
        api_version,
        base_path
      );

      // Write output file if requested
      if (output_file) {
        const content = output_file.endsWith('.json')
          ? JSON.stringify(openApiSpec, null, 2)
          : yaml.dump(openApiSpec);
        fs.writeFileSync(output_file, content);
      }

      return {
        openapi_spec: openApiSpec,
        endpoint_path: `${apiEndpoint.method} ${base_path}${apiEndpoint.path}`,
        output_file
      };

    } catch (error) {
      throw new Error(`API spec generation failed: ${error.message}`);
    }
  }

  /**
   * Build complete OpenAPI 3.0 specification
   */
  static buildOpenAPISpec(requirement, apiEndpoint, apiVersion, basePath) {
    const resourceName = apiEndpoint.resource.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const spec = {
      openapi: '3.0.3',
      info: {
        title: `${resourceName} API`,
        description: `API endpoint for: ${requirement.Intent}`,
        version: apiVersion
      },
      servers: [
        {
          url: basePath,
          description: 'API v1'
        }
      ],
      paths: {},
      components: {
        schemas: this.buildSchemas(requirement, apiEndpoint, resourceName),
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
      ]
    };

    // Add path operation
    spec.paths[apiEndpoint.path] = this.buildPathOperation(
      requirement,
      apiEndpoint,
      resourceName
    );

    return spec;
  }

  /**
   * Build path operation for the endpoint
   */
  static buildPathOperation(requirement, apiEndpoint, resourceName) {
    const method = apiEndpoint.method.toLowerCase();
    const operation = {};

    operation[method] = {
      summary: requirement.Intent,
      description: requirement.Outcomes ? requirement.Outcomes.join('. ') : '',
      operationId: `${method}${resourceName}`,
      tags: [resourceName],
      security: [{ BearerAuth: [] }],
      responses: this.buildResponses(requirement, apiEndpoint)
    };

    // Add parameters for path variables (e.g., {id})
    if (apiEndpoint.path.includes('{id}')) {
      operation[method].parameters = [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: `${resourceName} ID`,
          schema: { type: 'string' }
        }
      ];
    }

    // Add query parameters
    if (apiEndpoint.query_parameters && apiEndpoint.query_parameters.length > 0) {
      operation[method].parameters = operation[method].parameters || [];
      operation[method].parameters.push(...this.buildQueryParameters(apiEndpoint.query_parameters));
    }

    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(apiEndpoint.method)) {
      operation[method].requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${resourceName}Request` }
          }
        }
      };
    }

    return operation;
  }

  /**
   * Build query parameters
   */
  static buildQueryParameters(queryParams) {
    return queryParams.map(param => ({
      name: param.name,
      in: 'query',
      description: param.description,
      required: param.required || false,
      schema: {
        type: param.type,
        default: param.default
      }
    }));
  }

  /**
   * Build response definitions
   */
  static buildResponses(requirement, apiEndpoint) {
    const resourceName = apiEndpoint.resource.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    const responses = {};

    // Success response
    const successCode = RESPONSE_CODES[apiEndpoint.method]?.success || '200';
    const successDesc = RESPONSE_CODES[apiEndpoint.method]?.success_description || 'Success';

    responses[successCode] = {
      description: successDesc,
      content: {}
    };

    // Add response body for non-DELETE methods
    if (apiEndpoint.method !== 'DELETE') {
      responses[successCode].content['application/json'] = {
        schema: { $ref: `#/components/schemas/${resourceName}Response` }
      };
    }

    // Error responses from requirement Errors field
    if (requirement.Errors && Array.isArray(requirement.Errors)) {
      requirement.Errors.forEach(error => {
        const errorCode = this.mapErrorToCode(error);
        if (!responses[errorCode]) {
          responses[errorCode] = {
            description: error.message || 'Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          };
        }
      });
    }

    // Add standard error responses
    ERROR_RESPONSES.forEach(error => {
      if (!responses[error.code]) {
        responses[error.code] = {
          description: error.description,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        };
      }
    });

    return responses;
  }

  /**
   * Map error condition to HTTP status code
   */
  static mapErrorToCode(error) {
    const errorText = (error.error || error.condition || '').toLowerCase();

    if (errorText.includes('not found')) return '404';
    if (errorText.includes('already exists') || errorText.includes('duplicate')) return '409';
    if (errorText.includes('unauthorized') || errorText.includes('not authenticated')) return '401';
    if (errorText.includes('forbidden') || errorText.includes('permission') || errorText.includes('not owner')) return '403';
    if (errorText.includes('invalid') || errorText.includes('validation')) return '422';

    return '400'; // Default to bad request
  }

  /**
   * Build schema definitions
   */
  static buildSchemas(requirement, apiEndpoint, resourceName) {
    const schemas = {};

    // Request schema
    schemas[`${resourceName}Request`] = this.buildRequestSchema(requirement, resourceName);

    // Response schema
    schemas[`${resourceName}Response`] = this.buildResponseSchema(requirement, resourceName);

    // Error schema
    schemas.Error = {
      type: 'object',
      required: ['error', 'message'],
      properties: {
        error: {
          type: 'string',
          description: 'Error code'
        },
        message: {
          type: 'string',
          description: 'Error message'
        },
        details: {
          type: 'object',
          description: 'Additional error details'
        }
      }
    };

    return schemas;
  }

  /**
   * Build request schema
   */
  static buildRequestSchema(requirement, resourceName) {
    const properties = {};
    const required = [];

    // Extract fields from Conditions
    if (requirement.Conditions && Array.isArray(requirement.Conditions)) {
      requirement.Conditions.forEach(condition => {
        const fields = this.extractFieldsFromCondition(condition);
        fields.forEach(field => {
          properties[field.name] = {
            type: field.type,
            description: condition
          };
          if (field.required) {
            required.push(field.name);
          }
        });
      });
    }

    // Default fields if none extracted
    if (Object.keys(properties).length === 0) {
      properties.name = {
        type: 'string',
        description: `${resourceName} name`
      };
      properties.description = {
        type: 'string',
        description: `${resourceName} description`
      };
      required.push('name');
    }

    return {
      type: 'object',
      required,
      properties
    };
  }

  /**
   * Build response schema
   */
  static buildResponseSchema(requirement, resourceName) {
    const properties = {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique identifier'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp'
      }
    };

    // Add fields from request schema
    const requestSchema = this.buildRequestSchema(requirement, resourceName);
    Object.assign(properties, requestSchema.properties);

    return {
      type: 'object',
      required: ['id', 'created_at'],
      properties
    };
  }

  /**
   * Extract field names and types from condition text
   */
  static extractFieldsFromCondition(condition) {
    const fields = [];
    const conditionLower = condition.toLowerCase();

    // Pattern: "field must be ..." or "field is required"
    const requiredPattern = /(\w+)\s+(?:must|is required|cannot be empty)/gi;
    const requiredMatches = condition.matchAll(requiredPattern);

    for (const match of requiredMatches) {
      const fieldName = match[1].toLowerCase();
      fields.push({
        name: fieldName,
        type: this.inferFieldType(fieldName, condition),
        required: true
      });
    }

    // Pattern: "field must be valid enum"
    const enumPattern = /(\w+)\s+must be (?:one of|valid enum)/gi;
    const enumMatches = condition.matchAll(enumPattern);

    for (const match of enumMatches) {
      const fieldName = match[1].toLowerCase();
      fields.push({
        name: fieldName,
        type: 'string',
        required: true
      });
    }

    return fields;
  }

  /**
   * Infer field type from name and context
   */
  static inferFieldType(fieldName, context) {
    const nameLower = fieldName.toLowerCase();

    if (nameLower.includes('date') || nameLower.includes('time')) return 'string'; // date-time format
    if (nameLower.includes('id')) return 'string';
    if (nameLower.includes('count') || nameLower.includes('number')) return 'integer';
    if (nameLower.includes('price') || nameLower.includes('amount')) return 'number';
    if (nameLower.includes('is') || nameLower.includes('has') || nameLower.includes('enabled')) return 'boolean';

    return 'string'; // default
  }
}

module.exports = GenerateAPISpec;
