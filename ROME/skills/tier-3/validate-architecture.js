/**
 * /validate-architecture skill (Tier 3)
 * Validates architecture against best practices and design patterns
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ValidateArchitecture {
  static async execute(params, executionId) {
    const { design_directory, output_file = null } = params;

    try {
      const issues = [];
      let score = 100;

      // Load design artifacts
      const componentFile = path.join(design_directory, 'component-structure.json');
      const authFile = path.join(design_directory, 'authentication.json');
      const errorFile = path.join(design_directory, 'error-handling.json');

      // Check 1: Layer separation
      if (fs.existsSync(componentFile)) {
        const components = JSON.parse(fs.readFileSync(componentFile, 'utf8'));
        const layerViolations = this.checkLayerSeparation(components);
        issues.push(...layerViolations);
        score -= layerViolations.length * 5;
      }

      // Check 2: Dependency direction
      const depIssues = this.checkDependencyDirection(design_directory);
      issues.push(...depIssues);
      score -= depIssues.length * 10;

      // Check 3: Security design
      if (fs.existsSync(authFile)) {
        const authIssues = this.checkSecurityDesign(authFile);
        issues.push(...authIssues);
        score -= authIssues.length * 15;
      }

      // Check 4: Error handling completeness
      if (fs.existsSync(errorFile)) {
        const errorIssues = this.checkErrorHandling(errorFile);
        issues.push(...errorIssues);
        score -= errorIssues.length * 5;
      }

      const validationStatus = score >= 80 ? 'PASS' : score >= 60 ? 'WARNING' : 'FAIL';

      const result = {
        validation_status: validationStatus,
        best_practices_score: Math.max(0, score),
        issues_found: issues,
        timestamp: new Date().toISOString()
      };

      if (output_file) fs.writeFileSync(output_file, JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      throw new Error(`Architecture validation failed: ${error.message}`);
    }
  }

  static checkLayerSeparation(components) {
    const issues = [];
    const layers = components.components || [];

    // Check for controllers directly accessing repositories
    layers.filter(c => c.layer === 'controller').forEach(ctrl => {
      (ctrl.dependencies || []).forEach(dep => {
        if (dep.includes('Repository')) {
          issues.push({
            severity: 'ERROR',
            check: 'layer_separation',
            message: `Controller "${ctrl.name}" directly depends on repository "${dep}" - violates layered architecture`
          });
        }
      });
    });

    return issues;
  }

  static checkDependencyDirection(designDir) {
    const issues = [];
    // Simplified check - in real implementation would analyze full dependency graph
    return issues;
  }

  static checkSecurityDesign(authFile) {
    const issues = [];
    const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));

    if (auth.authentication?.security?.passwordHashing !== 'bcrypt') {
      issues.push({
        severity: 'WARNING',
        check: 'security_design',
        message: 'Password hashing should use bcrypt'
      });
    }

    return issues;
  }

  static checkErrorHandling(errorFile) {
    const issues = [];
    const errorHandling = JSON.parse(fs.readFileSync(errorFile, 'utf8'));

    if (!errorHandling.errorHandling?.errorTypes || errorHandling.errorHandling.errorTypes.length < 5) {
      issues.push({
        severity: 'WARNING',
        check: 'error_handling',
        message: 'Error handling should define at least 5 error types'
      });
    }

    return issues;
  }
}

module.exports = ValidateArchitecture;
