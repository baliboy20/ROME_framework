/**
 * /execute-full-pipeline skill (Tier 3)
 *
 * Executes complete P1→P2→P3 pipeline orchestration.
 *
 * Phases:
 * 1. P2 Analysis - Batch analysis and artifact generation
 * 2. Validation - Cross-artifact validation
 * 3. Optimization - Data model optimization
 * 4. Dependency Analysis - Requirement dependency analysis
 * 5. Documentation - Project summary and deployment guide
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ExecuteFullPipeline {
  static async execute(params, executionId) {
    const {
      requirements_directory,
      artifacts_directory,
      validate_artifacts = true,
      optimize_data_model = true,
      analyze_dependencies = true,
      generate_deployment_guide = true,
      strict_validation = true
    } = params;

    // Lazy load to avoid circular dependency
    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 EXECUTING FULL PIPELINE');
      console.log('='.repeat(70));
      console.log('');

      const phasesCompleted = [];
      const phaseResults = {};
      let totalArtifacts = 0;

      // Ensure artifacts directory exists
      if (!fs.existsSync(artifacts_directory)) {
        fs.mkdirSync(artifacts_directory, { recursive: true });
      }

      // Phase 1: P2 Analysis
      console.log('Phase 1/5: P2 Analysis\n');
      console.log('  Running batch analysis and artifact generation...');

      try {
        const p2Result = await invokeSkill('execute-p2-analysis', {
          requirements_directory,
          artifacts_directory
        });

        phasesCompleted.push('P2_ANALYSIS');
        phaseResults.p2_analysis = {
          status: 'SUCCESS',
          artifacts_generated: p2Result.artifacts_generated || 0
        };
        totalArtifacts += p2Result.artifacts_generated || 0;
        console.log(`  ✅ P2 Analysis completed (${p2Result.artifacts_generated} artifacts)\n`);
      } catch (error) {
        console.log(`  ❌ P2 Analysis failed: ${error.message}\n`);
        phaseResults.p2_analysis = {
          status: 'FAILED',
          error: error.message
        };
      }

      // Phase 2: Validation
      if (validate_artifacts) {
        console.log('Phase 2/5: Artifact Validation\n');
        console.log('  Running cross-artifact validation...');

        try {
          const validationResult = await invokeSkill('validate-artifacts', {
            artifacts_directory,
            strict_mode: strict_validation,
            check_all: true
          });

          phasesCompleted.push('VALIDATION');
          phaseResults.validation = {
            status: validationResult.validation_status,
            checks_run: validationResult.checks_run,
            issues_found: validationResult.issues_found.length
          };
          console.log(`  ✅ Validation completed: ${validationResult.validation_status}\n`);
        } catch (error) {
          console.log(`  ❌ Validation failed: ${error.message}\n`);
          phaseResults.validation = {
            status: 'FAILED',
            error: error.message
          };
        }
      }

      // Phase 3: Optimization
      if (optimize_data_model) {
        console.log('Phase 3/5: Data Model Optimization\n');
        console.log('  Analyzing data model for optimization opportunities...');

        try {
          const dataDictPath = path.join(artifacts_directory, '02-analysis/data-dictionary.json');

          if (fs.existsSync(dataDictPath)) {
            const optimizationResult = await invokeSkill('optimize-data-model', {
              data_dictionary_file: dataDictPath,
              check_normalization: true,
              check_naming: true,
              suggest_consolidation: true
            });

            phasesCompleted.push('OPTIMIZATION');
            phaseResults.optimization = {
              status: optimizationResult.optimization_status,
              optimization_score: optimizationResult.metrics.optimization_score,
              issues_found: optimizationResult.issues_found.length,
              recommendations: optimizationResult.recommendations.length
            };
            console.log(`  ✅ Optimization completed (score: ${optimizationResult.metrics.optimization_score}/100)\n`);
          } else {
            console.log('  ⚠️  Data dictionary not found, skipping optimization\n');
          }
        } catch (error) {
          console.log(`  ❌ Optimization failed: ${error.message}\n`);
          phaseResults.optimization = {
            status: 'FAILED',
            error: error.message
          };
        }
      }

      // Phase 4: Dependency Analysis
      if (analyze_dependencies) {
        console.log('Phase 4/5: Dependency Analysis\n');
        console.log('  Analyzing requirement dependencies...');

        try {
          const dependencyResult = await invokeSkill('analyze-dependencies', {
            requirements_directory,
            detect_circular: true,
            suggest_order: true
          });

          phasesCompleted.push('DEPENDENCY_ANALYSIS');
          phaseResults.dependency_analysis = {
            status: dependencyResult.dependency_status,
            total_dependencies: dependencyResult.total_dependencies,
            circular_dependencies: dependencyResult.circular_dependencies.length,
            implementation_order_length: dependencyResult.implementation_order.length
          };
          console.log(`  ✅ Dependency analysis completed: ${dependencyResult.dependency_status}\n`);
        } catch (error) {
          console.log(`  ❌ Dependency analysis failed: ${error.message}\n`);
          phaseResults.dependency_analysis = {
            status: 'FAILED',
            error: error.message
          };
        }
      }

      // Phase 5: Documentation
      console.log('Phase 5/5: Documentation Generation\n');

      // Generate project summary
      console.log('  Generating project summary...');
      try {
        const summaryResult = await invokeSkill('generate-project-summary', {
          artifacts_directory,
          output_file: path.join(artifacts_directory, 'PROJECT-SUMMARY.md'),
          output_format: 'markdown',
          project_name: 'Project Management System'
        });

        console.log('  ✅ Project summary generated\n');
        totalArtifacts++;
      } catch (error) {
        console.log(`  ⚠️  Project summary generation failed: ${error.message}\n`);
      }

      // Generate deployment guide
      if (generate_deployment_guide) {
        console.log('  Generating deployment guide...');
        try {
          const guideResult = await invokeSkill('generate-deployment-guide', {
            artifacts_directory,
            output_file: path.join(artifacts_directory, 'DEPLOYMENT-GUIDE.md'),
            output_format: 'markdown',
            include_diagrams: true,
            deployment_target: 'cloud'
          });

          phasesCompleted.push('DOCUMENTATION');
          phaseResults.documentation = {
            status: 'SUCCESS',
            sections_generated: guideResult.sections_generated
          };
          console.log('  ✅ Deployment guide generated\n');
          totalArtifacts++;
        } catch (error) {
          console.log(`  ⚠️  Deployment guide generation failed: ${error.message}\n`);
        }
      }

      // Determine overall pipeline status
      let pipelineStatus;
      if (phasesCompleted.length === 5) {
        pipelineStatus = 'SUCCESS';
      } else if (phasesCompleted.length > 0) {
        pipelineStatus = 'PARTIAL_SUCCESS';
      } else {
        pipelineStatus = 'FAILED';
      }

      // Generate pipeline summary
      console.log('');
      console.log('='.repeat(70));
      console.log('PIPELINE EXECUTION SUMMARY');
      console.log('='.repeat(70));
      console.log(`Status: ${pipelineStatus}`);
      console.log(`Phases Completed: ${phasesCompleted.length}/5`);
      console.log(`Total Artifacts: ${totalArtifacts}`);
      console.log('');

      console.log('Phase Results:');
      phasesCompleted.forEach(phase => {
        console.log(`  ✅ ${phase}`);
      });
      console.log('');

      if (phaseResults.validation) {
        console.log(`Validation: ${phaseResults.validation.status}`);
      }
      if (phaseResults.optimization) {
        console.log(`Optimization Score: ${phaseResults.optimization.optimization_score}/100`);
      }
      if (phaseResults.dependency_analysis) {
        console.log(`Dependencies: ${phaseResults.dependency_analysis.total_dependencies} total`);
      }
      console.log('');

      return {
        pipeline_status: pipelineStatus,
        phases_completed: phasesCompleted,
        total_artifacts: totalArtifacts,
        validation_status: phaseResults.validation?.status || 'NOT_RUN',
        optimization_score: phaseResults.optimization?.optimization_score || 0,
        phase_results: phaseResults
      };

    } catch (error) {
      throw new Error(`Full pipeline execution failed: ${error.message}`);
    }
  }
}

module.exports = ExecuteFullPipeline;
