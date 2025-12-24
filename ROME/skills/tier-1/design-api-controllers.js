/**
 * /design-api-controllers skill (Tier 1)
 *
 * Designs API controller layer with routing, middleware, and request handling.
 *
 * For each API path, designs:
 * - Controller method
 * - Route configuration
 * - Request validation
 * - Response formatting
 * - Error handling
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const yaml = require('js-yaml');

class DesignAPIControllers {
  static async execute(params, executionId) {
    const {
      api_spec_file,
      output_file = null,
      framework = 'express'
    } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🎮 DESIGNING API CONTROLLERS');
      console.log('='.repeat(70));
      console.log('');

      // Load API specification
      console.log('Loading API specification...\n');
      const apiSpec = yaml.load(fs.readFileSync(api_spec_file, 'utf8'));

      const paths = apiSpec.paths || {};
      const pathKeys = Object.keys(paths);

      console.log(`Found ${pathKeys.length} API endpoints\n`);

      // Group endpoints by resource
      const controllerGroups = this.groupByResource(paths);

      const controllerSpecs = [];
      let totalRoutes = 0;

      Object.keys(controllerGroups).forEach(resource => {
        console.log(`Designing controller for: ${resource}`);

        const routes = controllerGroups[resource];
        const controller = this.designController(resource, routes, framework);

        controllerSpecs.push(controller);
        totalRoutes += controller.routes.length;
      });

      // Generate design specification
      const designSpec = {
        metadata: {
          generated_at: new Date().toISOString(),
          framework,
          total_controllers: controllerSpecs.length,
          total_routes: totalRoutes
        },
        controllers: controllerSpecs
      };

      // Write output if requested
      if (output_file) {
        fs.writeFileSync(output_file, JSON.stringify(designSpec, null, 2));
      }

      console.log('');
      console.log('='.repeat(70));
      console.log('API Controller Design Complete');
      console.log('='.repeat(70));
      console.log(`Controllers: ${controllerSpecs.length}`);
      console.log(`Total Routes: ${totalRoutes}`);
      console.log('');

      return {
        controllers_designed: controllerSpecs.length,
        total_routes: totalRoutes,
        controller_specs: controllerSpecs
      };

    } catch (error) {
      throw new Error(`API controller design failed: ${error.message}`);
    }
  }

  /**
   * Group API paths by resource
   */
  static groupByResource(paths) {
    const groups = {};

    Object.keys(paths).forEach(path => {
      // Extract resource name from path (e.g., /tasks -> tasks)
      const resource = path.split('/')[1] || 'root';

      if (!groups[resource]) {
        groups[resource] = [];
      }

      const methods = paths[path];
      Object.keys(methods).forEach(method => {
        groups[resource].push({
          path,
          method: method.toUpperCase(),
          spec: methods[method]
        });
      });
    });

    return groups;
  }

  /**
   * Design controller for resource
   */
  static designController(resource, routes, framework) {
    const capitalizedResource = resource.charAt(0).toUpperCase() + resource.slice(1);

    return {
      name: `${capitalizedResource}Controller`,
      resource,
      framework,
      middleware: [
        'authentication',
        'authorization',
        'validation',
        'errorHandler'
      ],
      routes: routes.map(route => this.designRoute(route, framework)),
      dependencies: [
        `${capitalizedResource}Service`,
        'ValidationMiddleware',
        'AuthMiddleware'
      ]
    };
  }

  /**
   * Design individual route
   */
  static designRoute(route, framework) {
    const { path, method, spec } = route;

    // Determine handler name from operation
    const handlerName = this.deriveHandlerName(method, path);

    return {
      method,
      path,
      handler: handlerName,
      summary: spec.summary || '',
      description: spec.description || '',
      parameters: this.extractParameters(spec),
      requestBody: spec.requestBody ? {
        required: spec.requestBody.required || false,
        contentType: 'application/json'
      } : null,
      responses: this.extractResponses(spec),
      middleware: this.determineMiddleware(method, path)
    };
  }

  /**
   * Derive handler name from method and path
   */
  static deriveHandlerName(method, path) {
    const pathParts = path.split('/').filter(p => p && !p.startsWith('{'));

    if (method === 'GET' && path.includes('{id}')) {
      return 'getById';
    } else if (method === 'GET') {
      return pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'getAll';
    } else if (method === 'POST') {
      return 'create';
    } else if (method === 'PUT' || method === 'PATCH') {
      return 'update';
    } else if (method === 'DELETE') {
      return 'delete';
    }

    return 'handler';
  }

  /**
   * Extract parameters from spec
   */
  static extractParameters(spec) {
    const params = spec.parameters || [];

    return params.map(p => ({
      name: p.name,
      in: p.in,
      required: p.required || false,
      type: p.schema?.type || 'string',
      description: p.description || ''
    }));
  }

  /**
   * Extract responses from spec
   */
  static extractResponses(spec) {
    const responses = spec.responses || {};

    return Object.keys(responses).map(code => ({
      statusCode: parseInt(code),
      description: responses[code].description || '',
      schema: responses[code].content ?
        Object.keys(responses[code].content)[0] : null
    }));
  }

  /**
   * Determine required middleware
   */
  static determineMiddleware(method, path) {
    const middleware = ['authenticate'];

    // Add validation for mutation operations
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      middleware.push('validateBody');
    }

    // Add authorization check
    middleware.push('authorize');

    return middleware;
  }
}

module.exports = DesignAPIControllers;
