/**
 * /validate-configuration skill (Tier 3)
 * Validates all configuration files for consistency, security, best practices
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ValidateConfiguration {
  static async execute(params, executionId) {
    const { config_directory, output_file } = params;

    try {
      const issues = [];
      let securityScore = 100;
      let consistencyScore = 100;

      console.log('Validating configuration files...\n');

      // 1. Validate environment files
      console.log('  Checking environment configuration...');
      const envIssues = this.validateEnvFiles(config_directory);
      issues.push(...envIssues);
      if (envIssues.length > 0) securityScore -= envIssues.length * 5;
      console.log(`    Found ${envIssues.length} issues\n`);

      // 2. Validate Docker configuration
      console.log('  Checking Docker configuration...');
      const dockerIssues = this.validateDockerConfig(config_directory);
      issues.push(...dockerIssues);
      if (dockerIssues.length > 0) consistencyScore -= dockerIssues.length * 5;
      console.log(`    Found ${dockerIssues.length} issues\n`);

      // 3. Validate security configuration
      console.log('  Checking security configuration...');
      const securityIssues = this.validateSecurityConfig(config_directory);
      issues.push(...securityIssues);
      if (securityIssues.length > 0) securityScore -= securityIssues.length * 10;
      console.log(`    Found ${securityIssues.length} issues\n`);

      // 4. Cross-file consistency checks
      console.log('  Checking cross-file consistency...');
      const consistencyIssues = this.checkConsistency(config_directory);
      issues.push(...consistencyIssues);
      if (consistencyIssues.length > 0) consistencyScore -= consistencyIssues.length * 10;
      console.log(`    Found ${consistencyIssues.length} issues\n`);

      const validationStatus = issues.length === 0 ? 'PASS' : 
                              issues.filter(i => i.severity === 'ERROR').length > 0 ? 'FAIL' : 'PASS_WITH_WARNINGS';

      const report = {
        validation_status: validationStatus,
        security_score: Math.max(0, securityScore),
        consistency_score: Math.max(0, consistencyScore),
        total_issues: issues.length,
        issues_by_severity: {
          error: issues.filter(i => i.severity === 'ERROR').length,
          warning: issues.filter(i => i.severity === 'WARNING').length,
          info: issues.filter(i => i.severity === 'INFO').length
        },
        issues_found: issues
      };

      fs.writeFileSync(output_file, JSON.stringify(report, null, 2));

      return {
        validation_status: validationStatus,
        issues_found: issues,
        security_score: Math.max(0, securityScore),
        consistency_score: Math.max(0, consistencyScore)
      };

    } catch (error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
  }

  static validateEnvFiles(configDir) {
    const issues = [];

    try {
      const envExample = path.join(configDir, '.env.example');
      if (fs.existsSync(envExample)) {
        const content = fs.readFileSync(envExample, 'utf8');
        
        // Check for placeholder secrets
        if (content.includes('your-') || content.includes('<set-in-secrets>')) {
          issues.push({
            severity: 'INFO',
            category: 'security',
            file: '.env.example',
            message: 'Contains placeholder values - ensure these are replaced in actual deployments'
          });
        }

        // Check for required variables
        const requiredVars = ['DB_PASSWORD', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
        requiredVars.forEach(varName => {
          if (!content.includes(varName)) {
            issues.push({
              severity: 'WARNING',
              category: 'security',
              file: '.env.example',
              message: `Missing required environment variable: ${varName}`
            });
          }
        });
      }
    } catch (e) {
      // Ignore if file doesn't exist
    }

    return issues;
  }

  static validateDockerConfig(configDir) {
    const issues = [];

    try {
      const composeFile = path.join(configDir, 'docker-compose.yml');
      if (fs.existsSync(composeFile)) {
        const content = fs.readFileSync(composeFile, 'utf8');

        // Check for hardcoded secrets
        if (content.includes('postgres:postgres') || content.includes('password:')) {
          issues.push({
            severity: 'ERROR',
            category: 'security',
            file: 'docker-compose.yml',
            message: 'Contains hardcoded credentials - use environment variables'
          });
        }

        // Check for resource limits
        if (!content.includes('limits:') && !content.includes('resources:')) {
          issues.push({
            severity: 'WARNING',
            category: 'performance',
            file: 'docker-compose.yml',
            message: 'No resource limits defined - recommended for production'
          });
        }
      }
    } catch (e) {
      // Ignore if file doesn't exist
    }

    return issues;
  }

  static validateSecurityConfig(configDir) {
    const issues = [];

    try {
      const securityFile = path.join(configDir, 'security.ts');
      if (fs.existsSync(securityFile)) {
        const content = fs.readFileSync(securityFile, 'utf8');

        // Check for CORS configuration
        if (!content.includes('cors')) {
          issues.push({
            severity: 'WARNING',
            category: 'security',
            file: 'security.ts',
            message: 'CORS not configured'
          });
        }

        // Check for helmet
        if (!content.includes('helmet')) {
          issues.push({
            severity: 'ERROR',
            category: 'security',
            file: 'security.ts',
            message: 'Helmet security headers not configured'
          });
        }
      }
    } catch (e) {
      // Ignore if file doesn't exist
    }

    return issues;
  }

  static checkConsistency(configDir) {
    const issues = [];

    // Check that environment variable names match across files
    const envFiles = ['.env.example', '.env.development', '.env.staging', '.env.production'];
    const envVars = new Map();

    envFiles.forEach(file => {
      const filePath = path.join(configDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const vars = content.match(/^[A-Z_]+=.*/gm) || [];
        vars.forEach(line => {
          const varName = line.split('=')[0];
          if (!envVars.has(varName)) {
            envVars.set(varName, []);
          }
          envVars.get(varName).push(file);
        });
      }
    });

    // Check for variables not in all files
    const existingFiles = envFiles.filter(f => fs.existsSync(path.join(configDir, f)));
    if (existingFiles.length > 1) {
      envVars.forEach((files, varName) => {
        if (files.length !== existingFiles.length) {
          issues.push({
            severity: 'WARNING',
            category: 'consistency',
            file: 'environment files',
            message: `Variable ${varName} not consistent across all env files (found in: ${files.join(', ')})`
          });
        }
      });
    }

    return issues;
  }
}

module.exports = ValidateConfiguration;
