/**
 * /validate-aordl skill
 *
 * Validates AORDL requirement files according to STRICT, GUIDED, or PERMISSIVE modes.
 *
 * Validation includes:
 * - All 13 required fields present
 * - ID format (REQ-###)
 * - Actor is specific role (not generic "user")
 * - Intent uses approved verb + business object
 * - No UI language (click, button, screen)
 * - No technical jargon (POST, SQL, endpoint)
 * - No compound intents
 * - Invariants are domain truths
 * - Errors have condition and message
 * - Outcomes are observable
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load validation rules from manifest
const manifestPath = path.join(__dirname, '../registry/validate-aordl.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const REQUIRED_FIELDS = manifest.required_fields;
const UI_KEYWORDS = manifest.anti_patterns.ui_keywords;
const TECHNICAL_KEYWORDS = manifest.anti_patterns.technical_keywords;
const GENERIC_ACTORS = manifest.anti_patterns.generic_actors;
const AMBIGUOUS_VERBS = manifest.anti_patterns.ambiguous_verbs;
const APPROVED_VERBS = manifest.approved_verbs;
const ID_PATTERN = new RegExp(manifest.id_pattern);

// Whitelisted business-appropriate terms that contain technical keywords
const BUSINESS_WHITELISTED_TERMS = [
  'api-token',
  'api token',
  'api authentication',
  'api requests',
  'api servers',
  'api access',
  'JSON format',
  'JSON file',
  'JSON data',
  'JSON schema',
  'JSON, CSV, PDF',  // Format enumeration
  'CSV format',
  'PDF format',
  'delete task',
  'delete team-member',
  'delete webhook',
  'delete api-token',
  'soft delete',
  'deleted',
  'deletion',
  'hard delete'
];

class ValidateAORDL {
  static async execute(params, executionId) {
    const { requirement_file, mode = 'STRICT', output_report = null } = params;

    const violations = [];
    const warnings = [];

    try {
      // Load requirement file
      const requirementContent = fs.readFileSync(requirement_file, 'utf8');
      const requirement = yaml.load(requirementContent);

      // Validation checks
      this.validateRequiredFields(requirement, violations);
      this.validateID(requirement, violations);
      this.validateActor(requirement, violations, warnings);
      this.validateIntent(requirement, violations, warnings);
      this.validateAntiPatterns(requirement, violations, warnings);
      this.validateInvariants(requirement, violations, warnings);
      this.validateErrors(requirement, violations, warnings);
      this.validateOutcomes(requirement, violations, warnings);
      this.validateCopilotMode(requirement, violations);

      // Determine overall status based on mode
      const status = this.determineStatus(violations, warnings, mode);

      // Generate report
      const report = {
        requirement_id: requirement.ID || 'UNKNOWN',
        requirement_file,
        mode,
        status,
        violations,
        warnings,
        execution_id: executionId,
        timestamp: new Date().toISOString()
      };

      // Write report if requested
      let report_path = null;
      if (output_report) {
        report_path = output_report;
        fs.writeFileSync(report_path, JSON.stringify(report, null, 2));
      }

      return {
        status,
        violations,
        warnings,
        report_path,
        requirement_id: requirement.ID
      };

    } catch (error) {
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Validate all 13 required fields are present
   */
  static validateRequiredFields(requirement, violations) {
    for (const field of REQUIRED_FIELDS) {
      if (requirement[field] === undefined) {
        violations.push({
          field,
          violation: `Missing required field: ${field}`,
          severity: 'ERROR',
          rule: 'REQUIRED_FIELDS'
        });
      }
    }
  }

  /**
   * Validate ID format. Pattern comes from the manifest (never hardcode rule
   * values here — aordl-standard.md §6). Accepts REQ-001 and REQ-NOTIF11 alike.
   */
  static validateID(requirement, violations) {
    if (requirement.ID) {
      if (!ID_PATTERN.test(requirement.ID)) {
        violations.push({
          field: 'ID',
          violation: `ID must be REQ- plus an optional subject prefix and a number (e.g. REQ-001 or REQ-NOTIF11). Got: ${requirement.ID}`,
          severity: 'ERROR',
          rule: 'ID_FORMAT'
        });
      }
    }
  }

  /**
   * Validate Actor is specific role (not generic)
   */
  static validateActor(requirement, violations, warnings) {
    if (requirement.Actor) {
      const actor = requirement.Actor.toLowerCase();

      // Check for generic actors
      for (const genericActor of GENERIC_ACTORS) {
        if (actor === genericActor) {
          violations.push({
            field: 'Actor',
            violation: `Actor cannot be generic "${requirement.Actor}". Use specific role (e.g., ProjectManager, Administrator)`,
            severity: 'ERROR',
            rule: 'GENERIC_ACTOR'
          });
        }
      }

      // Warn if actor is not capitalized
      if (requirement.Actor[0] !== requirement.Actor[0].toUpperCase()) {
        warnings.push({
          field: 'Actor',
          violation: 'Actor should be capitalized (e.g., ProjectManager)',
          severity: 'WARNING',
          rule: 'ACTOR_CAPITALIZATION'
        });
      }
    }
  }

  /**
   * Validate Intent uses approved verb + business object
   */
  static validateIntent(requirement, violations, warnings) {
    if (requirement.Intent) {
      const intent = requirement.Intent.toLowerCase().trim();
      const words = intent.split(/\s+/);

      if (words.length < 2) {
        violations.push({
          field: 'Intent',
          violation: 'Intent must be "<verb> <business-object>" format. Missing business object.',
          severity: 'ERROR',
          rule: 'INTENT_FORMAT'
        });
        return;
      }

      const verb = words[0];
      const businessObject = words.slice(1).join(' ');

      // Check if verb is approved
      if (!APPROVED_VERBS.includes(verb)) {
        // Check if it's an ambiguous verb
        if (AMBIGUOUS_VERBS.includes(verb)) {
          violations.push({
            field: 'Intent',
            violation: `Ambiguous verb "${verb}". Use specific verb (create, update, delete, etc.)`,
            severity: 'ERROR',
            rule: 'AMBIGUOUS_VERB'
          });
        } else {
          warnings.push({
            field: 'Intent',
            violation: `Verb "${verb}" not in approved list. Approved: ${APPROVED_VERBS.join(', ')}`,
            severity: 'WARNING',
            rule: 'UNAPPROVED_VERB'
          });
        }
      }

      // Check for compound intents (multiple verbs)
      const verbsFound = words.filter(word => APPROVED_VERBS.includes(word));
      if (verbsFound.length > 1) {
        violations.push({
          field: 'Intent',
          violation: `Compound intent detected (multiple verbs: ${verbsFound.join(', ')}). Use single atomic intent.`,
          severity: 'ERROR',
          rule: 'COMPOUND_INTENT'
        });
      }

      // Check for UI language in intent
      for (const uiKeyword of UI_KEYWORDS) {
        if (intent.includes(uiKeyword)) {
          violations.push({
            field: 'Intent',
            violation: `Intent contains UI language: "${uiKeyword}". Use business intent, not UI action.`,
            severity: 'ERROR',
            rule: 'UI_LANGUAGE_IN_INTENT'
          });
        }
      }
    }
  }

  /**
   * Check if content is whitelisted (contains business-appropriate terms)
   */
  static isWhitelisted(content) {
    const contentLower = content.toLowerCase();
    return BUSINESS_WHITELISTED_TERMS.some(term => contentLower.includes(term.toLowerCase()));
  }

  /**
   * Validate anti-patterns across all fields
   */
  static validateAntiPatterns(requirement, violations, warnings) {
    const fieldsToCheck = [
      'Intent',
      'Preconditions',
      'Conditions',
      'Postconditions',
      'Outcomes',
      'Invariants'
    ];

    for (const field of fieldsToCheck) {
      if (requirement[field]) {
        const originalContent = JSON.stringify(requirement[field]);
        const content = originalContent.toLowerCase();

        // Skip technical jargon check if content contains whitelisted business terms
        const isWhitelisted = this.isWhitelisted(originalContent);

        // Check for UI language (whole word match)
        for (const uiKeyword of UI_KEYWORDS) {
          const regex = new RegExp(`\\b${uiKeyword}\\b`, 'i');
          if (regex.test(content)) {
            violations.push({
              field,
              violation: `Contains UI language: "${uiKeyword}". Describe business logic, not UI.`,
              severity: 'ERROR',
              rule: 'UI_LANGUAGE'
            });
          }
        }

        // Check for technical jargon (whole word match) - skip if whitelisted
        if (!isWhitelisted) {
          for (const techKeyword of TECHNICAL_KEYWORDS) {
            const regex = new RegExp(`\\b${techKeyword}\\b`, 'i');
            if (regex.test(content)) {
              violations.push({
                field,
                violation: `Contains technical jargon: "${techKeyword}". Use business language.`,
                severity: 'ERROR',
                rule: 'TECHNICAL_JARGON'
              });
            }
          }
        }
      }
    }
  }

  /**
   * Validate Invariants are domain truths
   */
  static validateInvariants(requirement, violations, warnings) {
    if (requirement.Invariants && Array.isArray(requirement.Invariants)) {
      if (requirement.Invariants.length === 0) {
        warnings.push({
          field: 'Invariants',
          violation: 'Invariants list is empty. Consider adding business rules.',
          severity: 'WARNING',
          rule: 'EMPTY_INVARIANTS'
        });
      }

      // Check each invariant
      for (const invariant of requirement.Invariants) {
        if (typeof invariant === 'string') {
          const inv = invariant.toLowerCase();

          // Warn if invariant looks like implementation detail
          if (inv.includes('database') || inv.includes('table') || inv.includes('column')) {
            warnings.push({
              field: 'Invariants',
              violation: `Invariant may be too implementation-specific: "${invariant}". Focus on business rules.`,
              severity: 'WARNING',
              rule: 'IMPLEMENTATION_INVARIANT'
            });
          }
        }
      }
    }
  }

  /**
   * Validate Errors have both condition and message
   */
  static validateErrors(requirement, violations, warnings) {
    if (requirement.Errors && Array.isArray(requirement.Errors)) {
      if (requirement.Errors.length === 0) {
        warnings.push({
          field: 'Errors',
          violation: 'No error conditions defined. Consider adding error scenarios.',
          severity: 'WARNING',
          rule: 'NO_ERRORS'
        });
      }

      for (let i = 0; i < requirement.Errors.length; i++) {
        const error = requirement.Errors[i];

        if (!error.error && !error.condition) {
          violations.push({
            field: 'Errors',
            violation: `Error #${i + 1} missing "error" or "condition" field`,
            severity: 'ERROR',
            rule: 'ERROR_MISSING_CONDITION'
          });
        }

        if (!error.message) {
          violations.push({
            field: 'Errors',
            violation: `Error #${i + 1} missing "message" field`,
            severity: 'ERROR',
            rule: 'ERROR_MISSING_MESSAGE'
          });
        }
      }
    }
  }

  /**
   * Validate Outcomes are observable
   */
  static validateOutcomes(requirement, violations, warnings) {
    if (requirement.Outcomes && Array.isArray(requirement.Outcomes)) {
      if (requirement.Outcomes.length === 0) {
        violations.push({
          field: 'Outcomes',
          violation: 'Outcomes list is empty. Add observable results from Actor perspective.',
          severity: 'ERROR',
          rule: 'EMPTY_OUTCOMES'
        });
      }

      // Check for vague outcomes
      for (const outcome of requirement.Outcomes) {
        if (typeof outcome === 'string') {
          const out = outcome.toLowerCase();

          if (out.includes('improved') || out.includes('better') || out.includes('enhanced')) {
            warnings.push({
              field: 'Outcomes',
              violation: `Outcome may be too vague: "${outcome}". Be specific and measurable.`,
              severity: 'WARNING',
              rule: 'VAGUE_OUTCOME'
            });
          }
        }
      }
    }
  }

  /**
   * Validate CopilotMode is set
   */
  static validateCopilotMode(requirement, violations) {
    if (requirement.CopilotMode) {
      const validModes = ['STRICT', 'GUIDED', 'PERMISSIVE'];
      if (!validModes.includes(requirement.CopilotMode)) {
        violations.push({
          field: 'CopilotMode',
          violation: `CopilotMode must be one of: ${validModes.join(', ')}. Got: ${requirement.CopilotMode}`,
          severity: 'ERROR',
          rule: 'INVALID_COPILOT_MODE'
        });
      }
    }
  }

  /**
   * Determine overall status based on violations and mode
   */
  static determineStatus(violations, warnings, mode) {
    if (mode === 'STRICT') {
      // Any violation = FAIL
      return violations.length === 0 ? 'PASS' : 'FAIL';
    } else if (mode === 'GUIDED') {
      // Only errors fail (not warnings)
      const errors = violations.filter(v => v.severity === 'ERROR');
      return errors.length === 0 ? 'PASS' : 'FAIL';
    } else if (mode === 'PERMISSIVE') {
      // Always pass, just report issues
      return 'PASS';
    }

    return 'FAIL';
  }
}

