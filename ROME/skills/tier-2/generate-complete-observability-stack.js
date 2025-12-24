/**
 * /generate-complete-observability-stack skill (Tier 2)
 * Generates complete observability stack (logging + monitoring + security)
 * Version: 1.0.0
 */

class GenerateCompleteObservabilityStack {
  static async execute(params, executionId) {
    const { design_directory, output_directory } = params;

    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      const filesGenerated = [];
      let componentsConfigured = 0;

      console.log('Generating complete observability stack...\n');

      // 1. Generate logging configuration
      console.log('  1/3 Generating logging config...');
      const loggingConfig = await invokeSkill('generate-logging-config', {
        design_directory,
        output_directory,
        logger_library: 'winston'
      });
      filesGenerated.push(...loggingConfig.files_generated);
      componentsConfigured++;
      console.log(`    ✅ ${loggingConfig.files_generated.length} files\n`);

      // 2. Generate monitoring configuration
      console.log('  2/3 Generating monitoring config...');
      const monitoringConfig = await invokeSkill('generate-monitoring-config', {
        design_directory,
        output_directory
      });
      filesGenerated.push(...monitoringConfig.files_generated);
      componentsConfigured++;
      console.log(`    ✅ ${monitoringConfig.files_generated.length} files\n`);

      // 3. Generate security configuration
      console.log('  3/3 Generating security config...');
      const securityConfig = await invokeSkill('generate-security-config', {
        design_directory,
        output_directory
      });
      filesGenerated.push(...securityConfig.files_generated);
      componentsConfigured++;
      console.log(`    ✅ ${securityConfig.files_generated.length} files\n`);

      console.log('Complete observability stack generated\n');

      return {
        files_generated: filesGenerated,
        components_configured: componentsConfigured
      };

    } catch (error) {
      throw new Error(`Complete observability stack generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateCompleteObservabilityStack;
