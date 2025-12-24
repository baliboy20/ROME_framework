/**
 * /generate-bloc-states skill (Tier 1)
 * Generates BLoC state classes using native Dart sealed classes
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateBlocStates {
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

      // Generate BLoC states file for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}_state.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateBlocStates(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        states_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`BLoC state generation failed: ${error.message}`);
    }
  }

  static generateBlocStates(entity) {
    const className = this.toPascalCase(entity.name);

    let code = `import 'package:equatable/equatable.dart';\n`;
    code += `import '../../../domain/entities/${this.toSnakeCase(entity.name)}.dart';\n\n`;

    code += `/// BLoC states for ${className}\n`;
    code += `sealed class ${className}State extends Equatable {\n`;
    code += `  const ${className}State();\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [];\n`;
    code += `}\n\n`;

    // Initial state
    code += `/// Initial state\n`;
    code += `final class ${className}InitialState extends ${className}State {\n`;
    code += `  const ${className}InitialState();\n`;
    code += `}\n\n`;

    // Loading state
    code += `/// Loading state\n`;
    code += `final class ${className}LoadingState extends ${className}State {\n`;
    code += `  const ${className}LoadingState();\n`;
    code += `}\n\n`;

    // Loaded single state
    code += `/// Loaded single ${entity.name}\n`;
    code += `final class ${className}LoadedState extends ${className}State {\n`;
    code += `  final ${className} ${this.toCamelCase(entity.name)};\n\n`;
    code += `  const ${className}LoadedState(this.${this.toCamelCase(entity.name)});\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [${this.toCamelCase(entity.name)}];\n`;
    code += `}\n\n`;

    // Loaded list state
    code += `/// Loaded list of ${entity.name}s\n`;
    code += `final class ${className}ListLoadedState extends ${className}State {\n`;
    code += `  final List<${className}> items;\n\n`;
    code += `  const ${className}ListLoadedState(this.items);\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [items];\n`;
    code += `}\n\n`;

    // Success state (for create/update/delete)
    code += `/// Operation successful\n`;
    code += `final class ${className}SuccessState extends ${className}State {\n`;
    code += `  final String message;\n`;
    code += `  final ${className}? ${this.toCamelCase(entity.name)};\n\n`;
    code += `  const ${className}SuccessState(this.message, {this.${this.toCamelCase(entity.name)}});\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [message, ${this.toCamelCase(entity.name)}];\n`;
    code += `}\n\n`;

    // Error state
    code += `/// Error state\n`;
    code += `final class ${className}ErrorState extends ${className}State {\n`;
    code += `  final String message;\n\n`;
    code += `  const ${className}ErrorState(this.message);\n\n`;
    code += `  @override\n`;
    code += `  List<Object?> get props => [message];\n`;
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

module.exports = GenerateBlocStates;
