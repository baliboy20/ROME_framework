/**
 * /generate-complete-docker-setup skill (Tier 2)
 * Generates complete Docker setup orchestrating multiple config skills
 * Version: 1.0.0
 */

const path = require('path');

class GenerateCompleteDockerSetup {
  static async execute(params, executionId) {
    const { design_directory, output_directory, node_version = '18-alpine' } = params;

    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      const filesGenerated = [];

      console.log('Generating complete Docker setup...\n');

      // 1. Generate Docker configuration
      console.log('  1/3 Generating Docker config...');
      const dockerConfig = await invokeSkill('generate-docker-config', {
        design_directory,
        output_directory,
        node_version
      });
      filesGenerated.push(...dockerConfig.files_generated);
      console.log(`    ✅ ${dockerConfig.files_generated.length} files\n`);

      // 2. Generate Nginx configuration
      console.log('  2/3 Generating Nginx config...');
      const nginxConfig = await invokeSkill('generate-nginx-config', {
        design_directory,
        output_file: path.join(output_directory, 'nginx.conf')
      });
      filesGenerated.push('nginx.conf');
      console.log(`    ✅ Nginx configured\n`);

      // 3. Generate environment configuration
      console.log('  3/3 Generating environment config...');
      const envConfig = await invokeSkill('generate-env-config', {
        design_directory,
        output_directory
      });
      filesGenerated.push(...envConfig.files_generated);
      console.log(`    ✅ ${envConfig.files_generated.length} files\n`);

      console.log('Complete Docker setup generated\n');

      return {
        files_generated: filesGenerated,
        setup_complete: true
      };

    } catch (error) {
      throw new Error(`Complete Docker setup generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateCompleteDockerSetup;
