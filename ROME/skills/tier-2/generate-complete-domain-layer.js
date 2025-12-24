/**
 * /generate-complete-domain-layer skill (Tier 2)
 * Generates complete domain layer (entities + repositories + result types)
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateCompleteDomainLayer {
  static async execute(params, executionId) {
    const { design_directory, output_directory, entities } = params;

    // Lazy load to avoid circular dependencies
    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🏗️  GENERATING COMPLETE DOMAIN LAYER');
      console.log('='.repeat(70));
      console.log('');

      const filesGenerated = [];
      const componentsCreated = {
        result_types: 0,
        entities: 0,
        repository_interfaces: 0
      };

      // Create domain layer directories
      const domainDir = output_directory;
      const entitiesDir = path.join(domainDir, 'entities');
      const repositoriesDir = path.join(domainDir, 'repositories');
      const valueObjectsDir = path.join(domainDir, 'value_objects');

      fs.mkdirSync(entitiesDir, { recursive: true });
      fs.mkdirSync(repositoriesDir, { recursive: true });
      fs.mkdirSync(valueObjectsDir, { recursive: true });

      // Step 1: Generate Result types (foundation)
      console.log('1/3 Generating Result types...');
      const resultTypes = await invokeSkill('generate-result-types', {
        output_directory: valueObjectsDir
      });
      filesGenerated.push(...resultTypes.files_generated.map(f => `value_objects/${f}`));
      componentsCreated.result_types = resultTypes.files_generated.length;
      console.log(`  ✅ Result types: ${resultTypes.files_generated.length}\n`);

      // Step 2: Generate Entity classes
      console.log('2/3 Generating domain entities...');
      const entityClasses = await invokeSkill('generate-entity-classes', {
        design_directory,
        output_directory: entitiesDir,
        entities
      });
      filesGenerated.push(...entityClasses.files_generated.map(f => `entities/${f}`));
      componentsCreated.entities = entityClasses.entities_created;
      console.log(`  ✅ Entities: ${entityClasses.entities_created}\n`);

      // Step 3: Generate Repository interfaces
      console.log('3/3 Generating repository interfaces...');
      const repoInterfaces = await invokeSkill('generate-repository-interfaces', {
        design_directory,
        output_directory: repositoriesDir,
        entities
      });
      filesGenerated.push(...repoInterfaces.files_generated.map(f => `repositories/${f}`));
      componentsCreated.repository_interfaces = repoInterfaces.repositories_created;
      console.log(`  ✅ Repository interfaces: ${repoInterfaces.repositories_created}\n`);

      console.log('='.repeat(70));
      console.log('DOMAIN LAYER GENERATION COMPLETE');
      console.log('='.repeat(70));
      console.log(`Total files: ${filesGenerated.length}`);
      console.log('');

      return {
        files_generated: filesGenerated,
        components_created: componentsCreated
      };

    } catch (error) {
      throw new Error(`Complete domain layer generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateCompleteDomainLayer;
