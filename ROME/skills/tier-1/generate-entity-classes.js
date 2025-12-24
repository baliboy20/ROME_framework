/**
 * /generate-entity-classes skill (Tier 1)
 * Generates Flutter domain entity classes with Equatable
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateEntityClasses {
  static async execute(params, executionId) {
    const { design_directory, output_directory, entities } = params;

    try {
      // Ensure output directory exists
      fs.mkdirSync(output_directory, { recursive: true });

      // Read data dictionary if entities not provided
      let entityList = entities;
      if (!entityList || entityList.length === 0) {
        const dataDictPath = path.join(design_directory, 'data-dictionary.json');
        if (fs.existsSync(dataDictPath)) {
          const dataDict = JSON.parse(fs.readFileSync(dataDictPath, 'utf8'));
          entityList = dataDict.entities || [];
        } else {
          entityList = this.generateDefaultEntities();
        }
      }

      const filesGenerated = [];

      // Generate entity class for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateEntityClass(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        entities_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`Entity class generation failed: ${error.message}`);
    }
  }

  static generateEntityClass(entity) {
    const className = this.toPascalCase(entity.name);
    const properties = entity.attributes || entity.properties || [];

    let code = `import 'package:equatable/equatable.dart';\n\n`;
    code += `/// Domain entity: ${className}\n`;
    code += `/// ${entity.description || `Represents ${entity.name} domain entity`}\n`;
    code += `class ${className} extends Equatable {\n`;

    // Constructor parameters
    const params = properties.map(prop => {
      const type = this.mapDartType(prop.type);
      const isRequired = prop.required !== false;
      return `    ${isRequired ? 'required ' : ''}this.${this.toCamelCase(prop.name)},`;
    }).join('\n');

    // Properties
    const propDeclarations = properties.map(prop => {
      const type = this.mapDartType(prop.type);
      const nullable = prop.required === false ? '?' : '';
      return `  final ${type}${nullable} ${this.toCamelCase(prop.name)};`;
    }).join('\n');

    code += propDeclarations + '\n\n';

    // Constructor
    code += `  const ${className}({\n`;
    code += params + '\n';
    code += `  });\n\n`;

    // Equatable props
    const propsStr = properties.map(p => this.toCamelCase(p.name)).join(', ');
    code += `  @override\n`;
    code += `  List<Object?> get props => [${propsStr}];\n\n`;

    // copyWith method
    code += `  ${className} copyWith({\n`;
    code += properties.map(prop => {
      const type = this.mapDartType(prop.type);
      return `    ${type}? ${this.toCamelCase(prop.name)},`;
    }).join('\n') + '\n';
    code += `  }) {\n`;
    code += `    return ${className}(\n`;
    code += properties.map(prop => {
      const name = this.toCamelCase(prop.name);
      return `      ${name}: ${name} ?? this.${name},`;
    }).join('\n') + '\n';
    code += `    );\n`;
    code += `  }\n`;

    code += `}\n`;

    return code;
  }

  static generateDefaultEntities() {
    return [
      {
        name: 'User',
        description: 'User domain entity',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'username', type: 'string', required: true },
          { name: 'createdAt', type: 'datetime', required: true }
        ]
      },
      {
        name: 'Product',
        description: 'Product domain entity',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'price', type: 'decimal', required: true },
          { name: 'description', type: 'string', required: false }
        ]
      }
    ];
  }

  static mapDartType(type) {
    if (!type) return 'String';

    const typeMap = {
      'string': 'String',
      'text': 'String',
      'integer': 'int',
      'int': 'int',
      'decimal': 'double',
      'float': 'double',
      'double': 'double',
      'boolean': 'bool',
      'bool': 'bool',
      'datetime': 'DateTime',
      'date': 'DateTime',
      'timestamp': 'DateTime',
      'uuid': 'String',
      'json': 'Map<String, dynamic>',
      'array': 'List<dynamic>'
    };

    return typeMap[type.toLowerCase()] || 'String';
  }

  static toPascalCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() +
           str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  static toCamelCase(str) {
    if (!str) return '';
    return str.charAt(0).toLowerCase() +
           str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  static toSnakeCase(str) {
    if (!str) return '';
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}

module.exports = GenerateEntityClasses;
