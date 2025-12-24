/**
 * /execute-full-design-pipeline skill (Tier 3)
 * Executes complete P1→P2→P3 design pipeline with validation
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ExecuteFullDesignPipeline {
  static async execute(params, executionId) {
    const { requirements_directory, artifacts_directory, strict_validation = true } = params;

    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 EXECUTING COMPLETE P1→P2→P3 DESIGN PIPELINE');
      console.log('='.repeat(70));
      console.log('');

      const phasesCompleted = [];
      let totalArtifacts = 0;

      // PHASE 1: P2 Analysis
      console.log('Phase 1/3: P2 Analysis\n');
      const p2Result = await invokeSkill('execute-p2-analysis', {
        requirements_directory,
        artifacts_directory
      });
      phasesCompleted.push('P2_ANALYSIS');
      totalArtifacts += 5;
      console.log(`  ✅ P2 Analysis completed\n`);

      // PHASE 2: P3 Design
      console.log('Phase 2/3: P3 Design\n');
      const designDir = path.join(artifacts_directory, '07-design');
      const p3Result = await invokeSkill('execute-p3-design', {
        artifacts_directory,
        design_output_directory: designDir
      });
      phasesCompleted.push('P3_DESIGN');
      totalArtifacts += p3Result.artifacts_generated;
      console.log(`  ✅ P3 Design completed\n`);

      // PHASE 3: Validation & Analysis
      console.log('Phase 3/3: Validation & Analysis\n');

      // Architecture validation
      console.log('  Running architecture validation...');
      const archValidation = await invokeSkill('validate-architecture', {
        design_directory: designDir,
        output_file: path.join(designDir, 'architecture-validation.json')
      });
      console.log(`    ✅ Score: ${archValidation.best_practices_score}/100\n`);

      // Scalability analysis
      console.log('  Running scalability analysis...');
      const scalability = await invokeSkill('analyze-scalability', {
        design_directory: designDir,
        output_file: path.join(designDir, 'scalability-analysis.json')
      });
      console.log(`    ✅ Score: ${scalability.scalability_score}/100\n`);

      // Generate documentation
      console.log('  Generating architecture documentation...');
      const techStack = await invokeSkill('generate-tech-stack-spec', {
        design_directory: designDir,
        output_file: path.join(designDir, 'tech-stack.json')
      });
      console.log(`    ✅ Tech stack: ${techStack.components_count} components\n`);

      const adr = await invokeSkill('generate-architecture-doc', {
        design_directory: designDir,
        output_file: path.join(designDir, 'ADR.md')
      });
      console.log(`    ✅ ADRs: ${adr.adr_count} decisions documented\n`);

      phasesCompleted.push('VALIDATION_ANALYSIS');
      totalArtifacts += 4;

      const pipelineStatus = archValidation.best_practices_score >= 80 ? 'SUCCESS' : 'SUCCESS_WITH_WARNINGS';

      console.log('');
      console.log('='.repeat(70));
      console.log('COMPLETE DESIGN PIPELINE EXECUTED');
      console.log('='.repeat(70));
      console.log(`Status: ${pipelineStatus}`);
      console.log(`Phases: ${phasesCompleted.length}/3`);
      console.log(`Total Artifacts: ${totalArtifacts}`);
      console.log(`Architecture Score: ${archValidation.best_practices_score}/100`);
      console.log(`Scalability Score: ${scalability.scalability_score}/100`);
      console.log('');

      return {
        pipeline_status: pipelineStatus,
        phases_completed: phasesCompleted,
        total_artifacts: totalArtifacts,
        validation_results: {
          architecture_score: archValidation.best_practices_score,
          scalability_score: scalability.scalability_score,
          issues_found: archValidation.issues_found.length,
          bottlenecks: scalability.bottlenecks.length
        }
      };

    } catch (error) {
      throw new Error(`Full design pipeline execution failed: ${error.message}`);
    }
  }
}

module.exports = ExecuteFullDesignPipeline;
