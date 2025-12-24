/**
 * /execute-p5-code-generation skill (Tier 2)
 * Executes complete P5 code generation (Domain + Data + Presentation layers)
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class ExecuteP5CodeGeneration {
  static async execute(params, executionId) {
    const { design_directory, code_output_directory, entities } = params;

    // Lazy load to avoid circular dependencies
    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 EXECUTING P5 CODE GENERATION PHASE');
      console.log('='.repeat(70));
      console.log('');

      const filesGenerated = [];
      const layersCreated = {
        domain: {},
        data: {},
        presentation: {}
      };

      // Create main code output directory
      fs.mkdirSync(code_output_directory, { recursive: true });

      const domainDir = path.join(code_output_directory, 'domain');
      const dataDir = path.join(code_output_directory, 'data');
      const presentationDir = path.join(code_output_directory, 'presentation');

      // Phase 1: Generate Domain Layer
      console.log('Phase 1/3: Domain Layer Generation\n');
      const domainLayer = await invokeSkill('generate-complete-domain-layer', {
        design_directory,
        output_directory: domainDir,
        entities
      });
      filesGenerated.push(...domainLayer.files_generated.map(f => `domain/${f}`));
      layersCreated.domain = domainLayer.components_created;
      console.log(`  ✅ Domain layer: ${domainLayer.files_generated.length} files\n`);

      // Phase 2: Generate Data Layer
      console.log('Phase 2/3: Data Layer Generation\n');
      const dataLayer = await invokeSkill('generate-complete-data-layer', {
        design_directory,
        output_directory: dataDir,
        entities
      });
      filesGenerated.push(...dataLayer.files_generated.map(f => `data/${f}`));
      layersCreated.data = dataLayer.components_created;
      console.log(`  ✅ Data layer: ${dataLayer.files_generated.length} files\n`);

      // Phase 3: Generate Presentation Layer
      console.log('Phase 3/3: Presentation Layer Generation\n');
      const presentationLayer = await invokeSkill('generate-complete-presentation-layer', {
        design_directory,
        output_directory: presentationDir,
        entities
      });
      filesGenerated.push(...presentationLayer.files_generated.map(f => `presentation/${f}`));
      layersCreated.presentation = presentationLayer.components_created;
      console.log(`  ✅ Presentation layer: ${presentationLayer.files_generated.length} files\n`);

      const p5Status = 'SUCCESS';

      console.log('='.repeat(70));
      console.log('P5 CODE GENERATION PHASE COMPLETE');
      console.log('='.repeat(70));
      console.log(`Status: ${p5Status}`);
      console.log(`Total files: ${filesGenerated.length}`);
      console.log('');
      console.log('Layer Summary:');
      console.log(`  Domain Layer:`);
      console.log(`    - Result types: ${layersCreated.domain.result_types}`);
      console.log(`    - Entities: ${layersCreated.domain.entities}`);
      console.log(`    - Repository interfaces: ${layersCreated.domain.repository_interfaces}`);
      console.log(`  Data Layer:`);
      console.log(`    - Parse models: ${layersCreated.data.parse_models}`);
      console.log(`    - Repository implementations: ${layersCreated.data.repository_implementations}`);
      console.log(`    - Validators: ${layersCreated.data.validators}`);
      console.log(`  Presentation Layer:`);
      console.log(`    - BLoC events: ${layersCreated.presentation.bloc_events}`);
      console.log(`    - BLoC states: ${layersCreated.presentation.bloc_states}`);
      console.log(`    - BLoC classes: ${layersCreated.presentation.bloc_classes}`);
      console.log(`    - UI screens: ${layersCreated.presentation.ui_screens}`);
      console.log('');

      return {
        files_generated: filesGenerated,
        layers_created: layersCreated,
        p5_status: p5Status
      };

    } catch (error) {
      throw new Error(`P5 code generation execution failed: ${error.message}`);
    }
  }
}

module.exports = ExecuteP5CodeGeneration;
