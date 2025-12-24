/**
 * Test script for all Tier 1 design skills
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testAllTier1DesignSkills() {
  console.log('Testing all Tier 1 Design skills...\n');

  const dataDictFile = path.join(__dirname, '../../ROME_architect/ARTIFACTS/02-analysis/data-dictionary.json');
  const apiSpecFile = path.join(__dirname, '../../ROME_architect/ARTIFACTS/05-api-specs/unified-api-spec.yaml');
  const designDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS/07-design');

  // Ensure design directory exists
  if (!fs.existsSync(designDir)) {
    fs.mkdirSync(designDir, { recursive: true });
  }

  const results = {};

  try {
    // 1. Component Structure (already tested)
    console.log('1/10 Testing design-component-structure...');
    results.componentStructure = await invokeSkill('design-component-structure', {
      data_dictionary_file: dataDictFile,
      output_file: path.join(designDir, 'component-structure.json')
    });
    console.log(`  ✅ ${results.componentStructure.components_designed} components designed\n`);

    // 2. API Controllers
    console.log('2/10 Testing design-api-controllers...');
    results.apiControllers = await invokeSkill('design-api-controllers', {
      api_spec_file: apiSpecFile,
      output_file: path.join(designDir, 'api-controllers.json')
    });
    console.log(`  ✅ ${results.apiControllers.controllers_designed} controllers designed\n`);

    // 3. Service Layer
    console.log('3/10 Testing design-service-layer...');
    results.serviceLayer = await invokeSkill('design-service-layer', {
      data_dictionary_file: dataDictFile,
      output_file: path.join(designDir, 'service-layer.json')
    });
    console.log(`  ✅ ${results.serviceLayer.services_designed} services designed\n`);

    // 4. Repository Layer
    console.log('4/10 Testing design-repository-layer...');
    results.repositoryLayer = await invokeSkill('design-repository-layer', {
      data_dictionary_file: dataDictFile,
      output_file: path.join(designDir, 'repository-layer.json')
    });
    console.log(`  ✅ ${results.repositoryLayer.repositories_designed} repositories designed\n`);

    // 5. DTO Models
    console.log('5/10 Testing design-dto-models...');
    results.dtoModels = await invokeSkill('design-dto-models', {
      data_dictionary_file: dataDictFile,
      output_file: path.join(designDir, 'dto-models.json')
    });
    console.log(`  ✅ ${results.dtoModels.dtos_designed} DTOs designed\n`);

    // 6. Authentication
    console.log('6/10 Testing design-authentication...');
    results.authentication = await invokeSkill('design-authentication', {
      api_spec_file: apiSpecFile,
      output_file: path.join(designDir, 'authentication.json')
    });
    console.log(`  ✅ ${results.authentication.auth_components} auth components designed\n`);

    // 7. Validation Layer
    console.log('7/10 Testing design-validation-layer...');
    results.validationLayer = await invokeSkill('design-validation-layer', {
      data_dictionary_file: dataDictFile,
      output_file: path.join(designDir, 'validation-layer.json')
    });
    console.log(`  ✅ ${results.validationLayer.validators_designed} validators designed\n`);

    // 8. Error Handling
    console.log('8/10 Testing design-error-handling...');
    results.errorHandling = await invokeSkill('design-error-handling', {
      output_file: path.join(designDir, 'error-handling.json')
    });
    console.log(`  ✅ ${results.errorHandling.error_types} error types designed\n`);

    // 9. Logging Strategy
    console.log('9/10 Testing design-logging-strategy...');
    results.loggingStrategy = await invokeSkill('design-logging-strategy', {
      output_file: path.join(designDir, 'logging-strategy.json')
    });
    console.log(`  ✅ ${results.loggingStrategy.logging_components} logging components designed\n`);

    // 10. Testing Structure
    console.log('10/10 Testing design-testing-structure...');
    results.testingStructure = await invokeSkill('design-testing-structure', {
      data_dictionary_file: dataDictFile,
      output_file: path.join(designDir, 'testing-structure.json')
    });
    console.log(`  ✅ ${results.testingStructure.test_suites} test suites designed\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 1 DESIGN SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Components: ${results.componentStructure.components_designed}`);
    console.log(`  Controllers: ${results.apiControllers.controllers_designed}`);
    console.log(`  Services: ${results.serviceLayer.services_designed}`);
    console.log(`  Repositories: ${results.repositoryLayer.repositories_designed}`);
    console.log(`  DTOs: ${results.dtoModels.dtos_designed}`);
    console.log(`  Auth Components: ${results.authentication.auth_components}`);
    console.log(`  Validators: ${results.validationLayer.validators_designed}`);
    console.log(`  Error Types: ${results.errorHandling.error_types}`);
    console.log(`  Logging Components: ${results.loggingStrategy.logging_components}`);
    console.log(`  Test Suites: ${results.testingStructure.test_suites}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testAllTier1DesignSkills();
