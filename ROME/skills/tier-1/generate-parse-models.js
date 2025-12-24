/**
 * /generate-parse-models skill (Tier 1)
 * Generates Parse SDK model classes that extend ParseObject
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateParseModels {
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

      // Generate Parse model class for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}_model.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateParseModel(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        models_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`Parse model generation failed: ${error.message}`);
    }
  }

  static generateParseModel(entity) {
    const className = this.toPascalCase(entity.name);
    const modelName = `${className}Model`;
    const properties = entity.attributes || entity.properties || [];

    let code = `import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';\n`;
    code += `import '../../domain/entities/${this.toSnakeCase(entity.name)}.dart';\n\n`;

    code += `/// Parse model: ${modelName}\n`;
    code += `/// Maps ${className} domain entity to Parse Server\n`;
    code += `class ${modelName} extends ParseObject implements ParseCloneable {\n`;
    code += `  ${modelName}() : super('${className}');\n`;
    code += `  ${modelName}.clone() : this();\n\n`;

    code += `  @override\n`;
    code += `  ${modelName} clone(Map<String, dynamic> map) => ${modelName}.clone()..fromJson(map);\n\n`;

    // Getters and setters for each property
    for (const prop of properties) {
      const propName = this.toCamelCase(prop.name);
      const dartType = this.mapDartType(prop.type);
      const parseKey = propName;

      // Getter
      code += `  ${dartType}? get ${propName} => get<${dartType}>('${parseKey}');\n`;

      // Setter
      code += `  set ${propName}(${dartType}? value) => set<${dartType}>('${parseKey}', value);\n\n`;
    }

    // toEntity method
    code += `  /// Convert Parse model to domain entity\n`;
    code += `  ${className} toEntity() {\n`;
    code += `    return ${className}(\n`;
    code += properties.map(prop => {
      const name = this.toCamelCase(prop.name);
      const defaultValue = this.getDefaultValue(prop.type, prop.required !== false);
      return `      ${name}: ${name} ?? ${defaultValue},`;
    }).join('\n') + '\n';
    code += `    );\n`;
    code += `  }\n\n`;

    // fromEntity static method
    code += `  /// Create Parse model from domain entity\n`;
    code += `  static ${modelName} fromEntity(${className} entity) {\n`;
    code += `    final model = ${modelName}();\n`;
    code += properties.map(prop => {
      const name = this.toCamelCase(prop.name);
      return `    model.${name} = entity.${name};`;
    }).join('\n') + '\n';
    code += `    return model;\n`;
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

  static getDefaultValue(type, isRequired) {
    if (!isRequired) return 'null';

    const defaults = {
      'string': "''",
      'text': "''",
      'integer': '0',
      'int': '0',
      'decimal': '0.0',
      'float': '0.0',
      'double': '0.0',
      'boolean': 'false',
      'bool': 'false',
      'datetime': 'DateTime.now()',
      'date': 'DateTime.now()',
      'timestamp': 'DateTime.now()',
      'uuid': "''",
      'json': '{}',
      'array': '[]'
    };

    return defaults[type?.toLowerCase()] || "''";
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

module.exports = GenerateParseModels;
