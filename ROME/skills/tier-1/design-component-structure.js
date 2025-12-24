/**
 * /design-component-structure skill (Tier 1)
 *
 * Designs component hierarchy and structure from data dictionary entities.
 *
 * For each entity, designs:
 * - Entity class (domain model)
 * - DTO classes (Create, Update, Response)
 * - Repository interface
 * - Service class
 * - Controller class
 *
 * Version: 1.0.0
 */

const fs = require('fs');

class DesignComponentStructure {
  static async execute(params, executionId) {
    const {
      data_dictionary_file,
      output_file = null,
      architecture_style = 'layered',
      language_target = 'typescript'
    } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🏗️  DESIGNING COMPONENT STRUCTURE');
      console.log('='.repeat(70));
      console.log('');

      // Load data dictionary
      console.log('Loading data dictionary...\n');
      const dataDict = JSON.parse(fs.readFileSync(data_dictionary_file, 'utf8'));

      const entities = dataDict.entities || [];
      const primaryEntities = entities.filter(e => e.type === 'primary');

      console.log(`Found ${primaryEntities.length} primary entities\n`);

      // Design components for each entity
      const componentSpecs = [];
      const layerDistribution = {
        entity: 0,
        dto: 0,
        repository: 0,
        service: 0,
        controller: 0
      };

      primaryEntities.forEach(entity => {
        console.log(`Designing components for: ${entity.name}`);

        // Design entity class
        const entityClass = this.designEntityClass(entity, language_target);
        componentSpecs.push(entityClass);
        layerDistribution.entity++;

        // Design DTOs
        const dtos = this.designDTOs(entity, language_target);
        componentSpecs.push(...dtos);
        layerDistribution.dto += dtos.length;

        // Design repository
        const repository = this.designRepository(entity, language_target);
        componentSpecs.push(repository);
        layerDistribution.repository++;

        // Design service
        const service = this.designService(entity, language_target);
        componentSpecs.push(service);
        layerDistribution.service++;

        // Design controller
        const controller = this.designController(entity, language_target);
        componentSpecs.push(controller);
        layerDistribution.controller++;
      });

      // Generate design specification
      const designSpec = {
        metadata: {
          generated_at: new Date().toISOString(),
          architecture_style,
          language_target,
          total_entities: primaryEntities.length,
          total_components: componentSpecs.length
        },
        layer_distribution: layerDistribution,
        components: componentSpecs
      };

      // Write output if requested
      if (output_file) {
        fs.writeFileSync(output_file, JSON.stringify(designSpec, null, 2));
      }

      console.log('');
      console.log('='.repeat(70));
      console.log('Component Structure Design Complete');
      console.log('='.repeat(70));
      console.log(`Total Components: ${componentSpecs.length}`);
      console.log(`  Entities: ${layerDistribution.entity}`);
      console.log(`  DTOs: ${layerDistribution.dto}`);
      console.log(`  Repositories: ${layerDistribution.repository}`);
      console.log(`  Services: ${layerDistribution.service}`);
      console.log(`  Controllers: ${layerDistribution.controller}`);
      console.log('');

      return {
        components_designed: componentSpecs.length,
        component_specs: componentSpecs,
        layer_distribution: layerDistribution
      };

    } catch (error) {
      throw new Error(`Component structure design failed: ${error.message}`);
    }
  }

  /**
   * Design entity class
   */
  static designEntityClass(entity, language) {
    const attributes = entity.attributes || [];
    const attrNames = attributes.map(a => typeof a === 'string' ? a : a.name);

    return {
      name: `${entity.name}`,
      layer: 'entity',
      type: 'class',
      description: `Domain entity for ${entity.name}`,
      properties: [
        { name: 'id', type: this.mapType('string', language), description: 'Unique identifier' },
        ...attrNames.map(attr => ({
          name: attr,
          type: this.mapType('string', language),
          description: `${attr} attribute`
        })),
        { name: 'createdAt', type: this.mapType('date', language), description: 'Creation timestamp' },
        { name: 'updatedAt', type: this.mapType('date', language), description: 'Last update timestamp' }
      ],
      methods: [],
      dependencies: []
    };
  }

  /**
   * Design DTO classes
   */
  static designDTOs(entity, language) {
    const attributes = entity.attributes || [];
    const attrNames = attributes.map(a => typeof a === 'string' ? a : a.name);

    const dtos = [];

    // CreateDTO
    dtos.push({
      name: `Create${entity.name}DTO`,
      layer: 'dto',
      type: 'class',
      description: `DTO for creating ${entity.name}`,
      properties: attrNames.map(attr => ({
        name: attr,
        type: this.mapType('string', language),
        required: true
      })),
      methods: [],
      dependencies: []
    });

    // UpdateDTO
    dtos.push({
      name: `Update${entity.name}DTO`,
      layer: 'dto',
      type: 'class',
      description: `DTO for updating ${entity.name}`,
      properties: attrNames.map(attr => ({
        name: attr,
        type: this.mapType('string', language),
        required: false
      })),
      methods: [],
      dependencies: []
    });

    // ResponseDTO
    dtos.push({
      name: `${entity.name}ResponseDTO`,
      layer: 'dto',
      type: 'class',
      description: `DTO for ${entity.name} API responses`,
      properties: [
        { name: 'id', type: this.mapType('string', language) },
        ...attrNames.map(attr => ({
          name: attr,
          type: this.mapType('string', language)
        })),
        { name: 'createdAt', type: this.mapType('date', language) },
        { name: 'updatedAt', type: this.mapType('date', language) }
      ],
      methods: [],
      dependencies: [entity.name]
    });

    return dtos;
  }

  /**
   * Design repository interface
   */
  static designRepository(entity, language) {
    return {
      name: `${entity.name}Repository`,
      layer: 'repository',
      type: language === 'typescript' || language === 'java' ? 'interface' : 'class',
      description: `Data access layer for ${entity.name}`,
      properties: [],
      methods: [
        {
          name: 'findById',
          returnType: `Promise<${entity.name} | null>`,
          parameters: [{ name: 'id', type: 'string' }],
          description: `Find ${entity.name} by ID`
        },
        {
          name: 'findAll',
          returnType: `Promise<${entity.name}[]>`,
          parameters: [],
          description: `Find all ${entity.name} records`
        },
        {
          name: 'create',
          returnType: `Promise<${entity.name}>`,
          parameters: [{ name: 'data', type: `Create${entity.name}DTO` }],
          description: `Create new ${entity.name}`
        },
        {
          name: 'update',
          returnType: `Promise<${entity.name}>`,
          parameters: [
            { name: 'id', type: 'string' },
            { name: 'data', type: `Update${entity.name}DTO` }
          ],
          description: `Update ${entity.name}`
        },
        {
          name: 'delete',
          returnType: 'Promise<boolean>',
          parameters: [{ name: 'id', type: 'string' }],
          description: `Delete ${entity.name}`
        }
      ],
      dependencies: [entity.name, `Create${entity.name}DTO`, `Update${entity.name}DTO`]
    };
  }

  /**
   * Design service class
   */
  static designService(entity, language) {
    return {
      name: `${entity.name}Service`,
      layer: 'service',
      type: 'class',
      description: `Business logic for ${entity.name}`,
      properties: [
        {
          name: 'repository',
          type: `${entity.name}Repository`,
          description: 'Repository dependency'
        }
      ],
      methods: [
        {
          name: 'getById',
          returnType: `Promise<${entity.name}ResponseDTO>`,
          parameters: [{ name: 'id', type: 'string' }],
          description: `Get ${entity.name} by ID`
        },
        {
          name: 'getAll',
          returnType: `Promise<${entity.name}ResponseDTO[]>`,
          parameters: [],
          description: `Get all ${entity.name} records`
        },
        {
          name: 'create',
          returnType: `Promise<${entity.name}ResponseDTO>`,
          parameters: [{ name: 'data', type: `Create${entity.name}DTO` }],
          description: `Create new ${entity.name}`
        },
        {
          name: 'update',
          returnType: `Promise<${entity.name}ResponseDTO>`,
          parameters: [
            { name: 'id', type: 'string' },
            { name: 'data', type: `Update${entity.name}DTO` }
          ],
          description: `Update ${entity.name}`
        },
        {
          name: 'delete',
          returnType: 'Promise<void>',
          parameters: [{ name: 'id', type: 'string' }],
          description: `Delete ${entity.name}`
        }
      ],
      dependencies: [`${entity.name}Repository`, `Create${entity.name}DTO`, `Update${entity.name}DTO`, `${entity.name}ResponseDTO`]
    };
  }

  /**
   * Design controller class
   */
  static designController(entity, language) {
    const entityLower = entity.name.toLowerCase();

    return {
      name: `${entity.name}Controller`,
      layer: 'controller',
      type: 'class',
      description: `API controller for ${entity.name}`,
      properties: [
        {
          name: 'service',
          type: `${entity.name}Service`,
          description: 'Service dependency'
        }
      ],
      methods: [
        {
          name: 'getById',
          httpMethod: 'GET',
          route: `/${entityLower}s/{id}`,
          returnType: `Promise<${entity.name}ResponseDTO>`,
          parameters: [{ name: 'id', type: 'string', source: 'path' }],
          description: `Get ${entity.name} by ID`
        },
        {
          name: 'getAll',
          httpMethod: 'GET',
          route: `/${entityLower}s`,
          returnType: `Promise<${entity.name}ResponseDTO[]>`,
          parameters: [],
          description: `Get all ${entity.name} records`
        },
        {
          name: 'create',
          httpMethod: 'POST',
          route: `/${entityLower}s`,
          returnType: `Promise<${entity.name}ResponseDTO>`,
          parameters: [{ name: 'data', type: `Create${entity.name}DTO`, source: 'body' }],
          description: `Create new ${entity.name}`
        },
        {
          name: 'update',
          httpMethod: 'PUT',
          route: `/${entityLower}s/{id}`,
          returnType: `Promise<${entity.name}ResponseDTO>`,
          parameters: [
            { name: 'id', type: 'string', source: 'path' },
            { name: 'data', type: `Update${entity.name}DTO`, source: 'body' }
          ],
          description: `Update ${entity.name}`
        },
        {
          name: 'delete',
          httpMethod: 'DELETE',
          route: `/${entityLower}s/{id}`,
          returnType: 'Promise<void>',
          parameters: [{ name: 'id', type: 'string', source: 'path' }],
          description: `Delete ${entity.name}`
        }
      ],
      dependencies: [`${entity.name}Service`, `Create${entity.name}DTO`, `Update${entity.name}DTO`, `${entity.name}ResponseDTO`]
    };
  }

  /**
   * Map generic types to language-specific types
   */
  static mapType(genericType, language) {
    const typeMap = {
      typescript: {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        date: 'Date',
        array: 'Array'
      },
      java: {
        string: 'String',
        number: 'Integer',
        boolean: 'Boolean',
        date: 'LocalDateTime',
        array: 'List'
      },
      python: {
        string: 'str',
        number: 'int',
        boolean: 'bool',
        date: 'datetime',
        array: 'List'
      },
      csharp: {
        string: 'string',
        number: 'int',
        boolean: 'bool',
        date: 'DateTime',
        array: 'List'
      }
    };

    return typeMap[language]?.[genericType] || 'any';
  }
}

module.exports = DesignComponentStructure;
