/**
 * /generate-bloc-events skill (Tier 1)
 * Generates BLoC event classes with Equatable
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateBlocEvents {
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

      // Generate BLoC events file for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}_event.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateBlocEvents(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        events_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`BLoC event generation failed: ${error.message}`);
    }
  }

  static generateBlocEvents(entity) {
    const className = this.toPascalCase(entity.name);

    let code = `import 'package:equatable/equatable.dart';\n`;
    code += `import '../../../domain/entities/${this.toSnakeCase(entity.name)}.dart';\n\n`;

    code += `/// BLoC events for ${className}\n`;
    code += `sealed class ${className}Event extends Equatable {\n`;
    code += `  const ${className}Event();\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [];\n`;
    code += `}\n\n`;

    // Load all event
    code += `/// Load all ${entity.name}s\n`;
    code += `class Load${className}sEvent extends ${className}Event {\n`;
    code += `  const Load${className}sEvent();\n`;
    code += `}\n\n`;

    // Load by ID event
    code += `/// Load ${entity.name} by ID\n`;
    code += `class Load${className}ByIdEvent extends ${className}Event {\n`;
    code += `  final String id;\n\n`;
    code += `  const Load${className}ByIdEvent(this.id);\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [id];\n`;
    code += `}\n\n`;

    // Create event
    code += `/// Create new ${entity.name}\n`;
    code += `class Create${className}Event extends ${className}Event {\n`;
    code += `  final ${className} ${this.toCamelCase(entity.name)};\n\n`;
    code += `  const Create${className}Event(this.${this.toCamelCase(entity.name)});\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [${this.toCamelCase(entity.name)}];\n`;
    code += `}\n\n`;

    // Update event
    code += `/// Update existing ${entity.name}\n`;
    code += `class Update${className}Event extends ${className}Event {\n`;
    code += `  final ${className} ${this.toCamelCase(entity.name)};\n\n`;
    code += `  const Update${className}Event(this.${this.toCamelCase(entity.name)});\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [${this.toCamelCase(entity.name)}];\n`;
    code += `}\n\n`;

    // Delete event
    code += `/// Delete ${entity.name} by ID\n`;
    code += `class Delete${className}Event extends ${className}Event {\n`;
    code += `  final String id;\n\n`;
    code += `  const Delete${className}Event(this.id);\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [id];\n`;
    code += `}\n\n`;

    // Search event
    code += `/// Search ${entity.name}s\n`;
    code += `class Search${className}sEvent extends ${className}Event {\n`;
    code += `  final Map<String, dynamic> query;\n\n`;
    code += `  const Search${className}sEvent(this.query);\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [query];\n`;
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
          { name: 'email', type: 'string', required: true }
        ]
      },
      {
        name: 'Product',
        description: 'Product domain entity',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true }
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

module.exports = GenerateBlocEvents;
