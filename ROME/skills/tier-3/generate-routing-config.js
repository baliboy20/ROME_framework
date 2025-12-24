/**
 * /generate-routing-config skill (Tier 3)
 * Generates routing configuration using go_router for type-safe navigation
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateRoutingConfig {
  static async execute(params, executionId) {
    const { code_directory, output_file, entities } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🧭 GENERATING ROUTING CONFIGURATION');
      console.log('='.repeat(70));
      console.log('');

      // Discover entities from code directory
      const discoveredEntities = entities && entities.length > 0
        ? entities
        : this.discoverEntities(code_directory);

      console.log(`Discovered ${discoveredEntities.length} entities\n`);

      // Generate routing configuration
      const routingContent = this.generateRoutingConfig(discoveredEntities);

      // Write file
      fs.writeFileSync(output_file, routingContent);

      const routesCount = 1 + (discoveredEntities.length * 2); // home + (list + detail) per entity

      console.log('='.repeat(70));
      console.log('ROUTING CONFIGURATION COMPLETE');
      console.log('='.repeat(70));
      console.log(`File: ${path.basename(output_file)}`);
      console.log(`Routes created: ${routesCount}`);
      console.log('');

      return {
        file_generated: path.basename(output_file),
        routes_created: routesCount
      };

    } catch (error) {
      throw new Error(`Routing configuration generation failed: ${error.message}`);
    }
  }

  static discoverEntities(codeDir) {
    const entities = [];
    const screensDir = path.join(codeDir, 'presentation', 'screens');

    if (fs.existsSync(screensDir)) {
      const files = fs.readdirSync(screensDir).filter(f => f.endsWith('_list_screen.dart'));
      files.forEach(file => {
        const name = file.replace('_list_screen.dart', '');
        entities.push({ name });
      });
    }

    // Default entities if none found
    if (entities.length === 0) {
      return [{ name: 'user' }, { name: 'product' }];
    }

    return entities;
  }

  static generateRoutingConfig(entities) {
    let code = `import 'package:flutter/material.dart';\n`;
    code += `import 'package:go_router/go_router.dart';\n\n`;

    // Import screens
    entities.forEach(entity => {
      const snakeName = entity.name;
      code += `import 'presentation/screens/${snakeName}_list_screen.dart';\n`;
      code += `import 'presentation/screens/${snakeName}_detail_screen.dart';\n`;
    });

    code += `\n/// GoRouter configuration\n`;
    code += `final router = GoRouter(\n`;
    code += `  initialLocation: '/',\n`;
    code += `  routes: [\n`;

    // Home route
    code += `    GoRoute(\n`;
    code += `      path: '/',\n`;
    code += `      name: 'home',\n`;
    code += `      builder: (context, state) => const HomeScreen(),\n`;
    code += `    ),\n\n`;

    // Entity routes
    entities.forEach(entity => {
      const snakeName = entity.name;
      const pascalName = this.toPascalCase(entity.name);
      const titleName = this.toTitleCase(entity.name);

      // List route
      code += `    GoRoute(\n`;
      code += `      path: '/${snakeName}s',\n`;
      code += `      name: '${snakeName}_list',\n`;
      code += `      builder: (context, state) => const ${pascalName}ListScreen(),\n`;
      code += `      routes: [\n`;

      // Detail route (nested)
      code += `        GoRoute(\n`;
      code += `          path: ':id',\n`;
      code += `          name: '${snakeName}_detail',\n`;
      code += `          builder: (context, state) {\n`;
      code += `            final id = state.pathParameters['id']!;\n`;
      code += `            return ${pascalName}DetailScreen(id: id);\n`;
      code += `          },\n`;
      code += `        ),\n`;

      code += `      ],\n`;
      code += `    ),\n\n`;
    });

    code += `  ],\n`;

    // Error handling
    code += `  errorBuilder: (context, state) => ErrorScreen(\n`;
    code += `    error: state.error.toString(),\n`;
    code += `  ),\n`;

    code += `);\n\n`;

    // Home screen placeholder
    code += `/// Home screen\n`;
    code += `class HomeScreen extends StatelessWidget {\n`;
    code += `  const HomeScreen({super.key});\n\n`;
    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += `    return Scaffold(\n`;
    code += `      appBar: AppBar(title: const Text('Home')),\n`;
    code += `      body: ListView(\n`;
    code += `        children: [\n`;

    entities.forEach(entity => {
      const snakeName = entity.name;
      const titleName = this.toTitleCase(entity.name);

      code += `          ListTile(\n`;
      code += `            title: const Text('${titleName}s'),\n`;
      code += `            trailing: const Icon(Icons.arrow_forward),\n`;
      code += `            onTap: () => context.go('/${snakeName}s'),\n`;
      code += `          ),\n`;
    });

    code += `        ],\n`;
    code += `      ),\n`;
    code += `    );\n`;
    code += `  }\n`;
    code += `}\n\n`;

    // Error screen
    code += `/// Error screen\n`;
    code += `class ErrorScreen extends StatelessWidget {\n`;
    code += `  final String error;\n\n`;
    code += `  const ErrorScreen({required this.error, super.key});\n\n`;
    code += `  @override\n`;
    code += `  Widget build(BuildContext context) {\n`;
    code += `    return Scaffold(\n`;
    code += `      appBar: AppBar(title: const Text('Error')),\n`;
    code += `      body: Center(\n`;
    code += `        child: Column(\n`;
    code += `          mainAxisAlignment: MainAxisAlignment.center,\n`;
    code += `          children: [\n`;
    code += `            const Icon(Icons.error, size: 64, color: Colors.red),\n`;
    code += `            const SizedBox(height: 16),\n`;
    code += `            Text('Error: \$error'),\n`;
    code += `            const SizedBox(height: 16),\n`;
    code += `            ElevatedButton(\n`;
    code += `              onPressed: () => context.go('/'),\n`;
    code += `              child: const Text('Go Home'),\n`;
    code += `            ),\n`;
    code += `          ],\n`;
    code += `        ),\n`;
    code += `      ),\n`;
    code += `    );\n`;
    code += `  }\n`;
    code += `}\n`;

    return code;
  }

  static toPascalCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() +
           str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  static toTitleCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = GenerateRoutingConfig;
