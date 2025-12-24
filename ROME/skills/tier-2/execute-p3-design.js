/**
 * /execute-p3-design skill (Tier 2)
 * Executes complete P3 design phase pipeline
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ExecuteP3Design {
  static async execute(params, executionId) {
    const { artifacts_directory, design_output_directory = null } = params;

    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🏗️  EXECUTING P3 DESIGN PHASE');
      console.log('='.repeat(70));
      console.log('');

      const designDir = design_output_directory || path.join(artifacts_directory, '07-design');
      if (!fs.existsSync(designDir)) {
        fs.mkdirSync(designDir, { recursive: true });
      }

      const dataDictFile = path.join(artifacts_directory, '02-analysis/data-dictionary.json');
      const apiSpecFile = path.join(artifacts_directory, '05-api-specs/unified-api-spec.yaml');

      let artifactsGenerated = 0;
      const designSpecs = {};

      // Step 1: Component Structure
      console.log('Step 1/10: Designing Component Structure...');
      designSpecs.componentStructure = await invokeSkill('design-component-structure', {
        data_dictionary_file: dataDictFile,
        output_file: path.join(designDir, 'component-structure.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.componentStructure.components_designed} components designed\n`);

      // Step 2: API Controllers
      console.log('Step 2/10: Designing API Controllers...');
      designSpecs.apiControllers = await invokeSkill('design-api-controllers', {
        api_spec_file: apiSpecFile,
        output_file: path.join(designDir, 'api-controllers.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.apiControllers.controllers_designed} controllers designed\n`);

      // Step 3: Service Layer
      console.log('Step 3/10: Designing Service Layer...');
      designSpecs.serviceLayer = await invokeSkill('design-service-layer', {
        data_dictionary_file: dataDictFile,
        output_file: path.join(designDir, 'service-layer.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.serviceLayer.services_designed} services designed\n`);

      // Step 4: Repository Layer
      console.log('Step 4/10: Designing Repository Layer...');
      designSpecs.repositoryLayer = await invokeSkill('design-repository-layer', {
        data_dictionary_file: dataDictFile,
        output_file: path.join(designDir, 'repository-layer.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.repositoryLayer.repositories_designed} repositories designed\n`);

      // Step 5: DTO Models
      console.log('Step 5/10: Designing DTO Models...');
      designSpecs.dtoModels = await invokeSkill('design-dto-models', {
        data_dictionary_file: dataDictFile,
        output_file: path.join(designDir, 'dto-models.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.dtoModels.dtos_designed} DTOs designed\n`);

      // Step 6: Authentication
      console.log('Step 6/10: Designing Authentication...');
      designSpecs.authentication = await invokeSkill('design-authentication', {
        api_spec_file: apiSpecFile,
        output_file: path.join(designDir, 'authentication.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.authentication.auth_components} auth components designed\n`);

      // Step 7: Validation Layer
      console.log('Step 7/10: Designing Validation Layer...');
      designSpecs.validationLayer = await invokeSkill('design-validation-layer', {
        data_dictionary_file: dataDictFile,
        output_file: path.join(designDir, 'validation-layer.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.validationLayer.validators_designed} validators designed\n`);

      // Step 8: Error Handling
      console.log('Step 8/10: Designing Error Handling...');
      designSpecs.errorHandling = await invokeSkill('design-error-handling', {
        output_file: path.join(designDir, 'error-handling.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.errorHandling.error_types} error types designed\n`);

      // Step 9: Logging Strategy
      console.log('Step 9/10: Designing Logging Strategy...');
      designSpecs.loggingStrategy = await invokeSkill('design-logging-strategy', {
        output_file: path.join(designDir, 'logging-strategy.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.loggingStrategy.logging_components} logging components designed\n`);

      // Step 10: Testing Structure
      console.log('Step 10/10: Designing Testing Structure...');
      designSpecs.testingStructure = await invokeSkill('design-testing-structure', {
        data_dictionary_file: dataDictFile,
        output_file: path.join(designDir, 'testing-structure.json')
      });
      artifactsGenerated++;
      console.log(`  ✅ ${designSpecs.testingStructure.test_suites} test suites designed\n`);

      console.log('');
      console.log('='.repeat(70));
      console.log('P3 DESIGN PHASE COMPLETE');
      console.log('='.repeat(70));
      console.log(`Artifacts Generated: ${artifactsGenerated}`);
      console.log('');

      return {
        design_status: 'SUCCESS',
        artifacts_generated: artifactsGenerated,
        design_specs: designSpecs
      };

    } catch (error) {
      throw new Error(`P3 design execution failed: ${error.message}`);
    }
  }
}

module.exports = ExecuteP3Design;
