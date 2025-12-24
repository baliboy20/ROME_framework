/**
 * Test script for /generate-api-spec skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testGenerateAPISpec() {
  console.log('Testing /generate-api-spec skill...\n');

  const testRequirements = ['REQ-001', 'REQ-002'];

  // Create API specs directory
  const apiSpecsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS/05-api-specs');
  if (!fs.existsSync(apiSpecsDir)) {
    fs.mkdirSync(apiSpecsDir, { recursive: true });
  }

  for (const reqId of testRequirements) {
    console.log('='.repeat(70));
    console.log(`Generating OpenAPI spec for ${reqId}`);
    console.log('='.repeat(70));

    const requirementFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/01-requirements',
      `${reqId}.yaml`
    );

    const outputFile = path.join(apiSpecsDir, `${reqId}-api-spec.yaml`);

    try {
      const result = await invokeSkill('generate-api-spec', {
        requirement_file: requirementFile,
        output_file: outputFile,
        api_version: '1.0.0',
        base_path: '/api/v1'
      });

      console.log(`\n📝 OpenAPI Spec Generated\n`);
      console.log(`Endpoint: ${result.endpoint_path}`);
      console.log(`\nSpec Preview:\n`);

      const spec = result.openapi_spec;
      console.log(`OpenAPI: ${spec.openapi}`);
      console.log(`Title: ${spec.info.title}`);
      console.log(`Version: ${spec.info.version}`);
      console.log(`\nPaths:`);
      Object.keys(spec.paths).forEach(path => {
        const methods = Object.keys(spec.paths[path]);
        console.log(`  ${path}:`);
        methods.forEach(method => {
          const operation = spec.paths[path][method];
          console.log(`    ${method.toUpperCase()}: ${operation.summary}`);
          console.log(`      Responses: ${Object.keys(operation.responses).join(', ')}`);
        });
      });

      console.log(`\nSchemas: ${Object.keys(spec.components.schemas).join(', ')}`);

      console.log(`\n✅ OpenAPI spec written to: ${outputFile}\n`);

    } catch (error) {
      console.error(`❌ Test failed for ${reqId}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log('✅ All tests completed\n');
}

testGenerateAPISpec();
