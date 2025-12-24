/**
 * /validate-code-generation skill (Tier 3)
 * Validates generated code quality, patterns, and dependencies
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class ValidateCodeGeneration {
  static async execute(params, executionId) {
    const { code_directory, output_file } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🔍 VALIDATING GENERATED CODE');
      console.log('='.repeat(70));
      console.log('');

      const issues = [];
      let qualityScore = 100;
      let patternScore = 100;

      // Validate domain layer
      console.log('1/3 Validating domain layer...');
      const domainIssues = this.validateDomainLayer(code_directory);
      issues.push(...domainIssues);
      console.log(`  Issues found: ${domainIssues.length}\n`);

      // Validate data layer
      console.log('2/3 Validating data layer...');
      const dataIssues = this.validateDataLayer(code_directory);
      issues.push(...dataIssues);
      console.log(`  Issues found: ${dataIssues.length}\n`);

      // Validate presentation layer
      console.log('3/3 Validating presentation layer...');
      const presentationIssues = this.validatePresentationLayer(code_directory);
      issues.push(...presentationIssues);
      console.log(`  Issues found: ${presentationIssues.length}\n`);

      // Calculate scores
      const criticalIssues = issues.filter(i => i.severity === 'CRITICAL').length;
      const warningIssues = issues.filter(i => i.severity === 'WARNING').length;

      qualityScore = Math.max(0, 100 - (criticalIssues * 20) - (warningIssues * 5));
      patternScore = Math.max(0, 100 - (issues.filter(i => i.category === 'pattern').length * 10));

      const validationStatus = criticalIssues === 0 ? 'PASS' : 'FAIL';

      const report = {
        validation_status: validationStatus,
        quality_score: qualityScore,
        pattern_score: patternScore,
        issues_found: issues,
        summary: {
          total_issues: issues.length,
          critical: criticalIssues,
          warnings: warningIssues,
          info: issues.filter(i => i.severity === 'INFO').length
        },
        timestamp: new Date().toISOString()
      };

      // Write report
      fs.writeFileSync(output_file, JSON.stringify(report, null, 2));

      console.log('='.repeat(70));
      console.log('CODE VALIDATION COMPLETE');
      console.log('='.repeat(70));
      console.log(`Status: ${validationStatus}`);
      console.log(`Quality Score: ${qualityScore}/100`);
      console.log(`Pattern Score: ${patternScore}/100`);
      console.log(`Issues: ${issues.length} (${criticalIssues} critical, ${warningIssues} warnings)`);
      console.log('');

      return {
        validation_status: validationStatus,
        quality_score: qualityScore,
        pattern_score: patternScore,
        issues_found: issues
      };

    } catch (error) {
      throw new Error(`Code validation failed: ${error.message}`);
    }
  }

  static validateDomainLayer(codeDir) {
    const issues = [];
    const domainDir = path.join(codeDir, 'domain');

    if (!fs.existsSync(domainDir)) {
      issues.push({
        severity: 'CRITICAL',
        category: 'structure',
        message: 'Domain layer directory not found',
        file: 'domain/'
      });
      return issues;
    }

    // Check for Result type
    const resultFile = path.join(domainDir, 'value_objects', 'result.dart');
    if (!fs.existsSync(resultFile)) {
      issues.push({
        severity: 'CRITICAL',
        category: 'pattern',
        message: 'Result type not found - required for error handling',
        file: 'domain/value_objects/result.dart'
      });
    } else {
      const content = fs.readFileSync(resultFile, 'utf8');
      if (!content.includes('sealed class Result')) {
        issues.push({
          severity: 'WARNING',
          category: 'pattern',
          message: 'Result should use native sealed class pattern',
          file: 'domain/value_objects/result.dart'
        });
      }
    }

    // Check for entities with Equatable
    const entitiesDir = path.join(domainDir, 'entities');
    if (fs.existsSync(entitiesDir)) {
      const entityFiles = fs.readdirSync(entitiesDir).filter(f => f.endsWith('.dart'));
      entityFiles.forEach(file => {
        const content = fs.readFileSync(path.join(entitiesDir, file), 'utf8');
        if (!content.includes('extends Equatable')) {
          issues.push({
            severity: 'WARNING',
            category: 'pattern',
            message: 'Entity should extend Equatable for value equality',
            file: `domain/entities/${file}`
          });
        }
      });
    }

    return issues;
  }

  static validateDataLayer(codeDir) {
    const issues = [];
    const dataDir = path.join(codeDir, 'data');

    if (!fs.existsSync(dataDir)) {
      issues.push({
        severity: 'CRITICAL',
        category: 'structure',
        message: 'Data layer directory not found',
        file: 'data/'
      });
      return issues;
    }

    // Check Parse models
    const modelsDir = path.join(dataDir, 'models');
    if (fs.existsSync(modelsDir)) {
      const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.dart'));
      modelFiles.forEach(file => {
        const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
        if (!content.includes('extends ParseObject')) {
          issues.push({
            severity: 'WARNING',
            category: 'pattern',
            message: 'Parse model should extend ParseObject',
            file: `data/models/${file}`
          });
        }
        if (!content.includes('toEntity()')) {
          issues.push({
            severity: 'WARNING',
            category: 'pattern',
            message: 'Parse model missing toEntity() conversion method',
            file: `data/models/${file}`
          });
        }
      });
    }

    // Check repository implementations
    const reposDir = path.join(dataDir, 'repositories');
    if (fs.existsSync(reposDir)) {
      const repoFiles = fs.readdirSync(reposDir).filter(f => f.endsWith('.dart'));
      repoFiles.forEach(file => {
        const content = fs.readFileSync(path.join(reposDir, file), 'utf8');
        if (!content.includes('implements') && !content.includes('Repository')) {
          issues.push({
            severity: 'WARNING',
            category: 'pattern',
            message: 'Repository implementation should implement repository interface',
            file: `data/repositories/${file}`
          });
        }
      });
    }

    return issues;
  }

  static validatePresentationLayer(codeDir) {
    const issues = [];
    const presentationDir = path.join(codeDir, 'presentation');

    if (!fs.existsSync(presentationDir)) {
      issues.push({
        severity: 'CRITICAL',
        category: 'structure',
        message: 'Presentation layer directory not found',
        file: 'presentation/'
      });
      return issues;
    }

    // Check BLoC files
    const blocDir = path.join(presentationDir, 'bloc');
    if (fs.existsSync(blocDir)) {
      const blocFiles = fs.readdirSync(blocDir).filter(f => f.endsWith('_bloc.dart'));
      blocFiles.forEach(file => {
        const content = fs.readFileSync(path.join(blocDir, file), 'utf8');
        if (!content.includes('extends Bloc')) {
          issues.push({
            severity: 'WARNING',
            category: 'pattern',
            message: 'BLoC should extend Bloc from flutter_bloc',
            file: `presentation/bloc/${file}`
          });
        }
      });

      // Check for sealed state classes
      const stateFiles = fs.readdirSync(blocDir).filter(f => f.endsWith('_state.dart'));
      stateFiles.forEach(file => {
        const content = fs.readFileSync(path.join(blocDir, file), 'utf8');
        if (!content.includes('sealed class')) {
          issues.push({
            severity: 'INFO',
            category: 'pattern',
            message: 'Consider using sealed class for BLoC states',
            file: `presentation/bloc/${file}`
          });
        }
      });
    }

    // Check UI screens
    const screensDir = path.join(presentationDir, 'screens');
    if (fs.existsSync(screensDir)) {
      const screenFiles = fs.readdirSync(screensDir).filter(f => f.endsWith('.dart'));
      screenFiles.forEach(file => {
        const content = fs.readFileSync(path.join(screensDir, file), 'utf8');
        if (!content.includes('BlocBuilder') && !content.includes('BlocConsumer')) {
          issues.push({
            severity: 'INFO',
            category: 'pattern',
            message: 'Screen should use BlocBuilder or BlocConsumer for state management',
            file: `presentation/screens/${file}`
          });
        }
      });
    }

    return issues;
  }
}

module.exports = ValidateCodeGeneration;
