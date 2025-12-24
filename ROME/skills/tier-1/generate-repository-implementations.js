/**
 * /generate-repository-implementations skill (Tier 1)
 * Generates concrete repository implementations using Parse SDK
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateRepositoryImplementations {
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

      // Generate repository implementation for each entity
      for (const entity of entityList) {
        const fileName = `${this.toSnakeCase(entity.name)}_repository_impl.dart`;
        const filePath = path.join(output_directory, fileName);
        const content = this.generateRepositoryImpl(entity);

        fs.writeFileSync(filePath, content);
        filesGenerated.push(fileName);
      }

      return {
        files_generated: filesGenerated,
        implementations_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`Repository implementation generation failed: ${error.message}`);
    }
  }

  static generateRepositoryImpl(entity) {
    const className = this.toPascalCase(entity.name);
    const repoName = `${className}Repository`;
    const implName = `${className}RepositoryImpl`;
    const modelName = `${className}Model`;
    const varName = this.toCamelCase(entity.name);

    let code = `import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';\n`;
    code += `import '../../domain/entities/${this.toSnakeCase(entity.name)}.dart';\n`;
    code += `import '../../domain/repositories/${this.toSnakeCase(entity.name)}_repository.dart';\n`;
    code += `import '../../domain/value_objects/result.dart';\n`;
    code += `import '../models/${this.toSnakeCase(entity.name)}_model.dart';\n\n`;

    code += `/// Repository implementation: ${implName}\n`;
    code += `/// Implements ${repoName} using Parse Server SDK\n`;
    code += `class ${implName} implements ${repoName} {\n`;

    // Create method
    code += `  @override\n`;
    code += `  Future<Result<${className}>> create(${className} ${varName}) async {\n`;
    code += `    try {\n`;
    code += `      final model = ${modelName}.fromEntity(${varName});\n`;
    code += `      final response = await model.save();\n`;
    code += `      \n`;
    code += `      if (response.success && response.result != null) {\n`;
    code += `        final saved = response.result as ${modelName};\n`;
    code += `        return Success(saved.toEntity());\n`;
    code += `      }\n`;
    code += `      \n`;
    code += `      return Error(response.error?.message ?? 'Failed to create ${entity.name}');\n`;
    code += `    } catch (e) {\n`;
    code += `      return Error('Exception creating ${entity.name}: \$e');\n`;
    code += `    }\n`;
    code += `  }\n\n`;

    // GetById method
    code += `  @override\n`;
    code += `  Future<Result<${className}>> getById(String id) async {\n`;
    code += `    try {\n`;
    code += `      final query = QueryBuilder<${modelName}>(${modelName}())\n`;
    code += `        ..whereEqualTo('objectId', id);\n`;
    code += `      \n`;
    code += `      final response = await query.query();\n`;
    code += `      \n`;
    code += `      if (response.success && response.results != null && response.results!.isNotEmpty) {\n`;
    code += `        final model = response.results!.first as ${modelName};\n`;
    code += `        return Success(model.toEntity());\n`;
    code += `      }\n`;
    code += `      \n`;
    code += `      return Error('${className} not found');\n`;
    code += `    } catch (e) {\n`;
    code += `      return Error('Exception getting ${entity.name}: \$e');\n`;
    code += `    }\n`;
    code += `  }\n\n`;

    // GetAll method
    code += `  @override\n`;
    code += `  Future<Result<List<${className}>>> getAll() async {\n`;
    code += `    try {\n`;
    code += `      final query = QueryBuilder<${modelName}>(${modelName}());\n`;
    code += `      final response = await query.query();\n`;
    code += `      \n`;
    code += `      if (response.success && response.results != null) {\n`;
    code += `        final entities = response.results!\n`;
    code += `          .cast<${modelName}>()\n`;
    code += `          .map((model) => model.toEntity())\n`;
    code += `          .toList();\n`;
    code += `        return Success(entities);\n`;
    code += `      }\n`;
    code += `      \n`;
    code += `      return Error(response.error?.message ?? 'Failed to get ${entity.name}s');\n`;
    code += `    } catch (e) {\n`;
    code += `      return Error('Exception getting ${entity.name}s: \$e');\n`;
    code += `    }\n`;
    code += `  }\n\n`;

    // Update method
    code += `  @override\n`;
    code += `  Future<Result<${className}>> update(${className} ${varName}) async {\n`;
    code += `    try {\n`;
    code += `      final model = ${modelName}.fromEntity(${varName});\n`;
    code += `      final response = await model.save();\n`;
    code += `      \n`;
    code += `      if (response.success && response.result != null) {\n`;
    code += `        final updated = response.result as ${modelName};\n`;
    code += `        return Success(updated.toEntity());\n`;
    code += `      }\n`;
    code += `      \n`;
    code += `      return Error(response.error?.message ?? 'Failed to update ${entity.name}');\n`;
    code += `    } catch (e) {\n`;
    code += `      return Error('Exception updating ${entity.name}: \$e');\n`;
    code += `    }\n`;
    code += `  }\n\n`;

    // Delete method
    code += `  @override\n`;
    code += `  Future<Result<void>> delete(String id) async {\n`;
    code += `    try {\n`;
    code += `      final model = ${modelName}()..objectId = id;\n`;
    code += `      final response = await model.delete();\n`;
    code += `      \n`;
    code += `      if (response.success) {\n`;
    code += `        return const Success(null);\n`;
    code += `      }\n`;
    code += `      \n`;
    code += `      return Error(response.error?.message ?? 'Failed to delete ${entity.name}');\n`;
    code += `    } catch (e) {\n`;
    code += `      return Error('Exception deleting ${entity.name}: \$e');\n`;
    code += `    }\n`;
    code += `  }\n\n`;

    // Search method
    code += `  @override\n`;
    code += `  Future<Result<List<${className}>>> search(Map<String, dynamic> query) async {\n`;
    code += `    try {\n`;
    code += `      final queryBuilder = QueryBuilder<${modelName}>(${modelName}());\n`;
    code += `      \n`;
    code += `      // Apply query parameters\n`;
    code += `      query.forEach((key, value) {\n`;
    code += `        queryBuilder.whereEqualTo(key, value);\n`;
    code += `      });\n`;
    code += `      \n`;
    code += `      final response = await queryBuilder.query();\n`;
    code += `      \n`;
    code += `      if (response.success && response.results != null) {\n`;
    code += `        final entities = response.results!\n`;
    code += `          .cast<${modelName}>()\n`;
    code += `          .map((model) => model.toEntity())\n`;
    code += `          .toList();\n`;
    code += `        return Success(entities);\n`;
    code += `      }\n`;
    code += `      \n`;
    code += `      return Error(response.error?.message ?? 'Search failed');\n`;
    code += `    } catch (e) {\n`;
    code += `      return Error('Exception searching ${entity.name}s: \$e');\n`;
    code += `    }\n`;
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

module.exports = GenerateRepositoryImplementations;
