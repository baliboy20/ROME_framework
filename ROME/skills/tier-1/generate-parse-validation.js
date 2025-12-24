/**
 * /generate-parse-validation skill (Tier 1)
 * Generates json_validation schemas for Parse Server responses
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateParseValidation {
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

      // Generate validation schema for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}_validator.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateValidator(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        validators_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`Parse validation generation failed: ${error.message}`);
    }
  }

  static generateValidator(entity) {
    const className = this.toPascalCase(entity.name);
    const validatorName = `${className}Validator`;
    const properties = entity.attributes || entity.properties || [];

    let code = `import 'package:json_validation/json_validation.dart';\n\n`;

    code += `/// Validator: ${validatorName}\n`;
    code += `/// Validates Parse Server JSON responses for ${className}\n`;
    code += `class ${validatorName} {\n`;

    // Schema definition
    code += `  static final schema = Schema({\n`;

    for (const prop of properties) {
      const propName = this.toCamelCase(prop.name);
      const validators = this.getValidators(prop);
      const isRequired = prop.required !== false;

      if (isRequired) {
        code += `    '${propName}': [${validators.join(', ')}],\n`;
      } else {
        code += `    '${propName}': [isOptional, ${validators.join(', ')}],\n`;
      }
    }

    code += `  });\n\n`;

    // Validate method
    code += `  /// Validate Parse JSON response\n`;
    code += `  static ValidationResult validate(Map<String, dynamic> json) {\n`;
    code += `    return schema.validate(json);\n`;
    code += `  }\n\n`;

    // ValidateOrThrow method
    code += `  /// Validate and throw if invalid\n`;
    code += `  static void validateOrThrow(Map<String, dynamic> json) {\n`;
    code += `    final result = validate(json);\n`;
    code += `    if (!result.isValid) {\n`;
    code += `      throw ValidationException(\n`;
    code += `        'Invalid ${className} data: \${result.errors.join(', ')}',\n`;
    code += `      );\n`;
    code += `    }\n`;
    code += `  }\n\n`;

    // ValidateList method
    code += `  /// Validate list of ${className}s\n`;
    code += `  static List<ValidationResult> validateList(List<Map<String, dynamic>> jsonList) {\n`;
    code += `    return jsonList.map((json) => validate(json)).toList();\n`;
    code += `  }\n`;

    code += `}\n\n`;

    // ValidationException
    code += `/// Exception thrown on validation failure\n`;
    code += `class ValidationException implements Exception {\n`;
    code += `  final String message;\n\n`;
    code += `  ValidationException(this.message);\n\n`;
    code += `  @override\n`;
    code += `  String toString() => 'ValidationException: \$message';\n`;
    code += `}\n`;

    return code;
  }

  static getValidators(prop) {
    const validators = [];
    const type = prop.type?.toLowerCase() || 'string';

    // Type validators
    switch (type) {
      case 'string':
      case 'text':
      case 'uuid':
        validators.push('isString');
        if (prop.minLength) {
          validators.push(`minLength(${prop.minLength})`);
        }
        if (prop.maxLength) {
          validators.push(`maxLength(${prop.maxLength})`);
        }
        break;

      case 'integer':
      case 'int':
        validators.push('isInt');
        if (prop.min !== undefined) {
          validators.push(`min(${prop.min})`);
        }
        if (prop.max !== undefined) {
          validators.push(`max(${prop.max})`);
        }
        break;

      case 'decimal':
      case 'float':
      case 'double':
        validators.push('isDouble');
        if (prop.min !== undefined) {
          validators.push(`min(${prop.min})`);
        }
        if (prop.max !== undefined) {
          validators.push(`max(${prop.max})`);
        }
        break;

      case 'boolean':
      case 'bool':
        validators.push('isBool');
        break;

      case 'datetime':
      case 'date':
      case 'timestamp':
        validators.push('isDateTime');
        break;

      case 'json':
        validators.push('isMap');
        break;

      case 'array':
        validators.push('isList');
        break;

      default:
        validators.push('isString');
    }

    // Email validation
    if (prop.name?.toLowerCase().includes('email')) {
      validators.push('isEmail');
    }

    // URL validation
    if (prop.name?.toLowerCase().includes('url')) {
      validators.push('isUrl');
    }

    // Pattern validation
    if (prop.pattern) {
      validators.push(`matchesPattern(r'${prop.pattern}')`);
    }

    return validators;
  }

  static generateDefaultEntities() {
    return [
      {
        name: 'User',
        description: 'User domain entity',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'username', type: 'string', required: true, minLength: 3, maxLength: 50 }
        ]
      },
      {
        name: 'Product',
        description: 'Product domain entity',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'price', type: 'decimal', required: true, min: 0 }
        ]
      }
    ];
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

module.exports = GenerateParseValidation;
