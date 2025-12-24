/**
 * /generate-test-scenarios skill
 *
 * Generates comprehensive test scenarios from AORDL requirements.
 *
 * Test types:
 * - Happy path (normal successful flow)
 * - Error handling (from Errors field)
 * - Boundary testing (edge values)
 * - Validation testing (input validation)
 * - Invariant testing (business rule enforcement)
 * - Authorization testing (access control)
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load scenario types from manifest
const manifestPath = path.join(__dirname, '../registry/generate-test-scenarios.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const SCENARIO_TYPES = manifest.scenario_types;

class GenerateTestScenarios {
  static async execute(params, executionId) {
    const {
      requirement_file,
      output_file = null,
      output_format = 'json',
      include_negative_tests = true,
      include_edge_cases = true
    } = params;

    try {
      // Load requirement file
      const requirementContent = fs.readFileSync(requirement_file, 'utf8');
      const requirement = yaml.load(requirementContent);

      const testScenarios = [];

      // 1. Generate happy path scenario
      testScenarios.push(this.generateHappyPathScenario(requirement));

      // 2. Generate error handling scenarios
      if (include_negative_tests) {
        testScenarios.push(...this.generateErrorScenarios(requirement));
      }

      // 3. Generate validation scenarios
      testScenarios.push(...this.generateValidationScenarios(requirement));

      // 4. Generate invariant testing scenarios
      testScenarios.push(...this.generateInvariantScenarios(requirement));

      // 5. Generate authorization scenarios
      testScenarios.push(...this.generateAuthorizationScenarios(requirement));

      // 6. Generate edge case scenarios
      if (include_edge_cases) {
        testScenarios.push(...this.generateEdgeCaseScenarios(requirement));
      }

      // Calculate coverage
      const coverage = this.calculateCoverage(testScenarios, requirement);

      // Build result
      const result = {
        requirement_id: requirement.ID || 'UNKNOWN',
        requirement_intent: requirement.Intent,
        test_scenarios: testScenarios,
        coverage,
        metadata: {
          generated_at: new Date().toISOString(),
          execution_id: executionId,
          requirement_file
        }
      };

      // Write output file if requested
      if (output_file) {
        this.writeOutputFile(output_file, result, output_format);
      }

      return {
        test_scenarios: testScenarios,
        coverage,
        output_file
      };

    } catch (error) {
      throw new Error(`Test scenario generation failed: ${error.message}`);
    }
  }

  /**
   * Generate happy path scenario
   */
  static generateHappyPathScenario(requirement) {
    return {
      id: 'TS-001',
      name: `Happy Path: ${requirement.Intent || 'Complete action'}`,
      type: 'happy_path',
      priority: SCENARIO_TYPES.happy_path.priority,
      description: 'Normal successful flow with valid inputs',
      preconditions: requirement.Preconditions || [],
      test_steps: this.buildHappyPathSteps(requirement),
      expected_results: requirement.Outcomes || [],
      postconditions: requirement.Postconditions || []
    };
  }

  /**
   * Build happy path test steps
   */
  static buildHappyPathSteps(requirement) {
    const steps = [];

    // Step 1: Setup
    steps.push({
      step_number: 1,
      action: 'Setup test data',
      details: 'Prepare valid test data meeting all preconditions'
    });

    // Step 2: Authenticate
    steps.push({
      step_number: 2,
      action: `Authenticate as ${requirement.Actor || 'User'}`,
      details: 'Login with appropriate role and permissions'
    });

    // Step 3: Execute action
    const intent = requirement.Intent || 'perform action';
    steps.push({
      step_number: 3,
      action: `Execute: ${intent}`,
      details: 'Perform the main action with valid inputs'
    });

    // Step 4: Verify results
    steps.push({
      step_number: 4,
      action: 'Verify outcomes',
      details: 'Check that all expected outcomes are achieved'
    });

    return steps;
  }

  /**
   * Generate error handling scenarios from Errors field
   */
  static generateErrorScenarios(requirement) {
    if (!requirement.Errors || !Array.isArray(requirement.Errors)) {
      return [];
    }

    return requirement.Errors.map((error, index) => {
      const errorCondition = error.error || error.condition || `Error case ${index + 1}`;
      const errorMessage = error.message || 'Error occurs';

      return {
        id: `TS-E${String(index + 1).padStart(2, '0')}`,
        name: `Error: ${errorCondition}`,
        type: 'error_handling',
        priority: SCENARIO_TYPES.error_handling.priority,
        description: `Test error handling when ${errorCondition}`,
        preconditions: [...(requirement.Preconditions || []), errorCondition],
        test_steps: [
          {
            step_number: 1,
            action: `Setup error condition: ${errorCondition}`,
            details: 'Create scenario where error condition exists'
          },
          {
            step_number: 2,
            action: `Attempt: ${requirement.Intent}`,
            details: 'Try to perform action despite error condition'
          },
          {
            step_number: 3,
            action: 'Verify error response',
            details: `Confirm error message: "${errorMessage}"`
          }
        ],
        expected_results: [errorMessage],
        postconditions: ['System state unchanged', 'No side effects']
      };
    });
  }

  /**
   * Generate validation scenarios
   */
  static generateValidationScenarios(requirement) {
    const scenarios = [];

    // Check Conditions field for validation rules
    if (requirement.Conditions && Array.isArray(requirement.Conditions)) {
      requirement.Conditions.forEach((condition, index) => {
        // Look for validation patterns (required, format, etc.)
        if (this.isValidationCondition(condition)) {
          scenarios.push({
            id: `TS-V${String(index + 1).padStart(2, '0')}`,
            name: `Validation: ${condition}`,
            type: 'validation',
            priority: SCENARIO_TYPES.validation.priority,
            description: `Test validation rule: ${condition}`,
            preconditions: requirement.Preconditions || [],
            test_steps: [
              {
                step_number: 1,
                action: 'Prepare invalid input',
                details: `Violate condition: ${condition}`
              },
              {
                step_number: 2,
                action: `Attempt: ${requirement.Intent}`,
                details: 'Try to perform action with invalid input'
              },
              {
                step_number: 3,
                action: 'Verify validation error',
                details: 'Confirm appropriate validation error is returned'
              }
            ],
            expected_results: ['Validation error returned', 'Request rejected'],
            postconditions: ['System state unchanged']
          });
        }
      });
    }

    return scenarios;
  }

  /**
   * Check if condition is a validation rule
   */
  static isValidationCondition(condition) {
    const validationKeywords = [
      'required', 'must', 'cannot be empty', 'format', 'valid',
      'minimum', 'maximum', 'length', 'pattern'
    ];

    const conditionLower = condition.toLowerCase();
    return validationKeywords.some(keyword => conditionLower.includes(keyword));
  }

  /**
   * Generate invariant testing scenarios
   */
  static generateInvariantScenarios(requirement) {
    if (!requirement.Invariants || !Array.isArray(requirement.Invariants)) {
      return [];
    }

    return requirement.Invariants.slice(0, 3).map((invariant, index) => {
      return {
        id: `TS-I${String(index + 1).padStart(2, '0')}`,
        name: `Invariant: ${invariant}`,
        type: 'invariant',
        priority: SCENARIO_TYPES.invariant.priority,
        description: `Test enforcement of business rule: ${invariant}`,
        preconditions: requirement.Preconditions || [],
        test_steps: [
          {
            step_number: 1,
            action: 'Attempt to violate invariant',
            details: `Try to break rule: ${invariant}`
          },
          {
            step_number: 2,
            action: 'Verify rule enforcement',
            details: 'Confirm invariant is enforced by system'
          }
        ],
        expected_results: ['Invariant enforced', 'Violation prevented or detected'],
        postconditions: ['Business rule maintained']
      };
    });
  }

  /**
   * Generate authorization scenarios
   */
  static generateAuthorizationScenarios(requirement) {
    const scenarios = [];

    // Test unauthorized access
    scenarios.push({
      id: 'TS-A01',
      name: 'Authorization: Unauthenticated user',
      type: 'authorization',
      priority: SCENARIO_TYPES.authorization.priority,
      description: 'Test that unauthenticated users are rejected',
      preconditions: ['User not authenticated'],
      test_steps: [
        {
          step_number: 1,
          action: 'Attempt action without authentication',
          details: `Try: ${requirement.Intent} without login`
        },
        {
          step_number: 2,
          action: 'Verify rejection',
          details: 'Confirm 401 Unauthorized response'
        }
      ],
      expected_results: ['401 Unauthorized', 'Request rejected'],
      postconditions: ['No action performed']
    });

    // Test wrong role
    scenarios.push({
      id: 'TS-A02',
      name: `Authorization: User without ${requirement.Actor} role`,
      type: 'authorization',
      priority: SCENARIO_TYPES.authorization.priority,
      description: 'Test that users without required role are rejected',
      preconditions: ['User authenticated but lacks required role'],
      test_steps: [
        {
          step_number: 1,
          action: `Authenticate as non-${requirement.Actor}`,
          details: 'Login with insufficient permissions'
        },
        {
          step_number: 2,
          action: `Attempt: ${requirement.Intent}`,
          details: 'Try to perform action'
        },
        {
          step_number: 3,
          action: 'Verify rejection',
          details: 'Confirm 403 Forbidden response'
        }
      ],
      expected_results: ['403 Forbidden', 'Insufficient permissions error'],
      postconditions: ['No action performed']
    });

    return scenarios;
  }

  /**
   * Generate edge case scenarios
   */
  static generateEdgeCaseScenarios(requirement) {
    const scenarios = [];

    // Edge case: Concurrent operations
    scenarios.push({
      id: 'TS-EC01',
      name: 'Edge Case: Concurrent operations',
      type: 'edge_case',
      priority: SCENARIO_TYPES.edge_case.priority,
      description: 'Test behavior when multiple users perform action simultaneously',
      preconditions: requirement.Preconditions || [],
      test_steps: [
        {
          step_number: 1,
          action: 'Setup multiple concurrent requests',
          details: 'Simulate 2+ users performing same action'
        },
        {
          step_number: 2,
          action: 'Execute concurrent operations',
          details: 'Send requests simultaneously'
        },
        {
          step_number: 3,
          action: 'Verify correct handling',
          details: 'Check for race conditions, duplicate prevention'
        }
      ],
      expected_results: ['All requests handled correctly', 'No data corruption'],
      postconditions: ['System in consistent state']
    });

    return scenarios;
  }

  /**
   * Calculate test coverage
   */
  static calculateCoverage(scenarios, requirement) {
    const coverage = {
      total_scenarios: scenarios.length,
      by_type: {},
      by_priority: {},
      preconditions_covered: 0,
      errors_covered: 0,
      invariants_covered: 0,
      coverage_percentage: 0
    };

    // Count by type and priority
    scenarios.forEach(scenario => {
      coverage.by_type[scenario.type] = (coverage.by_type[scenario.type] || 0) + 1;
      coverage.by_priority[scenario.priority] = (coverage.by_priority[scenario.priority] || 0) + 1;
    });

    // Calculate coverage
    const totalItems = (requirement.Errors?.length || 0) +
                      (requirement.Invariants?.length || 0) +
                      (requirement.Preconditions?.length || 0);

    coverage.errors_covered = requirement.Errors?.length || 0;
    coverage.invariants_covered = Math.min(3, requirement.Invariants?.length || 0);
    coverage.preconditions_covered = requirement.Preconditions?.length || 0;

    const coveredItems = coverage.errors_covered +
                        coverage.invariants_covered +
                        coverage.preconditions_covered;

    coverage.coverage_percentage = totalItems > 0
      ? Math.round((coveredItems / totalItems) * 100)
      : 100;

    return coverage;
  }

  /**
   * Write output file in specified format
   */
  static writeOutputFile(filePath, result, format) {
    let content;

    if (format === 'yaml') {
      content = yaml.dump(result);
    } else if (format === 'markdown') {
      content = this.formatAsMarkdown(result);
    } else {
      content = JSON.stringify(result, null, 2);
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * Format test scenarios as Markdown
   */
  static formatAsMarkdown(result) {
    let md = `# Test Scenarios: ${result.requirement_id}\n\n`;
    md += `**Requirement:** ${result.requirement_intent}\n`;
    md += `**Total Scenarios:** ${result.coverage.total_scenarios}\n`;
    md += `**Coverage:** ${result.coverage.coverage_percentage}%\n\n`;

    md += '---\n\n';

    result.test_scenarios.forEach((scenario, index) => {
      md += `## ${scenario.id}: ${scenario.name}\n\n`;
      md += `**Type:** ${scenario.type}\n`;
      md += `**Priority:** ${scenario.priority}\n`;
      md += `**Description:** ${scenario.description}\n\n`;

      md += '**Test Steps:**\n\n';
      scenario.test_steps.forEach(step => {
        md += `${step.step_number}. **${step.action}**\n`;
        md += `   - ${step.details}\n\n`;
      });

      md += '**Expected Results:**\n';
      scenario.expected_results.forEach(result => {
        md += `- ${result}\n`;
      });
      md += '\n---\n\n';
    });

    return md;
  }
}

module.exports = GenerateTestScenarios;
