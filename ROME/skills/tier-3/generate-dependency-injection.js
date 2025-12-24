/**
 * /generate-dependency-injection skill (Tier 3)
 * Generates dependency injection setup using get_it service locator
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateDependencyInjection {
  static async execute(params, executionId) {
    const { code_directory, output_file, entities } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('💉 GENERATING DEPENDENCY INJECTION SETUP');
      console.log('='.repeat(70));
      console.log('');

      // Discover entities from code directory
      const discoveredEntities = entities && entities.length > 0
        ? entities
        : this.discoverEntities(code_directory);

      console.log(`Discovered ${discoveredEntities.length} entities\n`);

      // Generate DI configuration
      const diContent = this.generateDIConfig(discoveredEntities);

      // Write file
      fs.writeFileSync(output_file, diContent);

      const dependenciesCount = (discoveredEntities.length * 3) + 2; // repos * 3 (interface, impl, bloc) + Parse + router

      console.log('='.repeat(70));
      console.log('DEPENDENCY INJECTION SETUP COMPLETE');
      console.log('='.repeat(70));
      console.log(`File: ${path.basename(output_file)}`);
      console.log(`Dependencies registered: ${dependenciesCount}`);
      console.log('');

      return {
        file_generated: path.basename(output_file),
        dependencies_registered: dependenciesCount
      };

    } catch (error) {
      throw new Error(`Dependency injection generation failed: ${error.message}`);
    }
  }

  static discoverEntities(codeDir) {
    const entities = [];
    const entitiesDir = path.join(codeDir, 'domain', 'entities');

    if (fs.existsSync(entitiesDir)) {
      const files = fs.readdirSync(entitiesDir).filter(f => f.endsWith('.dart'));
      files.forEach(file => {
        const name = file.replace('.dart', '');
        entities.push({ name });
      });
    }

    // Default entities if none found
    if (entities.length === 0) {
      return [{ name: 'user' }, { name: 'product' }];
    }

    return entities;
  }

  static generateDIConfig(entities) {
    let code = `import 'package:get_it/get_it.dart';\n`;
    code += `import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';\n\n`;

    // Import repositories
    entities.forEach(entity => {
      const snakeName = entity.name;
      const pascalName = this.toPascalCase(entity.name);

      code += `import 'domain/repositories/${snakeName}_repository.dart';\n`;
      code += `import 'data/repositories/${snakeName}_repository_impl.dart';\n`;
      code += `import 'presentation/bloc/${snakeName}/${snakeName}_bloc.dart';\n`;
    });

    code += `\n/// Service locator instance\n`;
    code += `final sl = GetIt.instance;\n\n`;

    code += `/// Initialize dependency injection\n`;
    code += `Future<void> initializeDependencies() async {\n`;
    code += `  // Parse Server initialization\n`;
    code += `  await _initializeParse();\n\n`;

    code += `  // Register repositories\n`;
    entities.forEach(entity => {
      const snakeName = entity.name;
      const pascalName = this.toPascalCase(entity.name);
      const repoInterface = `${pascalName}Repository`;
      const repoImpl = `${pascalName}RepositoryImpl`;

      code += `  sl.registerLazySingleton<${repoInterface}>(\n`;
      code += `    () => ${repoImpl}(),\n`;
      code += `  );\n\n`;
    });

    code += `  // Register BLoCs\n`;
    entities.forEach(entity => {
      const snakeName = entity.name;
      const pascalName = this.toPascalCase(entity.name);
      const blocName = `${pascalName}Bloc`;
      const repoInterface = `${pascalName}Repository`;

      code += `  sl.registerFactory(\n`;
      code += `    () => ${blocName}(sl<${repoInterface}>()),\n`;
      code += `  );\n\n`;
    });

    code += `}\n\n`;

    // Parse initialization
    code += `/// Initialize Parse Server SDK\n`;
    code += `Future<void> _initializeParse() async {\n`;
    code += `  const keyApplicationId = 'YOUR_APP_ID';\n`;
    code += `  const keyClientKey = 'YOUR_CLIENT_KEY';\n`;
    code += `  const keyParseServerUrl = 'https://parseapi.back4app.com';\n\n`;

    code += `  await Parse().initialize(\n`;
    code += `    keyApplicationId,\n`;
    code += `    keyParseServerUrl,\n`;
    code += `    clientKey: keyClientKey,\n`;
    code += `    autoSendSessionId: true,\n`;
    code += `    debug: true,\n`;
    code += `  );\n`;
    code += `}\n`;

    return code;
  }

  static toPascalCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() +
           str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}

module.exports = GenerateDependencyInjection;
