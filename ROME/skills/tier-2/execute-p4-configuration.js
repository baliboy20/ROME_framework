/**
 * /execute-p4-configuration skill (Tier 2)
 * Executes complete P4 configuration phase (all 10 Tier 1 skills)
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class ExecuteP4Configuration {
  static async execute(params, executionId) {
    const { artifacts_directory, config_output_directory } = params;

    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🔧 EXECUTING P4 CONFIGURATION PHASE');
      console.log('='.repeat(70));
      console.log('');

      // Ensure output directory exists
      fs.mkdirSync(config_output_directory, { recursive: true });

      const configArtifacts = {};
      let totalFilesGenerated = 0;

      const designDir = path.join(artifacts_directory, '07-design');
      const dataDictFile = path.join(artifacts_directory, '02-analysis/data-dictionary.json');

      // 1. Generate Environment Configuration
      console.log('1/10 Generating environment configuration...');
      configArtifacts.envConfig = await invokeSkill('generate-env-config', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.envConfig.files_generated.length;
      console.log(`  ✅ ${configArtifacts.envConfig.files_generated.length} files\n`);

      // 2. Generate Database Schema
      console.log('2/10 Generating database schema...');
      configArtifacts.databaseSchema = await invokeSkill('generate-database-schema', {
        data_dictionary_file: dataDictFile,
        output_file: path.join(config_output_directory, 'schema.sql')
      });
      totalFilesGenerated++;
      console.log(`  ✅ ${configArtifacts.databaseSchema.tables_generated} tables\n`);

      // 3. Generate Docker Configuration
      console.log('3/10 Generating Docker configuration...');
      configArtifacts.dockerConfig = await invokeSkill('generate-docker-config', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.dockerConfig.files_generated.length;
      console.log(`  ✅ ${configArtifacts.dockerConfig.files_generated.length} files\n`);

      // 4. Generate CI Pipeline
      console.log('4/10 Generating CI/CD pipeline...');
      configArtifacts.ciPipeline = await invokeSkill('generate-ci-pipeline', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.ciPipeline.files_generated.length;
      console.log(`  ✅ ${configArtifacts.ciPipeline.files_generated.length} files\n`);

      // 5. Generate Nginx Configuration
      console.log('5/10 Generating Nginx configuration...');
      configArtifacts.nginxConfig = await invokeSkill('generate-nginx-config', {
        design_directory: designDir,
        output_file: path.join(config_output_directory, 'nginx.conf')
      });
      totalFilesGenerated++;
      console.log(`  ✅ Nginx configured\n`);

      // 6. Generate Logging Configuration
      console.log('6/10 Generating logging configuration...');
      configArtifacts.loggingConfig = await invokeSkill('generate-logging-config', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.loggingConfig.files_generated.length;
      console.log(`  ✅ ${configArtifacts.loggingConfig.files_generated.length} files\n`);

      // 7. Generate Monitoring Configuration
      console.log('7/10 Generating monitoring configuration...');
      configArtifacts.monitoringConfig = await invokeSkill('generate-monitoring-config', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.monitoringConfig.files_generated.length;
      console.log(`  ✅ ${configArtifacts.monitoringConfig.files_generated.length} files\n`);

      // 8. Generate Security Configuration
      console.log('8/10 Generating security configuration...');
      configArtifacts.securityConfig = await invokeSkill('generate-security-config', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.securityConfig.files_generated.length;
      console.log(`  ✅ ${configArtifacts.securityConfig.files_generated.length} files\n`);

      // 9. Generate ORM Configuration
      console.log('9/10 Generating ORM configuration...');
      configArtifacts.ormConfig = await invokeSkill('generate-orm-config', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.ormConfig.files_generated.length;
      console.log(`  ✅ ${configArtifacts.ormConfig.files_generated.length} files\n`);

      // 10. Generate API Gateway Configuration
      console.log('10/10 Generating API Gateway configuration...');
      configArtifacts.apiGatewayConfig = await invokeSkill('generate-api-gateway-config', {
        design_directory: designDir,
        output_directory: config_output_directory
      });
      totalFilesGenerated += configArtifacts.apiGatewayConfig.files_generated.length;
      console.log(`  ✅ ${configArtifacts.apiGatewayConfig.files_generated.length} files\n`);

      console.log('');
      console.log('='.repeat(70));
      console.log('P4 CONFIGURATION PHASE COMPLETED');
      console.log('='.repeat(70));
      console.log(`Total files generated: ${totalFilesGenerated}`);
      console.log('');

      return {
        phase_status: 'SUCCESS',
        files_generated: totalFilesGenerated,
        config_artifacts: {
          environments: configArtifacts.envConfig.environment_count,
          database_tables: configArtifacts.databaseSchema.tables_generated,
          docker_files: configArtifacts.dockerConfig.files_generated.length,
          total_files: totalFilesGenerated
        }
      };

    } catch (error) {
      throw new Error(`P4 configuration execution failed: ${error.message}`);
    }
  }
}

module.exports = ExecuteP4Configuration;
