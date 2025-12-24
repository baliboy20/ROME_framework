/**
 * /design-service-layer skill (Tier 1)
 * Designs business logic service layer with transaction management
 * Version: 1.0.0
 */

const fs = require('fs');

class DesignServiceLayer {
  static async execute(params, executionId) {
    const { data_dictionary_file, output_file = null } = params;

    try {
      const dataDict = JSON.parse(fs.readFileSync(data_dictionary_file, 'utf8'));
      const primaryEntities = (dataDict.entities || []).filter(e => e.type === 'primary');

      const serviceSpecs = primaryEntities.map(entity => ({
        name: `${entity.name}Service`,
        entity: entity.name,
        methods: [
          { name: 'create', transactional: true, validation: true },
          { name: 'update', transactional: true, validation: true },
          { name: 'delete', transactional: true, validation: false },
          { name: 'findById', transactional: false, validation: false },
          { name: 'findAll', transactional: false, validation: false }
        ],
        dependencies: [`${entity.name}Repository`, `${entity.name}Validator`]
      }));

      const designSpec = {
        metadata: { generated_at: new Date().toISOString() },
        services: serviceSpecs
      };

      if (output_file) fs.writeFileSync(output_file, JSON.stringify(designSpec, null, 2));

      return { services_designed: serviceSpecs.length, service_specs: serviceSpecs };
    } catch (error) {
      throw new Error(`Service layer design failed: ${error.message}`);
    }
  }
}

module.exports = DesignServiceLayer;
