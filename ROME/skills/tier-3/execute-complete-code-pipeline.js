/**
 * /execute-complete-code-pipeline skill (Tier 3)
 * Executes complete P1→P2→P3→P4→P5 code generation pipeline
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class ExecuteCompleteCodePipeline {
  static async execute(params, executionId) {
    const { requirements_directory, artifacts_directory } = params;

    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 EXECUTING COMPLETE P1→P2→P3→P4→P5 PIPELINE');
      console.log('='.repeat(70));
      console.log('');

      const phasesCompleted = [];
      let totalFiles = 0;

      const codeOutputDir = path.join(artifacts_directory, '09-code-generation');
      fs.mkdirSync(codeOutputDir, { recursive: true });

      // PHASE 1: P2 Analysis (reuse existing)
      console.log('Phase 1/5: P2 Analysis\n');
      const p2Result = await invokeSkill('execute-p2-analysis', {
        requirements_directory,
        artifacts_directory
      });
      phasesCompleted.push('P2_ANALYSIS');
      totalFiles += 5;
      console.log(`  ✅ P2 Analysis completed\n`);

      // PHASE 2: P3 Design (reuse existing)
      console.log('Phase 2/5: P3 Design\n');
      const designDir = path.join(artifacts_directory, '07-design');
      const p3Result = await invokeSkill('execute-p3-design', {
        artifacts_directory,
        design_output_directory: designDir
      });
      phasesCompleted.push('P3_DESIGN');
      totalFiles += p3Result.artifacts_generated;
      console.log(`  ✅ P3 Design completed\n`);

      // PHASE 3: P4 Configuration (reuse existing)
      console.log('Phase 3/5: P4 Configuration\n');
      const configDir = path.join(artifacts_directory, '08-configuration');
      const p4Result = await invokeSkill('execute-p4-configuration', {
        artifacts_directory,
        config_output_directory: configDir
      });
      phasesCompleted.push('P4_CONFIGURATION');
      totalFiles += p4Result.files_generated;
      console.log(`  ✅ P4 Configuration completed\n`);

      // PHASE 4: P5 Code Generation (NEW!)
      console.log('Phase 4/5: P5 Code Generation\n');
      const p5Result = await invokeSkill('execute-p5-code-generation', {
        design_directory: designDir,
        code_output_directory: codeOutputDir
      });
      phasesCompleted.push('P5_CODE_GENERATION');
      totalFiles += p5Result.files_generated.length;
      console.log(`  ✅ P5 Code Generation completed\n`);

      // PHASE 5: Validation & Enhancement
      console.log('Phase 5/5: Validation & Enhancement\n');

      // Code validation
      console.log('  Running code validation...');
      const codeValidation = await invokeSkill('validate-code-generation', {
        code_directory: codeOutputDir,
        output_file: path.join(codeOutputDir, 'code-validation.json')
      });
      console.log(`    ✅ Status: ${codeValidation.validation_status}, Quality: ${codeValidation.quality_score}/100\n`);

      // Code optimization
      console.log('  Running code optimization analysis...');
      const optimization = await invokeSkill('optimize-code-structure', {
        code_directory: codeOutputDir,
        output_file: path.join(codeOutputDir, 'optimization-report.json')
      });
      console.log(`    ✅ Score: ${optimization.optimization_score}/100, Recommendations: ${optimization.recommendations.length}\n`);

      // Generate DI setup
      console.log('  Generating dependency injection...');
      const diSetup = await invokeSkill('generate-dependency-injection', {
        code_directory: codeOutputDir,
        output_file: path.join(codeOutputDir, 'injection.dart')
      });
      console.log(`    ✅ Dependencies: ${diSetup.dependencies_registered}\n`);
      totalFiles += 1;

      // Generate routing
      console.log('  Generating routing configuration...');
      const routing = await invokeSkill('generate-routing-config', {
        code_directory: codeOutputDir,
        output_file: path.join(codeOutputDir, 'router.dart')
      });
      console.log(`    ✅ Routes: ${routing.routes_created}\n`);
      totalFiles += 1;

      phasesCompleted.push('VALIDATION_ENHANCEMENT');
      totalFiles += 2; // validation and optimization reports

      const pipelineStatus = codeValidation.validation_status === 'PASS' &&
                            optimization.optimization_score >= 70 ? 'SUCCESS' : 'SUCCESS_WITH_WARNINGS';

      console.log('');
      console.log('='.repeat(70));
      console.log('COMPLETE P1→P2→P3→P4→P5 PIPELINE EXECUTED');
      console.log('='.repeat(70));
      console.log(`Status: ${pipelineStatus}`);
      console.log(`Phases: ${phasesCompleted.length}/5`);
      console.log(`Total Files: ${totalFiles}`);
      console.log(`Code Quality Score: ${codeValidation.quality_score}/100`);
      console.log(`Code Optimization Score: ${optimization.optimization_score}/100`);
      console.log('');

      return {
        pipeline_status: pipelineStatus,
        phases_completed: phasesCompleted,
        total_files: totalFiles,
        validation_results: {
          code_validation_status: codeValidation.validation_status,
          quality_score: codeValidation.quality_score,
          pattern_score: codeValidation.pattern_score,
          optimization_score: optimization.optimization_score,
          issues_found: codeValidation.issues_found.length,
          recommendations: optimization.recommendations.length,
          dependencies_registered: diSetup.dependencies_registered,
          routes_created: routing.routes_created
        }
      };

    } catch (error) {
      throw new Error(`Complete code pipeline execution failed: ${error.message}`);
    }
  }
}

module.exports = ExecuteCompleteCodePipeline;
