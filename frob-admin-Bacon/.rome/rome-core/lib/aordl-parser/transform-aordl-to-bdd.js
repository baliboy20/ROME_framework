/**
 * /transform-aordl-to-bdd skill
 *
 * Transforms AORDL requirement to BDD Gherkin format (Given-When-Then).
 *
 * Generates:
 * - Feature description from Actor + Intent
 * - Happy path scenario from Preconditions → Action → Outcomes
 * - Error scenarios from Errors field
 * - Scenario Outlines with Examples (optional)
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load templates from manifest
const manifestPath = path.join(__dirname, '../registry/transform-aordl-to-bdd.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const VERB_TO_ACTION = manifest.verb_to_action;

class TransformAORDLtoBDD {
  static async execute(params, executionId) {
    const {
      requirement_file,
      output_file = null,
      include_error_scenarios = true,
      include_examples = true
    } = params;

    try {
      // Load requirement file
      const requirementContent = fs.readFileSync(requirement_file, 'utf8');
      const requirement = yaml.load(requirementContent);

      // Generate feature
      const featureName = this.generateFeatureName(requirement);
      const featureDescription = this.generateFeatureDescription(requirement);

      // Generate main scenario (happy path)
      const mainScenario = this.generateMainScenario(requirement);

      // Generate error scenarios
      const errorScenarios = include_error_scenarios
        ? this.generateErrorScenarios(requirement)
        : [];

      // Build complete Gherkin content
      const scenarios = [mainScenario, ...errorScenarios];
      const gherkinContent = this.buildGherkinContent(
        featureName,
        featureDescription,
        scenarios
      );

      // Write output file if requested
      if (output_file) {
        fs.writeFileSync(output_file, gherkinContent);
      }

      return {
        feature_name: featureName,
        scenarios,
        gherkin_content: gherkinContent,
        output_file
      };

    } catch (error) {
      throw new Error(`BDD transformation failed: ${error.message}`);
    }
  }

  /**
   * Generate feature name from Intent
   */
  static generateFeatureName(requirement) {
    if (!requirement.Intent) {
      return 'Unknown Feature';
    }

    // Capitalize first letter of Intent
    const intent = requirement.Intent.trim();
    return intent.charAt(0).toUpperCase() + intent.slice(1);
  }

  /**
   * Generate feature description (As a... I want... So that...)
   */
  static generateFeatureDescription(requirement) {
    const actor = requirement.Actor || 'User';
    const intent = requirement.Intent || 'perform action';

    // Extract business value from Outcomes
    let businessValue = 'achieve goal';
    if (requirement.Outcomes && Array.isArray(requirement.Outcomes) && requirement.Outcomes.length > 0) {
      businessValue = requirement.Outcomes[0].toLowerCase();
    }

    return {
      actor,
      intent,
      business_value: businessValue
    };
  }

  /**
   * Generate main scenario (happy path)
   */
  static generateMainScenario(requirement) {
    const scenarioName = `Successfully ${requirement.Intent || 'complete action'}`;

    // Build Given steps from Preconditions
    const givenSteps = this.buildGivenSteps(requirement.Preconditions);

    // Build When step from Intent
    const whenStep = this.buildWhenStep(requirement.Intent);

    // Build Then steps from Postconditions and Outcomes
    const thenSteps = this.buildThenSteps(
      requirement.Postconditions,
      requirement.Outcomes
    );

    return {
      type: 'scenario',
      name: scenarioName,
      given: givenSteps,
      when: whenStep,
      then: thenSteps
    };
  }

  /**
   * Generate error scenarios from Errors field
   */
  static generateErrorScenarios(requirement) {
    if (!requirement.Errors || !Array.isArray(requirement.Errors)) {
      return [];
    }

    return requirement.Errors.map((error, index) => {
      const errorCondition = error.error || error.condition || `Error case ${index + 1}`;
      const errorMessage = error.message || 'Error occurs';

      // Build Given steps (preconditions + error condition)
      const givenSteps = this.buildGivenSteps(requirement.Preconditions);
      givenSteps.push(errorCondition);

      // Build When step (same as main scenario)
      const whenStep = this.buildWhenStep(requirement.Intent);

      // Build Then step (error message)
      const thenSteps = [errorMessage];

      return {
        type: 'error_scenario',
        name: `Error: ${errorCondition}`,
        given: givenSteps,
        when: whenStep,
        then: thenSteps
      };
    });
  }

  /**
   * Build Given steps from Preconditions
   */
  static buildGivenSteps(preconditions) {
    if (!preconditions || !Array.isArray(preconditions)) {
      return ['the system is ready'];
    }

    return preconditions.map(precondition => {
      // Clean up precondition text for Gherkin
      let step = precondition.trim();

      // Remove "must" and "should" if present at start
      step = step.replace(/^(must|should)\s+/i, '');

      // Ensure it starts with lowercase (Gherkin convention after "Given")
      step = step.charAt(0).toLowerCase() + step.slice(1);

      return step;
    });
  }

  /**
   * Build When step from Intent
   */
  static buildWhenStep(intent) {
    if (!intent) {
      return 'I perform the action';
    }

    const words = intent.trim().split(/\s+/);
    const verb = words[0].toLowerCase();
    const businessObject = words.slice(1).join(' ');

    // Map verb to user action
    const actionTemplate = VERB_TO_ACTION[verb] || 'I {verb} the {object}';
    const action = actionTemplate
      .replace('{object}', businessObject)
      .replace('{verb}', verb);

    return action;
  }

  /**
   * Build Then steps from Postconditions and Outcomes
   */
  static buildThenSteps(postconditions, outcomes) {
    const steps = [];

    // Add postconditions
    if (postconditions && Array.isArray(postconditions)) {
      postconditions.forEach(postcondition => {
        let step = postcondition.trim();
        step = step.charAt(0).toLowerCase() + step.slice(1);
        steps.push(step);
      });
    }

    // Add outcomes
    if (outcomes && Array.isArray(outcomes)) {
      outcomes.forEach(outcome => {
        let step = outcome.trim();
        step = step.charAt(0).toLowerCase() + step.slice(1);
        steps.push(step);
      });
    }

    // Default if no steps
    if (steps.length === 0) {
      steps.push('the action completes successfully');
    }

    return steps;
  }

  /**
   * Build complete Gherkin content
   */
  static buildGherkinContent(featureName, featureDescription, scenarios) {
    let content = '';

    // Feature header
    content += `Feature: ${featureName}\n`;
    content += `  As a ${featureDescription.actor}\n`;
    content += `  I want to ${featureDescription.intent}\n`;
    content += `  So that ${featureDescription.business_value}\n\n`;

    // Scenarios
    scenarios.forEach(scenario => {
      content += `  Scenario: ${scenario.name}\n`;

      // Given steps
      scenario.given.forEach((step, index) => {
        const keyword = index === 0 ? 'Given' : 'And';
        content += `    ${keyword} ${step}\n`;
      });

      // When step
      content += `    When ${scenario.when}\n`;

      // Then steps
      scenario.then.forEach((step, index) => {
        const keyword = index === 0 ? 'Then' : 'And';
        content += `    ${keyword} ${step}\n`;
      });

      content += '\n';
    });

    return content;
  }
}

module.exports = TransformAORDLtoBDD;
