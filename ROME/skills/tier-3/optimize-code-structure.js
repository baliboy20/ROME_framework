/**
 * /optimize-code-structure skill (Tier 3)
 * Analyzes and optimizes code structure for performance and maintainability
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class OptimizeCodeStructure {
  static async execute(params, executionId) {
    const { code_directory, output_file } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('⚡ OPTIMIZING CODE STRUCTURE');
      console.log('='.repeat(70));
      console.log('');

      const recommendations = [];

      // Analyze domain layer
      console.log('1/4 Analyzing domain layer...');
      const domainRecs = this.analyzeDomainLayer(code_directory);
      recommendations.push(...domainRecs);
      console.log(`  Recommendations: ${domainRecs.length}\n`);

      // Analyze data layer
      console.log('2/4 Analyzing data layer...');
      const dataRecs = this.analyzeDataLayer(code_directory);
      recommendations.push(...dataRecs);
      console.log(`  Recommendations: ${dataRecs.length}\n`);

      // Analyze presentation layer
      console.log('3/4 Analyzing presentation layer...');
      const presentationRecs = this.analyzePresentationLayer(code_directory);
      recommendations.push(...presentationRecs);
      console.log(`  Recommendations: ${presentationRecs.length}\n`);

      // Analyze cross-cutting concerns
      console.log('4/4 Analyzing cross-cutting concerns...');
      const crossCuttingRecs = this.analyzeCrossCuttingConcerns(code_directory);
      recommendations.push(...crossCuttingRecs);
      console.log(`  Recommendations: ${crossCuttingRecs.length}\n`);

      // Calculate optimization score
      const highPriority = recommendations.filter(r => r.priority === 'HIGH').length;
      const mediumPriority = recommendations.filter(r => r.priority === 'MEDIUM').length;

      const optimizationScore = Math.max(0, 100 - (highPriority * 15) - (mediumPriority * 5));

      const report = {
        optimization_score: optimizationScore,
        recommendations: recommendations,
        summary: {
          total_recommendations: recommendations.length,
          high_priority: highPriority,
          medium_priority: mediumPriority,
          low_priority: recommendations.filter(r => r.priority === 'LOW').length
        },
        timestamp: new Date().toISOString()
      };

      // Write report
      fs.writeFileSync(output_file, JSON.stringify(report, null, 2));

      console.log('='.repeat(70));
      console.log('CODE STRUCTURE OPTIMIZATION COMPLETE');
      console.log('='.repeat(70));
      console.log(`Optimization Score: ${optimizationScore}/100`);
      console.log(`Recommendations: ${recommendations.length} (${highPriority} high, ${mediumPriority} medium)`);
      console.log('');

      return {
        optimization_score: optimizationScore,
        recommendations: recommendations
      };

    } catch (error) {
      throw new Error(`Code structure optimization failed: ${error.message}`);
    }
  }

  static analyzeDomainLayer(codeDir) {
    const recommendations = [];
    const domainDir = path.join(codeDir, 'domain');

    if (!fs.existsSync(domainDir)) {
      return recommendations;
    }

    // Check for value objects directory
    const valueObjectsDir = path.join(domainDir, 'value_objects');
    if (!fs.existsSync(valueObjectsDir)) {
      recommendations.push({
        category: 'architecture',
        priority: 'MEDIUM',
        title: 'Create value objects directory',
        description: 'Add value_objects directory for domain value types like Email, Money, etc.',
        impact: 'Improves domain model richness and type safety'
      });
    }

    // Check for use cases directory
    const useCasesDir = path.join(domainDir, 'use_cases');
    if (!fs.existsSync(useCasesDir)) {
      recommendations.push({
        category: 'architecture',
        priority: 'HIGH',
        title: 'Add use cases layer',
        description: 'Create use_cases directory to encapsulate business logic separate from repositories',
        impact: 'Improves separation of concerns and testability'
      });
    }

    return recommendations;
  }

  static analyzeDataLayer(codeDir) {
    const recommendations = [];
    const dataDir = path.join(codeDir, 'data');

    if (!fs.existsSync(dataDir)) {
      return recommendations;
    }

    // Check for data sources abstraction
    const dataSourcesDir = path.join(dataDir, 'datasources');
    if (!fs.existsSync(dataSourcesDir)) {
      recommendations.push({
        category: 'architecture',
        priority: 'MEDIUM',
        title: 'Add data sources abstraction',
        description: 'Create datasources directory to separate remote/local data source implementations',
        impact: 'Enables easier testing and future migration to different backends'
      });
    }

    // Check for DTOs directory
    const dtosDir = path.join(dataDir, 'dtos');
    if (!fs.existsSync(dtosDir)) {
      recommendations.push({
        category: 'architecture',
        priority: 'LOW',
        title: 'Consider adding DTOs',
        description: 'Create dtos directory if you need data transfer objects separate from models',
        impact: 'Separates network contracts from domain models'
      });
    }

    // Analyze Parse models
    const modelsDir = path.join(dataDir, 'models');
    if (fs.existsSync(modelsDir)) {
      const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.dart'));

      modelFiles.forEach(file => {
        const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');

        // Check for error handling in toEntity
        if (content.includes('toEntity()') && !content.includes('try') && !content.includes('catch')) {
          recommendations.push({
            category: 'performance',
            priority: 'MEDIUM',
            title: `Add error handling to ${file} toEntity()`,
            description: 'Wrap toEntity() conversion in try-catch to handle null/missing fields gracefully',
            impact: 'Prevents runtime crashes from malformed Parse data'
          });
        }
      });
    }

    return recommendations;
  }

  static analyzePresentationLayer(codeDir) {
    const recommendations = [];
    const presentationDir = path.join(codeDir, 'presentation');

    if (!fs.existsSync(presentationDir)) {
      return recommendations;
    }

    // Check for widgets directory
    const widgetsDir = path.join(presentationDir, 'widgets');
    if (!fs.existsSync(widgetsDir)) {
      recommendations.push({
        category: 'architecture',
        priority: 'MEDIUM',
        title: 'Create reusable widgets directory',
        description: 'Add widgets directory for shared UI components to reduce code duplication',
        impact: 'Improves code reusability and consistency'
      });
    }

    // Analyze BLoC files
    const blocDir = path.join(presentationDir, 'bloc');
    if (fs.existsSync(blocDir)) {
      const blocFiles = fs.readdirSync(blocDir).filter(f => f.endsWith('_bloc.dart'));

      blocFiles.forEach(file => {
        const content = fs.readFileSync(path.join(blocDir, file), 'utf8');

        // Check for error state handling
        if (!content.includes('ErrorState') && !content.includes('FailureState')) {
          recommendations.push({
            category: 'performance',
            priority: 'HIGH',
            title: `Add error state handling to ${file}`,
            description: 'Implement proper error state in BLoC for better UX',
            impact: 'Improves user experience during errors'
          });
        }

        // Check for loading state
        if (!content.includes('LoadingState')) {
          recommendations.push({
            category: 'performance',
            priority: 'MEDIUM',
            title: `Add loading state to ${file}`,
            description: 'Implement loading state for async operations',
            impact: 'Provides user feedback during data fetching'
          });
        }
      });
    }

    // Analyze screens
    const screensDir = path.join(presentationDir, 'screens');
    if (fs.existsSync(screensDir)) {
      const screenFiles = fs.readdirSync(screensDir).filter(f => f.endsWith('.dart'));

      if (screenFiles.length > 5) {
        recommendations.push({
          category: 'maintainability',
          priority: 'LOW',
          title: 'Consider screen organization',
          description: 'Organize screens into feature-based subdirectories for better scalability',
          impact: 'Improves navigation and code organization as app grows'
        });
      }
    }

    return recommendations;
  }

  static analyzeCrossCuttingConcerns(codeDir) {
    const recommendations = [];

    // Check for DI setup
    const diFile = path.join(codeDir, 'injection.dart');
    const diFileAlt = path.join(codeDir, 'di.dart');
    if (!fs.existsSync(diFile) && !fs.existsSync(diFileAlt)) {
      recommendations.push({
        category: 'architecture',
        priority: 'HIGH',
        title: 'Add dependency injection setup',
        description: 'Create injection.dart with get_it service locator configuration',
        impact: 'Enables proper dependency management and testing'
      });
    }

    // Check for routing configuration
    const routingFile = path.join(codeDir, 'routing.dart');
    const routerFile = path.join(codeDir, 'router.dart');
    if (!fs.existsSync(routingFile) && !fs.existsSync(routerFile)) {
      recommendations.push({
        category: 'architecture',
        priority: 'HIGH',
        title: 'Add routing configuration',
        description: 'Create router.dart with go_router configuration for navigation',
        impact: 'Enables type-safe navigation and deep linking'
      });
    }

    // Check for constants/config
    const constantsDir = path.join(codeDir, 'core', 'constants');
    if (!fs.existsSync(constantsDir)) {
      recommendations.push({
        category: 'maintainability',
        priority: 'MEDIUM',
        title: 'Add constants directory',
        description: 'Create core/constants for app-wide constants, colors, strings, etc.',
        impact: 'Centralizes configuration and improves maintainability'
      });
    }

    // Check for error handling
    const errorsDir = path.join(codeDir, 'core', 'errors');
    if (!fs.existsSync(errorsDir)) {
      recommendations.push({
        category: 'architecture',
        priority: 'MEDIUM',
        title: 'Add error handling layer',
        description: 'Create core/errors for custom exceptions and failures',
        impact: 'Standardizes error handling across the app'
      });
    }

    return recommendations;
  }
}

module.exports = OptimizeCodeStructure;
