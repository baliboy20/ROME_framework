/**
 * /generate-complete-presentation-layer skill (Tier 2)
 * Generates complete presentation layer (BLoC + UI screens)
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateCompletePresentationLayer {
  static async execute(params, executionId) {
    const { design_directory, output_directory, entities } = params;

    // Lazy load to avoid circular dependencies
    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🎨 GENERATING COMPLETE PRESENTATION LAYER');
      console.log('='.repeat(70));
      console.log('');

      const filesGenerated = [];
      const componentsCreated = {
        bloc_events: 0,
        bloc_states: 0,
        bloc_classes: 0,
        ui_screens: 0
      };

      // Create presentation layer directories
      const presentationDir = output_directory;
      const blocDir = path.join(presentationDir, 'bloc');
      const screensDir = path.join(presentationDir, 'screens');

      fs.mkdirSync(blocDir, { recursive: true });
      fs.mkdirSync(screensDir, { recursive: true });

      // Step 1: Generate BLoC events
      console.log('1/4 Generating BLoC events...');
      const blocEvents = await invokeSkill('generate-bloc-events', {
        design_directory,
        output_directory: blocDir,
        entities
      });
      filesGenerated.push(...blocEvents.files_generated.map(f => `bloc/${f}`));
      componentsCreated.bloc_events = blocEvents.events_created;
      console.log(`  ✅ BLoC events: ${blocEvents.events_created}\n`);

      // Step 2: Generate BLoC states
      console.log('2/4 Generating BLoC states...');
      const blocStates = await invokeSkill('generate-bloc-states', {
        design_directory,
        output_directory: blocDir,
        entities
      });
      filesGenerated.push(...blocStates.files_generated.map(f => `bloc/${f}`));
      componentsCreated.bloc_states = blocStates.states_created;
      console.log(`  ✅ BLoC states: ${blocStates.states_created}\n`);

      // Step 3: Generate BLoC classes
      console.log('3/4 Generating BLoC classes...');
      const blocs = await invokeSkill('generate-bloc-classes', {
        design_directory,
        output_directory: blocDir,
        entities
      });
      filesGenerated.push(...blocs.files_generated.map(f => `bloc/${f}`));
      componentsCreated.bloc_classes = blocs.blocs_created;
      console.log(`  ✅ BLoC classes: ${blocs.blocs_created}\n`);

      // Step 4: Generate UI screens
      console.log('4/4 Generating UI screens...');
      const uiScreens = await invokeSkill('generate-ui-screens', {
        design_directory,
        output_directory: screensDir,
        entities
      });
      filesGenerated.push(...uiScreens.files_generated.map(f => `screens/${f}`));
      componentsCreated.ui_screens = uiScreens.screens_created;
      console.log(`  ✅ UI screens: ${uiScreens.screens_created}\n`);

      console.log('='.repeat(70));
      console.log('PRESENTATION LAYER GENERATION COMPLETE');
      console.log('='.repeat(70));
      console.log(`Total files: ${filesGenerated.length}`);
      console.log('');

      return {
        files_generated: filesGenerated,
        components_created: componentsCreated
      };

    } catch (error) {
      throw new Error(`Complete presentation layer generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateCompletePresentationLayer;
