/**
 * SkillInvoker - Core skill execution framework for ROME
 *
 * Provides centralized skill invocation with:
 * - Parameter validation
 * - Timeout handling
 * - Retry logic
 * - Activity logging
 * - Error handling
 *
 * Version: 1.0.0
 * Date: 2025-12-23
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class SkillInvoker {
  constructor() {
    this.skillRegistry = new Map();
    this.activityLog = [];
    this.defaultTimeout = 30000; // 30 seconds
    this.loadSkills();
  }

  /**
   * Load all skill manifests from the registry directory
   */
  loadSkills() {
    const registryPath = path.join(__dirname, '../registry');

    if (!fs.existsSync(registryPath)) {
      console.warn(`Registry directory not found: ${registryPath}`);
      return;
    }

    const files = fs.readdirSync(registryPath).filter(f => f.endsWith('.yaml'));

    for (const file of files) {
      try {
        const manifestPath = path.join(registryPath, file);
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = yaml.load(manifestContent);

        if (!manifest.skill || !manifest.skill.name) {
          console.warn(`Invalid manifest in ${file}: missing skill.name`);
          continue;
        }

        const skillName = manifest.skill.name;
        const tier = manifest.skill.tier || 1;
        const category = manifest.skill.category || 'general';

        // Load the skill implementation
        const implementationPath = path.join(__dirname, `../tier-${tier}/${skillName}.js`);

        if (fs.existsSync(implementationPath)) {
          const implementation = require(implementationPath);

          this.skillRegistry.set(skillName, {
            manifest,
            implementation,
            tier,
            category
          });

          console.log(`Loaded skill: ${skillName} (Tier ${tier}, ${category})`);
        } else {
          console.warn(`Implementation not found for ${skillName}: ${implementationPath}`);
        }
      } catch (error) {
        console.error(`Error loading skill manifest ${file}:`, error.message);
      }
    }

    console.log(`Skill registry loaded: ${this.skillRegistry.size} skills`);
  }

  /**
   * Invoke a skill by name with parameters
   *
   * @param {string} skillName - The skill name (with or without leading /)
   * @param {Object} params - Parameters to pass to the skill
   * @param {Object} options - Execution options (timeout, retry, etc.)
   * @returns {Promise<Object>} - Skill execution result
   */
  async invokeSkill(skillName, params = {}, options = {}) {
    const startTime = Date.now();
    const executionId = this.generateExecutionId();

    // Normalize skill name (remove leading /)
    const normalizedName = skillName.replace(/^\//, '');

    // Get skill from registry
    const skill = this.skillRegistry.get(normalizedName);

    if (!skill) {
      const error = new Error(`Skill not found: ${skillName}`);
      this.logActivity({
        executionId,
        skill: normalizedName,
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }

    try {
      // Validate parameters
      this.validateParameters(params, skill.manifest.parameters);

      // Apply defaults
      const mergedParams = this.applyDefaults(params, skill.manifest.parameters);

      // Get timeout (from options, manifest, or default)
      const timeout = options.timeout
        || skill.manifest.execution?.timeout
        || this.defaultTimeout;

      // Get retry configuration
      const retry = options.retry !== undefined
        ? options.retry
        : (skill.manifest.execution?.retry || { enabled: false });

      // Execute skill with timeout and retry
      let result;
      let attempts = 0;
      const maxAttempts = retry.enabled ? (retry.max_attempts || 3) : 1;

      while (attempts < maxAttempts) {
        attempts++;

        try {
          result = await this.executeWithTimeout(
            skill.implementation,
            mergedParams,
            timeout,
            executionId
          );

          // Success - break retry loop
          break;
        } catch (error) {
          if (attempts >= maxAttempts) {
            throw error; // Final attempt failed
          }

          // Retry with backoff
          const backoff = retry.backoff === 'exponential'
            ? Math.pow(2, attempts) * 1000
            : 1000;

          console.warn(`Skill ${normalizedName} failed (attempt ${attempts}/${maxAttempts}), retrying in ${backoff}ms...`);
          await this.sleep(backoff);
        }
      }

      // Log successful execution
      const duration = Date.now() - startTime;
      this.logActivity({
        executionId,
        skill: normalizedName,
        status: 'success',
        params: mergedParams,
        result,
        duration,
        attempts
      });

      return result;

    } catch (error) {
      // Log failed execution
      const duration = Date.now() - startTime;
      this.logActivity({
        executionId,
        skill: normalizedName,
        status: 'error',
        params,
        error: error.message,
        stack: error.stack,
        duration
      });

      throw error;
    }
  }

  /**
   * Execute skill implementation with timeout
   */
  async executeWithTimeout(implementation, params, timeout, executionId) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Skill execution timed out after ${timeout}ms`));
      }, timeout);

      Promise.resolve(implementation.execute(params, executionId))
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Validate parameters against skill manifest
   */
  validateParameters(params, parameterDef) {
    if (!parameterDef) return;

    // Check required parameters
    if (parameterDef.required) {
      for (const reqParam of parameterDef.required) {
        const paramName = reqParam.name || reqParam;
        if (params[paramName] === undefined) {
          throw new Error(`Missing required parameter: ${paramName}`);
        }

        // Type validation
        if (reqParam.type) {
          const actualType = typeof params[paramName];
          if (reqParam.type === 'array' && !Array.isArray(params[paramName])) {
            throw new Error(`Parameter ${paramName} must be an array`);
          } else if (reqParam.type !== 'array' && actualType !== reqParam.type) {
            throw new Error(`Parameter ${paramName} must be of type ${reqParam.type}, got ${actualType}`);
          }
        }

        // Custom validation
        if (reqParam.validation) {
          this.runCustomValidation(paramName, params[paramName], reqParam.validation);
        }
      }
    }

    // Validate optional parameters if provided
    if (parameterDef.optional) {
      for (const optParam of parameterDef.optional) {
        const paramName = optParam.name || optParam;
        if (params[paramName] !== undefined) {
          // Type validation
          if (optParam.type) {
            const actualType = typeof params[paramName];
            if (optParam.type === 'array' && !Array.isArray(params[paramName])) {
              throw new Error(`Parameter ${paramName} must be an array`);
            } else if (optParam.type !== 'array' && actualType !== optParam.type) {
              throw new Error(`Parameter ${paramName} must be of type ${optParam.type}, got ${actualType}`);
            }
          }

          // Custom validation
          if (optParam.validation) {
            this.runCustomValidation(paramName, params[paramName], optParam.validation);
          }
        }
      }
    }
  }

  /**
   * Run custom validation rules
   */
  runCustomValidation(paramName, value, validationRule) {
    if (validationRule === 'file_exists') {
      if (!fs.existsSync(value)) {
        throw new Error(`File not found: ${value} (parameter: ${paramName})`);
      }
    } else if (validationRule === 'directory_exists') {
      if (!fs.existsSync(value) || !fs.statSync(value).isDirectory()) {
        throw new Error(`Directory not found: ${value} (parameter: ${paramName})`);
      }
    }
    // Add more validation rules as needed
  }

  /**
   * Apply default values to parameters
   */
  applyDefaults(params, parameterDef) {
    const merged = { ...params };

    if (parameterDef && parameterDef.optional) {
      for (const optParam of parameterDef.optional) {
        const paramName = optParam.name || optParam;
        if (merged[paramName] === undefined && optParam.default !== undefined) {
          merged[paramName] = optParam.default;
        }
      }
    }

    return merged;
  }

  /**
   * Log activity to internal log and optionally to file
   */
  logActivity(entry) {
    entry.timestamp = new Date().toISOString();
    this.activityLog.push(entry);

    // Write to activity log file if configured
    const logPath = process.env.ROME_ACTIVITY_LOG_PATH;
    if (logPath) {
      try {
        fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
      } catch (error) {
        console.error('Failed to write activity log:', error.message);
      }
    }
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility for retry backoff
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all loaded skills
   */
  getLoadedSkills() {
    return Array.from(this.skillRegistry.entries()).map(([name, skill]) => ({
      name,
      tier: skill.tier,
      category: skill.category,
      version: skill.manifest.skill?.version
    }));
  }

  /**
   * Get activity log
   */
  getActivityLog() {
    return this.activityLog;
  }

  /**
   * Clear activity log
   */
  clearActivityLog() {
    this.activityLog = [];
  }
}

// Export singleton instance
const skillInvoker = new SkillInvoker();

module.exports = {
  SkillInvoker,
  skillInvoker,
  invokeSkill: (skillName, params, options) => skillInvoker.invokeSkill(skillName, params, options)
};
