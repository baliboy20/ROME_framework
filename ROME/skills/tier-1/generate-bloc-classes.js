/**
 * /generate-bloc-classes skill (Tier 1)
 * Generates complete BLoC implementations with flutter_bloc
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateBlocClasses {
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

      // Generate BLoC class for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}_bloc.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateBloc(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        blocs_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`BLoC class generation failed: ${error.message}`);
    }
  }

  static generateBloc(entity) {
    const className = this.toPascalCase(entity.name);
    const blocName = `${className}Bloc`;
    const repoName = `${className}Repository`;
    const varName = this.toCamelCase(entity.name);

    let code = `import 'package:flutter_bloc/flutter_bloc.dart';\n`;
    code += `import '../../../domain/repositories/${this.toSnakeCase(entity.name)}_repository.dart';\n`;
    code += `import '${this.toSnakeCase(entity.name)}_event.dart';\n`;
    code += `import '${this.toSnakeCase(entity.name)}_state.dart';\n\n`;

    code += `/// BLoC: ${blocName}\n`;
    code += `/// Manages ${className} business logic and state\n`;
    code += `class ${blocName} extends Bloc<${className}Event, ${className}State> {\n`;
    code += `  final ${repoName} _repository;\n\n`;

    code += `  ${blocName}(this._repository) : super(const ${className}InitialState()) {\n`;
    code += `    on<Load${className}sEvent>(_onLoad${className}s);\n`;
    code += `    on<Load${className}ByIdEvent>(_onLoad${className}ById);\n`;
    code += `    on<Create${className}Event>(_onCreate${className});\n`;
    code += `    on<Update${className}Event>(_onUpdate${className});\n`;
    code += `    on<Delete${className}Event>(_onDelete${className});\n`;
    code += `    on<Search${className}sEvent>(_onSearch${className}s);\n`;
    code += `  }\n\n`;

    // Load all handler
    code += `  Future<void> _onLoad${className}s(\n`;
    code += `    Load${className}sEvent event,\n`;
    code += `    Emitter<${className}State> emit,\n`;
    code += `  ) async {\n`;
    code += `    emit(const ${className}LoadingState());\n`;
    code += `    \n`;
    code += `    final result = await _repository.getAll();\n`;
    code += `    \n`;
    code += `    result.fold(\n`;
    code += `      (items) => emit(${className}ListLoadedState(items)),\n`;
    code += `      (error) => emit(${className}ErrorState(error)),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    // Load by ID handler
    code += `  Future<void> _onLoad${className}ById(\n`;
    code += `    Load${className}ByIdEvent event,\n`;
    code += `    Emitter<${className}State> emit,\n`;
    code += `  ) async {\n`;
    code += `    emit(const ${className}LoadingState());\n`;
    code += `    \n`;
    code += `    final result = await _repository.getById(event.id);\n`;
    code += `    \n`;
    code += `    result.fold(\n`;
    code += `      (${varName}) => emit(${className}LoadedState(${varName})),\n`;
    code += `      (error) => emit(${className}ErrorState(error)),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    // Create handler
    code += `  Future<void> _onCreate${className}(\n`;
    code += `    Create${className}Event event,\n`;
    code += `    Emitter<${className}State> emit,\n`;
    code += `  ) async {\n`;
    code += `    emit(const ${className}LoadingState());\n`;
    code += `    \n`;
    code += `    final result = await _repository.create(event.${varName});\n`;
    code += `    \n`;
    code += `    result.fold(\n`;
    code += `      (${varName}) => emit(${className}SuccessState(\n`;
    code += `        '${className} created successfully',\n`;
    code += `        ${varName}: ${varName},\n`;
    code += `      )),\n`;
    code += `      (error) => emit(${className}ErrorState(error)),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    // Update handler
    code += `  Future<void> _onUpdate${className}(\n`;
    code += `    Update${className}Event event,\n`;
    code += `    Emitter<${className}State> emit,\n`;
    code += `  ) async {\n`;
    code += `    emit(const ${className}LoadingState());\n`;
    code += `    \n`;
    code += `    final result = await _repository.update(event.${varName});\n`;
    code += `    \n`;
    code += `    result.fold(\n`;
    code += `      (${varName}) => emit(${className}SuccessState(\n`;
    code += `        '${className} updated successfully',\n`;
    code += `        ${varName}: ${varName},\n`;
    code += `      )),\n`;
    code += `      (error) => emit(${className}ErrorState(error)),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    // Delete handler
    code += `  Future<void> _onDelete${className}(\n`;
    code += `    Delete${className}Event event,\n`;
    code += `    Emitter<${className}State> emit,\n`;
    code += `  ) async {\n`;
    code += `    emit(const ${className}LoadingState());\n`;
    code += `    \n`;
    code += `    final result = await _repository.delete(event.id);\n`;
    code += `    \n`;
    code += `    result.fold(\n`;
    code += `      (_) => emit(const ${className}SuccessState('${className} deleted successfully')),\n`;
    code += `      (error) => emit(${className}ErrorState(error)),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    // Search handler
    code += `  Future<void> _onSearch${className}s(\n`;
    code += `    Search${className}sEvent event,\n`;
    code += `    Emitter<${className}State> emit,\n`;
    code += `  ) async {\n`;
    code += `    emit(const ${className}LoadingState());\n`;
    code += `    \n`;
    code += `    final result = await _repository.search(event.query);\n`;
    code += `    \n`;
    code += `    result.fold(\n`;
    code += `      (items) => emit(${className}ListLoadedState(items)),\n`;
    code += `      (error) => emit(${className}ErrorState(error)),\n`;
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

module.exports = GenerateBlocClasses;