module.exports = ValidateAORDL;

// ---------------------------------------------------------------------------
// CLI. Added 2026-09-08 (CHG-067, increment 56). The AORDL gate at P1 is
// declared mechanical, but this file shipped as a library with no way to run
// it, so the gate was never actually enforceable. Usage:
//
//   node validate-aordl.js <file-or-directory> [...] [--mode STRICT|GUIDED|PERMISSIVE] [--json]
//
// Exit code 0 when every file passes, 1 when any fails, 2 on a usage or read
// error — so a caller can record the fact without parsing prose.
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const asJson = argv.includes('--json');
    const modeIdx = argv.indexOf('--mode');
    const mode = modeIdx !== -1 ? argv[modeIdx + 1] : 'STRICT';
    const targets = argv.filter((a, i) =>
      !a.startsWith('--') && !(modeIdx !== -1 && i === modeIdx + 1));

    if (targets.length === 0) {
      console.error('usage: validate-aordl.js <file-or-directory> [...] [--mode STRICT|GUIDED|PERMISSIVE] [--json]');
      process.exit(2);
    }
    if (!['STRICT', 'GUIDED', 'PERMISSIVE'].includes(mode)) {
      console.error(`unknown mode "${mode}" — expected STRICT, GUIDED or PERMISSIVE`);
      process.exit(2);
    }

    // Expand directories to the REQ-*.yaml files directly inside them.
    const files = [];
    for (const t of targets) {
      let st;
      try { st = fs.statSync(t); }
      catch { console.error(`cannot read ${t}`); process.exit(2); }
      if (st.isDirectory()) {
        files.push(...fs.readdirSync(t)
          .filter(f => /^REQ-.*\.ya?ml$/.test(f))
          .sort()
          .map(f => path.join(t, f)));
      } else {
        files.push(t);
      }
    }
    if (files.length === 0) {
      console.error('no REQ-*.yaml files found in the given paths');
      process.exit(2);
    }

    // A file that cannot be read or parsed is a FAIL for that file, never a
    // crash of the run — one malformed requirement must not hide the state of
    // the other ninety-seven.
    const reports = [];
    for (const f of files) {
      try {
        reports.push(await ValidateAORDL.execute({ requirement_file: f, mode }, 'cli'));
      } catch (err) {
        reports.push({
          requirement_id: path.basename(f, path.extname(f)),
          requirement_file: f,
          mode,
          status: 'FAIL',
          violations: [{
            field: 'FILE',
            violation: `File could not be read or parsed: ${err.message}`,
            severity: 'ERROR',
            rule: 'UNPARSEABLE'
          }],
          warnings: [],
          execution_id: 'cli',
          timestamp: new Date().toISOString()
        });
      }
    }
    const failed = reports.filter(r => r.status !== 'PASS');

    if (asJson) {
      console.log(JSON.stringify({
        mode,
        total: reports.length,
        passed: reports.length - failed.length,
        failed: failed.length,
        reports
      }, null, 2));
    } else {
      for (const r of reports) {
        const v = (r.violations || []).length;
        const w = (r.warnings || []).length;
        if (r.status === 'PASS' && w === 0) continue;  // quiet on clean
        console.log(`${r.status.padEnd(4)}  ${r.requirement_id}  violations=${v} warnings=${w}`);
        for (const x of r.violations || []) console.log(`   VIOLATION ${x.rule} [${x.field}] ${x.violation}`);
        for (const x of r.warnings || []) console.log(`   WARNING   ${x.rule} [${x.field}] ${x.warning || x.violation}`);
      }
      console.log(`\n${mode}: ${reports.length - failed.length}/${reports.length} passed, ${failed.length} failed`);
    }
    process.exit(failed.length === 0 ? 0 : 1);
  })();
}
