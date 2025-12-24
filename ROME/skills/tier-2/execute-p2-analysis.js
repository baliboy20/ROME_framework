/**
 * /execute-p2-analysis skill (Tier 2)
 *
 * Executes complete P2 Analysis phase pipeline.
 *
 * P2 Pipeline Steps:
 * 1. Validation - Validate all AORDL requirements
 * 2. Batch Analysis - Analyze all requirements
 * 3. Data Dictionary - Generate unified data dictionary
 * 4. API Specification - Generate unified OpenAPI spec
 * 5. Database Schema - Generate SQL DDL from data dictionary
 * 6. Test Plan - Generate master test plan
 *
 * This is the main orchestration skill for P2 phase.
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ExecuteP2Analysis {
  static async execute(params, executionId) {
    const {
      requirements_directory,
      output_directory = null,
      skip_validation = false,
      generate_all_artifacts = true
    } = params;

    const startTime = Date.now();
    const phaseResults = {};
    const artifactsGenerated = [];

    try {
      // Lazy load invokeSkill
      const { invokeSkill } = require('../lib/SkillInvoker');

      console.log('\n' + '='.repeat(70));
      console.log('🚀 EXECUTING P2 ANALYSIS PHASE PIPELINE');
      console.log('='.repeat(70));
      console.log('');

      // Prepare output directories
      const outputBase = output_directory || path.join(requirements_directory, '../');
      const analysisDir = path.join(outputBase, '02-analysis');
      const apiSpecDir = path.join(outputBase, '05-api-specs');
      const dbSchemaDir = path.join(outputBase, '06-database-schema');
      const testScenariosDir = path.join(outputBase, '04-test-scenarios');

      [analysisDir, apiSpecDir, dbSchemaDir, testScenariosDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Step 1: Batch Analysis (includes validation)
      if (!skip_validation) {
        console.log('📊 Step 1/6: Batch Analysis & Validation\n');

        const analysisResult = await invokeSkill('batch-analyze-requirements', {
          requirements_directory,
          output_directory: analysisDir,
          output_format: 'json',
          generate_summary: true
        });

        phaseResults.batch_analysis = {
          total_requirements: analysisResult.summary.total_requirements,
          validation_pass_rate: analysisResult.summary.validation.pass_rate,
          avg_complexity: analysisResult.summary.complexity.average_score
        };

        artifactsGenerated.push(path.join(analysisDir, '_summary.json'));
        console.log('');
      }

      // Step 2: Data Dictionary
      console.log('📚 Step 2/6: Data Dictionary Generation\n');

      const dataDictPath = path.join(analysisDir, 'data-dictionary.json');
      const dataDictResult = await invokeSkill('generate-data-dictionary', {
        requirements_directory,
        output_file: dataDictPath,
        output_format: 'json',
        include_inferred_types: true,
        include_relationships: true
      });

      phaseResults.data_dictionary = {
        total_entities: dataDictResult.statistics.total_entities,
        total_attributes: dataDictResult.statistics.total_attributes,
        total_relationships: dataDictResult.statistics.total_relationships
      };

      artifactsGenerated.push(dataDictPath);
      console.log('');

      // Step 3: Unified API Specification
      console.log('🔌 Step 3/6: Unified API Specification\n');

      const apiSpecPath = path.join(apiSpecDir, 'unified-api-spec.yaml');
      const apiSpecResult = await invokeSkill('generate-full-api-spec', {
        requirements_directory,
        output_file: apiSpecPath,
        api_version: '1.0.0',
        api_title: 'Generated API',
        base_path: '/api/v1',
        group_by_resource: true
      });

      phaseResults.api_specification = {
        endpoint_count: apiSpecResult.endpoint_count,
        resource_count: apiSpecResult.resource_count
      };

      artifactsGenerated.push(apiSpecPath);
      console.log('');

      // Step 4: Database Schema
      console.log('🗄️  Step 4/6: Database Schema Generation\n');

      const dbSchemaPath = path.join(dbSchemaDir, 'schema-postgresql.sql');
      const dbSchemaResult = await invokeSkill('generate-database-schema', {
        data_dictionary_file: dataDictPath,
        output_file: dbSchemaPath,
        database_type: 'postgresql',
        include_indexes: true,
        include_constraints: true
      });

      phaseResults.database_schema = {
        table_count: dbSchemaResult.table_count
      };

      artifactsGenerated.push(dbSchemaPath);
      console.log('');

      // Step 5: Master Test Plan
      console.log('🧪 Step 5/6: Master Test Plan Generation\n');

      const testPlanPath = path.join(testScenariosDir, 'master-test-plan.md');
      const testPlanResult = await invokeSkill('generate-test-plan', {
        requirements_directory,
        output_file: testPlanPath,
        output_format: 'markdown',
        include_traceability: true,
        group_by_priority: true
      });

      phaseResults.test_plan = {
        total_scenarios: testPlanResult.total_scenarios,
        avg_coverage: testPlanResult.coverage_summary.avg_coverage_percentage
      };

      artifactsGenerated.push(testPlanPath);
      console.log('');

      // Step 6: Summary
      const endTime = Date.now();
      const executionTime = Math.round((endTime - startTime) / 1000);

      const executionSummary = {
        status: 'SUCCESS',
        execution_time_seconds: executionTime,
        total_artifacts: artifactsGenerated.length,
        pipeline_steps_completed: Object.keys(phaseResults).length,
        timestamp: new Date().toISOString()
      };

      console.log('='.repeat(70));
      console.log('✅ P2 ANALYSIS PHASE COMPLETE');
      console.log('='.repeat(70));
      console.log('');
      console.log(`⏱️  Execution Time: ${executionTime}s`);
      console.log(`📦 Artifacts Generated: ${artifactsGenerated.length}`);
      console.log('');
      console.log('Phase Results:');
      Object.entries(phaseResults).forEach(([phase, results]) => {
        console.log(`  ${phase}:`);
        Object.entries(results).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
      });
      console.log('');

      return {
        phase_results: phaseResults,
        artifacts_generated: artifactsGenerated,
        execution_summary: executionSummary
      };

    } catch (error) {
      const endTime = Date.now();
      const executionTime = Math.round((endTime - startTime) / 1000);

      const executionSummary = {
        status: 'FAILED',
        execution_time_seconds: executionTime,
        error: error.message,
        total_artifacts: artifactsGenerated.length,
        pipeline_steps_completed: Object.keys(phaseResults).length,
        timestamp: new Date().toISOString()
      };

      throw new Error(`P2 Analysis pipeline failed: ${error.message}`);
    }
  }
}

module.exports = ExecuteP2Analysis;
