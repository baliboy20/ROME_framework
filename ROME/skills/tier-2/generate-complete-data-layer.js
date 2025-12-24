/**
 * /generate-complete-data-layer skill (Tier 2)
 * Generates complete data layer (Parse models + repositories + validators)
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateCompleteDataLayer {
  static async execute(params, executionId) {
    const { design_directory, output_directory, entities } = params;

    // Lazy load to avoid circular dependencies
    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🗄️  GENERATING COMPLETE DATA LAYER');
      console.log('='.repeat(70));
      console.log('');

      const filesGenerated = [];
      const componentsCreated = {
        parse_models: 0,
        repository_implementations: 0,
        validators: 0
      };

      // Create data layer directories
      const dataDir = output_directory;
      const modelsDir = path.join(dataDir, 'models');
      const repositoriesDir = path.join(dataDir, 'repositories');
      const validatorsDir = path.join(dataDir, 'validators');

      fs.mkdirSync(modelsDir, { recursive: true });
      fs.mkdirSync(repositoriesDir, { recursive: true });
      fs.mkdirSync(validatorsDir, { recursive: true });

      // Step 1: Generate Parse models
      console.log('1/3 Generating Parse Server models...');
      const parseModels = await invokeSkill('generate-parse-models', {
        design_directory,
        output_directory: modelsDir,
        entities
      });
      filesGenerated.push(...parseModels.files_generated.map(f => `models/${f}`));
      componentsCreated.parse_models = parseModels.models_created;
      console.log(`  ✅ Parse models: ${parseModels.models_created}\n`);

      // Step 2: Generate Repository implementations
      console.log('2/3 Generating repository implementations...');
      const repoImpls = await invokeSkill('generate-repository-implementations', {
        design_directory,
        output_directory: repositoriesDir,
        entities
      });
      filesGenerated.push(...repoImpls.files_generated.map(f => `repositories/${f}`));
      componentsCreated.repository_implementations = repoImpls.implementations_created;
      console.log(`  ✅ Repository implementations: ${repoImpls.implementations_created}\n`);

      // Step 3: Generate Parse validators
      console.log('3/3 Generating Parse validators...');
      const validators = await invokeSkill('generate-parse-validation', {
        design_directory,
        output_directory: validatorsDir,
        entities
      });
      filesGenerated.push(...validators.files_generated.map(f => `validators/${f}`));
      componentsCreated.validators = validators.validators_created;
      console.log(`  ✅ Validators: ${validators.validators_created}\n`);

      console.log('='.repeat(70));
      console.log('DATA LAYER GENERATION COMPLETE');
      console.log('='.repeat(70));
      console.log(`Total files: ${filesGenerated.length}`);
      console.log('');

      return {
        files_generated: filesGenerated,
        components_created: componentsCreated
      };

    } catch (error) {
      throw new Error(`Complete data layer generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateCompleteDataLayer;
