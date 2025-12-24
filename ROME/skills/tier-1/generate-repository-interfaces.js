/**
 * /generate-repository-interfaces skill (Tier 1)
 * Generates abstract repository interfaces for domain layer
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateRepositoryInterfaces {
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

      // Generate repository interface for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}_repository.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateRepositoryInterface(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        repositories_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`Repository interface generation failed: ${error.message}`);
    }
  }

  static generateRepositoryInterface(entity) {
    const className = this.toPascalCase(entity.name);
    const repoName = `${className}Repository`;

    let code = `import '../entities/${this.toSnakeCase(entity.name)}.dart';\n`;
    code += `import '../value_objects/result.dart';\n\n`;

    code += `/// Repository interface: ${repoName}\n`;
    code += `/// Defines data access contract for ${className} entity\n`;
    code += `abstract class ${repoName} {\n`;

    // Create method
    code += `  /// Create a new ${entity.name}\n`;
    code += `  Future<Result<${className}>> create(${className} ${this.toCamelCase(entity.name)});\n\n`;

    // GetById method
    code += `  /// Get ${entity.name} by ID\n`;
    code += `  Future<Result<${className}>> getById(String id);\n\n`;

    // GetAll method
    code += `  /// Get all ${entity.name}s\n`;
    code += `  Future<Result<List<${className}>>> getAll();\n\n`;

    // Update method
    code += `  /// Update existing ${entity.name}\n`;
    code += `  Future<Result<${className}>> update(${className} ${this.toCamelCase(entity.name)});\n\n`;

    // Delete method
    code += `  /// Delete ${entity.name} by ID\n`;
    code += `  Future<Result<void>> delete(String id);\n\n`;

    // Search method (optional)
    code += `  /// Search ${entity.name}s by query\n`;
    code += `  Future<Result<List<${className}>>> search(Map<String, dynamic> query);\n`;

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
          { name: 'username', type: 'string', required: true }
        ]
      },
      {
        name: 'Product',
        description: 'Product domain entity',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'price', type: 'decimal', required: true }
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

module.exports = GenerateRepositoryInterfaces;
