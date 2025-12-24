/**
 * /design-dto-models skill (Tier 1)
 * Designs DTO models for request/response data transfer
 * Version: 1.0.0
 */

const fs = require('fs');

class DesignDTOModels {
  static async execute(params, executionId) {
    const { data_dictionary_file, output_file = null } = params;

    try {
      const dataDict = JSON.parse(fs.readFileSync(data_dictionary_file, 'utf8'));
      const primaryEntities = (dataDict.entities || []).filter(e => e.type === 'primary');

      const dtoSpecs = [];
      primaryEntities.forEach(entity => {
        const attributes = (entity.attributes || []).map(a => typeof a === 'string' ? a : a.name);

        // CreateDTO
        dtoSpecs.push({
          name: `Create${entity.name}DTO`,
          type: 'request',
          entity: entity.name,
          fields: attributes.map(attr => ({ name: attr, required: true, type: 'string' }))
        });

        // UpdateDTO
        dtoSpecs.push({
          name: `Update${entity.name}DTO`,
          type: 'request',
          entity: entity.name,
          fields: attributes.map(attr => ({ name: attr, required: false, type: 'string' }))
        });

        // ResponseDTO
        dtoSpecs.push({
          name: `${entity.name}ResponseDTO`,
          type: 'response',
          entity: entity.name,
          fields: [
            { name: 'id', required: true, type: 'string' },
            ...attributes.map(attr => ({ name: attr, required: true, type: 'string' })),
            { name: 'createdAt', required: true, type: 'Date' },
            { name: 'updatedAt', required: true, type: 'Date' }
          ]
        });
      });

      const designSpec = {
        metadata: { generated_at: new Date().toISOString() },
        dtos: dtoSpecs
      };

      if (output_file) fs.writeFileSync(output_file, JSON.stringify(designSpec, null, 2));

      return { dtos_designed: dtoSpecs.length, dto_specs: dtoSpecs };
    } catch (error) {
      throw new Error(`DTO models design failed: ${error.message}`);
    }
  }
}

module.exports = DesignDTOModels;
