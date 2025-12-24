/**
 * Test script for /generate-full-api-spec skill (Tier 2)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testGenerateFullAPISpec() {
  console.log('Testing /generate-full-api-spec skill (Tier 2)...\n');

  const requirementsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/01-requirements'
  );

  const outputFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/05-api-specs/unified-api-spec.yaml'
  );

  console.log('='.repeat(70));
  console.log('Generating Unified OpenAPI Specification');
  console.log('='.repeat(70));
  console.log('');

  try {
    const result = await invokeSkill('generate-full-api-spec', {
      requirements_directory: requirementsDir,
      output_file: outputFile,
      api_version: '1.0.0',
      api_title: 'Project Management API',
      api_description: 'Complete API for Project Management System generated from AORDL requirements',
      base_path: '/api/v1',
      group_by_resource: true
    });

    console.log('\n' + '='.repeat(70));
    console.log('Unified API Spec Generated');
    console.log('='.repeat(70));
    console.log('');
    console.log(`📊 Statistics:`);
    console.log(`  Total Endpoints: ${result.endpoint_count}`);
    console.log(`  Unique Resources: ${result.resource_count}`);
    console.log(`  Total Schemas: ${Object.keys(result.openapi_spec.components.schemas).length}`);
    console.log('');
    console.log(`🏷️  Resource Tags:`);
    if (result.openapi_spec.tags) {
      result.openapi_spec.tags.forEach(tag => {
        console.log(`  - ${tag.name}`);
      });
    }
    console.log('');
    console.log(`📍 Sample Endpoints:`);
    const paths = Object.keys(result.openapi_spec.paths).slice(0, 10);
    paths.forEach(path => {
      const methods = Object.keys(result.openapi_spec.paths[path]);
      methods.forEach(method => {
        console.log(`  ${method.toUpperCase()} ${path}`);
      });
    });
    if (Object.keys(result.openapi_spec.paths).length > 10) {
      console.log(`  ... and ${Object.keys(result.openapi_spec.paths).length - 10} more`);
    }
    console.log('');
    console.log(`✅ Unified OpenAPI spec written to:`);
    console.log(`   ${outputFile}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testGenerateFullAPISpec();
