/**
 * /generate-ui-screens skill (Tier 1)
 * Generates Flutter screen widgets with BLoC integration
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateUiScreens {
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

      // Generate list screen and detail screen for each entity
      for (const entity of entityList) {
        // List screen
        const listFileName = `${this.toSnakeCase(entity.name)}_list_screen.dart`;
        const listFilePath = path.join(output_directory, listFileName);
        const listContent = this.generateListScreen(entity);
        fs.writeFileSync(listFilePath, listContent);
        filesGenerated.push(listFileName);

        // Detail screen
        const detailFileName = `${this.toSnakeCase(entity.name)}_detail_screen.dart`;
        const detailFilePath = path.join(output_directory, detailFileName);
        const detailContent = this.generateDetailScreen(entity);
        fs.writeFileSync(detailFilePath, detailContent);
        filesGenerated.push(detailFileName);
      }

      return {
        files_generated: filesGenerated,
        screens_created: filesGenerated.length
      };

    } catch (error) {
      throw new Error(`UI screen generation failed: ${error.message}`);
    }
  }

  static generateListScreen(entity) {
    const className = this.toPascalCase(entity.name);
    const screenName = `${className}ListScreen`;
    const blocName = `${className}Bloc`;
    const varName = this.toCamelCase(entity.name);

    let code = `import 'package:flutter/material.dart';\n`;
    code += `import 'package:flutter_bloc/flutter_bloc.dart';\n`;
    code += `import '../../bloc/${this.toSnakeCase(entity.name)}/${this.toSnakeCase(entity.name)}_bloc.dart';\n`;
    code += `import '../../bloc/${this.toSnakeCase(entity.name)}/${this.toSnakeCase(entity.name)}_event.dart';\n`;
    code += `import '../../bloc/${this.toSnakeCase(entity.name)}/${this.toSnakeCase(entity.name)}_state.dart';\n\n`;

    code += `/// Screen: ${screenName}\n`;
    code += `/// Displays list of ${entity.name}s\n`;
    code += `class ${screenName} extends StatelessWidget {\n`;
    code += `  const ${screenName}({super.key});\n\n`;

    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += `    return Scaffold(\n`;
    code += `      appBar: AppBar(\n`;
    code += `        title: const Text('${this.toTitleCase(entity.name)}s'),\n`;
    code += `      ),\n`;
    code += `      body: BlocBuilder<${blocName}, ${className}State>(\n`;
    code += `        builder: (context, state) {\n`;
    code += `          return switch (state) {\n`;
    code += `            ${className}InitialState() => _buildInitial(context),\n`;
    code += `            ${className}LoadingState() => _buildLoading(),\n`;
    code += `            ${className}ListLoadedState() => _buildList(state.items),\n`;
    code += `            ${className}ErrorState() => _buildError(state.message),\n`;
    code += `            _ => _buildInitial(context),\n`;
    code += `          };\n`;
    code += `        },\n`;
    code += `      ),\n`;
    code += `      floatingActionButton: FloatingActionButton(\n`;
    code += `        onPressed: () {\n`;
    code += `          // TODO: Navigate to create ${varName} screen\n`;
    code += `        },\n`;
    code += `        child: const Icon(Icons.add),\n`;
    code += `      ),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    // Helper methods
    code += `  Widget _buildInitial(BuildContext context) {\n`;
    code += `    context.read<${blocName}>().add(const Load${className}sEvent());\n`;
    code += `    return _buildLoading();\n`;
    code += `  }\n\n`;

    code += `  Widget _buildLoading() {\n`;
    code += `    return const Center(child: CircularProgressIndicator());\n`;
    code += `  }\n\n`;

    code += `  Widget _buildList(List items) {\n`;
    code += `    if (items.isEmpty) {\n`;
    code += `      return const Center(\n`;
    code += `        child: Text('No ${entity.name}s found'),\n`;
    code += `      );\n`;
    code += `    }\n\n`;

    code += `    return ListView.builder(\n`;
    code += `      itemCount: items.length,\n`;
    code += `      itemBuilder: (context, index) {\n`;
    code += `        final ${varName} = items[index];\n`;
    code += `        return ListTile(\n`;
    code += `          title: Text(${varName}.id),\n`;
    code += `          onTap: () {\n`;
    code += `            // TODO: Navigate to detail screen\n`;
    code += `          },\n`;
    code += `        );\n`;
    code += `      },\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    code += `  Widget _buildError(String message) {\n`;
    code += `    return Center(\n`;
    code += `      child: Column(\n`;
    code += `        mainAxisAlignment: MainAxisAlignment.center,\n`;
    code += `        children: [\n`;
    code += `          Text('Error: \$message'),\n`;
    code += `          ElevatedButton(\n`;
    code += `            onPressed: () {},\n`;
    code += `            child: const Text('Retry'),\n`;
    code += `          ),\n`;
    code += `        ],\n`;
    code += `      ),\n`;
    code += `    );\n`;
    code += `  }\n`;

    code += `}\n`;

    return code;
  }

  static generateDetailScreen(entity) {
    const className = this.toPascalCase(entity.name);
    const screenName = `${className}DetailScreen`;
    const blocName = `${className}Bloc`;
    const varName = this.toCamelCase(entity.name);

    let code = `import 'package:flutter/material.dart';\n`;
    code += `import 'package:flutter_bloc/flutter_bloc.dart';\n`;
    code += `import '../../../domain/entities/${this.toSnakeCase(entity.name)}.dart';\n`;
    code += `import '../../bloc/${this.toSnakeCase(entity.name)}/${this.toSnakeCase(entity.name)}_bloc.dart';\n`;
    code += `import '../../bloc/${this.toSnakeCase(entity.name)}/${this.toSnakeCase(entity.name)}_event.dart';\n`;
    code += `import '../../bloc/${this.toSnakeCase(entity.name)}/${this.toSnakeCase(entity.name)}_state.dart';\n\n`;

    code += `/// Screen: ${screenName}\n`;
    code += `/// Displays ${entity.name} details\n`;
    code += `class ${screenName} extends StatelessWidget {\n`;
    code += `  final String id;\n\n`;
    code += `  const ${screenName}({required this.id, super.key});\n\n`;

    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += `    return Scaffold(\n`;
    code += `      appBar: AppBar(\n`;
    code += `        title: const Text('${this.toTitleCase(entity.name)} Details'),\n`;
    code += `        actions: [\n`;
    code += `          IconButton(\n`;
    code += `            icon: const Icon(Icons.edit),\n`;
    code += `            onPressed: () {\n`;
    code += `              // TODO: Navigate to edit screen\n`;
    code += `            },\n`;
    code += `          ),\n`;
    code += `          IconButton(\n`;
    code += `            icon: const Icon(Icons.delete),\n`;
    code += `            onPressed: () {\n`;
    code += `              _showDeleteDialog(context);\n`;
    code += `            },\n`;
    code += `          ),\n`;
    code += `        ],\n`;
    code += `      ),\n`;
    code += `      body: BlocBuilder<${blocName}, ${className}State>(\n`;
    code += `        builder: (context, state) {\n`;
    code += `          return switch (state) {\n`;
    code += `            ${className}InitialState() => _buildInitial(context),\n`;
    code += `            ${className}LoadingState() => _buildLoading(),\n`;
    code += `            ${className}LoadedState() => _buildDetails(state.${varName}),\n`;
    code += `            ${className}ErrorState() => _buildError(state.message),\n`;
    code += `            _ => _buildInitial(context),\n`;
    code += `          };\n`;
    code += `        },\n`;
    code += `      ),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    // Helper methods
    code += `  Widget _buildInitial(BuildContext context) {\n`;
    code += `    context.read<${blocName}>().add(Load${className}ByIdEvent(id));\n`;
    code += `    return _buildLoading();\n`;
    code += `  }\n\n`;

    code += `  Widget _buildLoading() {\n`;
    code += `    return const Center(child: CircularProgressIndicator());\n`;
    code += `  }\n\n`;

    code += `  Widget _buildDetails(${className} ${varName}) {\n`;
    code += `    return Padding(\n`;
    code += `      padding: const EdgeInsets.all(16.0),\n`;
    code += `      child: Column(\n`;
    code += `        crossAxisAlignment: CrossAxisAlignment.start,\n`;
    code += `        children: [\n`;
    code += `          Text('ID: \${${varName}.id}', style: const TextStyle(fontSize: 18)),\n`;
    code += `          // TODO: Add more fields\n`;
    code += `        ],\n`;
    code += `      ),\n`;
    code += `    );\n`;
    code += `  }\n\n`;

    code += `  Widget _buildError(String message) {\n`;
    code += `    return Center(child: Text('Error: \$message'));\n`;
    code += `  }\n\n`;

    code += `  void _showDeleteDialog(BuildContext context) {\n`;
    code += `    showDialog(\n`;
    code += `      context: context,\n`;
    code += `      builder: (dialogContext) => AlertDialog(\n`;
    code += `        title: const Text('Delete ${this.toTitleCase(entity.name)}'),\n`;
    code += `        content: const Text('Are you sure you want to delete this ${entity.name}?'),\n`;
    code += `        actions: [\n`;
    code += `          TextButton(\n`;
    code += `            onPressed: () => Navigator.pop(dialogContext),\n`;
    code += `            child: const Text('Cancel'),\n`;
    code += `          ),\n`;
    code += `          TextButton(\n`;
    code += `            onPressed: () {\n`;
    code += `              context.read<${blocName}>().add(Delete${className}Event(id));\n`;
    code += `              Navigator.pop(dialogContext);\n`;
    code += `              Navigator.pop(context);\n`;
    code += `            },\n`;
    code += `            child: const Text('Delete'),\n`;
    code += `          ),\n`;
    code += `        ],\n`;
    code += `      ),\n`;
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

  static toTitleCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = GenerateUiScreens;
