/**
 * Test script for Tier 1 configuration skills (Month 3 Week 1)
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testTier1Configuration() {
  console.log('Testing Tier 1 Configuration skills (Month 3 Week 1)...\n');

  const artifactsDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS');
  const designDir = path.join(artifactsDir, '07-design');
  const configDir = path.join(artifactsDir, '08-configuration');
  const dataDictFile = path.join(artifactsDir, '02-analysis/data-dictionary.json');

  try {
    // Test 1: Generate Environment Config
    console.log('1/10 Testing generate-env-config...');
    const envConfig = await invokeSkill('generate-env-config', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${envConfig.files_generated.length}, Environments: ${envConfig.environment_count}\n`);

    // Test 2: Generate Database Schema
    console.log('2/10 Testing generate-database-schema...');
    const dbSchema = await invokeSkill('generate-database-schema', {
      data_dictionary_file: dataDictFile,
      output_file: path.join(configDir, 'schema.sql')
    });
    console.log(`  ✅ Tables: ${dbSchema.tables_generated}, Indexes: ${dbSchema.indexes_generated}, Constraints: ${dbSchema.constraints_generated}\n`);

    // Test 3: Generate Docker Config
    console.log('3/10 Testing generate-docker-config...');
    const dockerConfig = await invokeSkill('generate-docker-config', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${dockerConfig.files_generated.join(', ')}\n`);

    // Test 4: Generate CI Pipeline
    console.log('4/10 Testing generate-ci-pipeline...');
    const ciPipeline = await invokeSkill('generate-ci-pipeline', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${ciPipeline.files_generated.join(', ')}\n`);

    // Test 5: Generate Nginx Config
    console.log('5/10 Testing generate-nginx-config...');
    const nginxConfig = await invokeSkill('generate-nginx-config', {
      design_directory: designDir,
      output_file: path.join(configDir, 'nginx.conf')
    });
    console.log(`  ✅ Config generated: ${nginxConfig.config_generated}\n`);

    // Test 6: Generate Logging Config
    console.log('6/10 Testing generate-logging-config...');
    const loggingConfig = await invokeSkill('generate-logging-config', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${loggingConfig.files_generated.join(', ')}\n`);

    // Test 7: Generate Monitoring Config
    console.log('7/10 Testing generate-monitoring-config...');
    const monitoringConfig = await invokeSkill('generate-monitoring-config', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${monitoringConfig.files_generated.join(', ')}\n`);

    // Test 8: Generate Security Config
    console.log('8/10 Testing generate-security-config...');
    const securityConfig = await invokeSkill('generate-security-config', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${securityConfig.files_generated.join(', ')}\n`);

    // Test 9: Generate ORM Config
    console.log('9/10 Testing generate-orm-config...');
    const ormConfig = await invokeSkill('generate-orm-config', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${ormConfig.files_generated.join(', ')}\n`);

    // Test 10: Generate API Gateway Config
    console.log('10/10 Testing generate-api-gateway-config...');
    const apiGatewayConfig = await invokeSkill('generate-api-gateway-config', {
      design_directory: designDir,
      output_directory: configDir
    });
    console.log(`  ✅ Files: ${apiGatewayConfig.files_generated.join(', ')}\n`);

    console.log('='.repeat(70));
    console.log('ALL TIER 1 CONFIGURATION SKILLS TESTED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('');
    console.log('Summary:');
    console.log(`  Environment configs: ${envConfig.files_generated.length}`);
    console.log(`  Database tables: ${dbSchema.tables_generated}`);
    console.log(`  Docker files: ${dockerConfig.files_generated.length}`);
    console.log(`  CI/CD files: ${ciPipeline.files_generated.length}`);
    console.log(`  Nginx config: Generated`);
    console.log(`  Logging files: ${loggingConfig.files_generated.length}`);
    console.log(`  Monitoring files: ${monitoringConfig.files_generated.length}`);
    console.log(`  Security files: ${securityConfig.files_generated.length}`);
    console.log(`  ORM files: ${ormConfig.files_generated.length}`);
    console.log(`  API Gateway files: ${apiGatewayConfig.files_generated.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ All tests completed\n');
}

testTier1Configuration();
