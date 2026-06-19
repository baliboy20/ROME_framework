#!/usr/bin/env node
/**
 * ROME Framework: MCP Server Dependency Validator
 *
 * Validates MCP server requirements in plugin.json files
 *
 * Usage:
 *   node validate-mcp-dependencies.js <plugin-name>     # Validate single plugin
 *   node validate-mcp-dependencies.js --all             # Validate all plugins
 *   node validate-mcp-dependencies.js --check-runtime   # Check runtime availability
 *
 * Reference: ROME-GOV-009 (MCP Server Dependencies)
 */

const fs = require('fs');
const path = require('path');

// Known MCP servers in ROME framework
const KNOWN_SERVERS = ['activity-log-file', 'Seez', 'rome-terminal', 'iterm2-terminal'];

// Configuration
const ROME_ROOT = path.resolve(__dirname, '../..');
const PLUGIN_PATTERN = /^rome-(p\d+-\w+|core|qa)$/;

/**
 * Find all ROME plugin directories
 */
function findPlugins() {
  const entries = fs.readdirSync(ROME_ROOT, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory() && PLUGIN_PATTERN.test(entry.name))
    .map(entry => entry.name);
}

/**
 * Read and parse plugin.json
 */
function readPluginJson(pluginName) {
  const pluginPath = path.join(ROME_ROOT, pluginName, '.claude-plugin', 'plugin.json');

  if (!fs.existsSync(pluginPath)) {
    return { error: `plugin.json not found at ${pluginPath}` };
  }

  try {
    const content = fs.readFileSync(pluginPath, 'utf8');
    return { data: JSON.parse(content), path: pluginPath };
  } catch (err) {
    return { error: `Failed to parse plugin.json: ${err.message}` };
  }
}

/**
 * Validate MCP server declaration schema
 */
function validateSchema(mcpServers, pluginName) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(mcpServers)) {
    errors.push('requires.mcpServers must be an array');
    return { errors, warnings };
  }

  mcpServers.forEach((server, index) => {
    const prefix = `Server [${index}]`;

    // Required fields
    if (!server.name) {
      errors.push(`${prefix}: 'name' field is required`);
    } else if (typeof server.name !== 'string') {
      errors.push(`${prefix}: 'name' must be a string`);
    }

    if (!server.reason) {
      errors.push(`${prefix}: 'reason' field is required`);
    } else if (typeof server.reason !== 'string') {
      errors.push(`${prefix}: 'reason' must be a string`);
    } else {
      if (server.reason.length < 20) {
        warnings.push(`${prefix} (${server.name}): 'reason' is very short (< 20 chars), consider adding more context`);
      }
      if (server.reason.length > 200) {
        warnings.push(`${prefix} (${server.name}): 'reason' is very long (> 200 chars), consider being more concise`);
      }
    }

    if (server.optional === undefined) {
      errors.push(`${prefix} (${server.name}): 'optional' field is required`);
    } else if (typeof server.optional !== 'boolean') {
      errors.push(`${prefix} (${server.name}): 'optional' must be a boolean`);
    }
  });

  return { errors, warnings };
}

/**
 * Validate semantic rules
 */
function validateSemantics(mcpServers, pluginName) {
  const errors = [];
  const warnings = [];

  // Check for activity-log-file requirement
  const activityLog = mcpServers.find(s => s.name === 'activity-log-file');

  if (!activityLog) {
    errors.push('Missing required server: activity-log-file (mandatory per ROME-PROC-005)');
  } else if (activityLog.optional === true) {
    errors.push('activity-log-file cannot be optional (mandatory per ROME-PROC-005)');
  }

  // Check for unknown servers
  mcpServers.forEach(server => {
    if (server.name && !KNOWN_SERVERS.includes(server.name)) {
      warnings.push(`Unknown MCP server: ${server.name} (not in standard ROME server list)`);
    }
  });

  // Check for duplicate servers
  const names = mcpServers.map(s => s.name).filter(Boolean);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate server declarations: ${[...new Set(duplicates)].join(', ')}`);
  }

  return { errors, warnings };
}

/**
 * Validate single plugin
 */
function validatePlugin(pluginName, verbose = true) {
  if (verbose) {
    console.log(`\n📦 Validating plugin: ${pluginName}`);
    console.log('='.repeat(50));
  }

  const result = readPluginJson(pluginName);

  if (result.error) {
    console.log(`❌ ${result.error}`);
    return { success: false, errors: [result.error], warnings: [] };
  }

  const { data: plugin, path: pluginPath } = result;

  if (verbose) {
    console.log(`📄 Path: ${pluginPath}`);
  }

  // Check if plugin declares MCP requirements
  if (!plugin.requires || !plugin.requires.mcpServers) {
    console.log(`⚠️  No MCP server requirements declared`);
    console.log(`   Consider adding 'requires.mcpServers' section per ROME-GOV-009`);
    return { success: true, errors: [], warnings: ['No MCP requirements declared'] };
  }

  const mcpServers = plugin.requires.mcpServers;

  if (verbose) {
    console.log(`\n📋 Declared MCP Servers (${mcpServers.length}):`);
    mcpServers.forEach(server => {
      const optionalLabel = server.optional ? '(optional)' : '(required)';
      console.log(`   • ${server.name || '<missing name>'} ${optionalLabel}`);
      if (server.reason) {
        console.log(`     Reason: ${server.reason}`);
      }
    });
  }

  // Run validations
  const schemaValidation = validateSchema(mcpServers, pluginName);
  const semanticValidation = validateSemantics(mcpServers, pluginName);

  const allErrors = [...schemaValidation.errors, ...semanticValidation.errors];
  const allWarnings = [...schemaValidation.warnings, ...semanticValidation.warnings];

  // Print results
  if (allErrors.length > 0) {
    console.log(`\n❌ Errors (${allErrors.length}):`);
    allErrors.forEach(err => console.log(`   • ${err}`));
  }

  if (allWarnings.length > 0) {
    console.log(`\n⚠️  Warnings (${allWarnings.length}):`);
    allWarnings.forEach(warn => console.log(`   • ${warn}`));
  }

  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log(`\n✅ Validation passed!`);
  }

  return {
    success: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Validate all plugins
 */
function validateAll() {
  console.log('🔍 Scanning for ROME plugins...\n');

  const plugins = findPlugins();
  console.log(`Found ${plugins.length} plugins: ${plugins.join(', ')}\n`);

  const results = plugins.map(plugin => ({
    plugin,
    ...validatePlugin(plugin, true)
  }));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log(`✅ Passed: ${passed}/${plugins.length}`);
  console.log(`❌ Failed: ${failed}/${plugins.length}`);
  console.log(`⚠️  Total Warnings: ${totalWarnings}`);

  if (failed > 0) {
    console.log('\n❌ Failed plugins:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.plugin} (${r.errors.length} errors)`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All plugins validated successfully!');
    process.exit(0);
  }
}

/**
 * Check runtime MCP server availability (placeholder)
 */
function checkRuntime() {
  console.log('🔌 Checking runtime MCP server availability...\n');
  console.log('⚠️  Runtime validation not yet implemented');
  console.log('   This would test actual MCP server connectivity');
  console.log('   See: ROME-GOV-009 for runtime validation spec');
  process.exit(0);
}

/**
 * Print usage
 */
function printUsage() {
  console.log('ROME Framework: MCP Server Dependency Validator');
  console.log('Reference: ROME-GOV-009\n');
  console.log('Usage:');
  console.log('  node validate-mcp-dependencies.js <plugin-name>     # Validate single plugin');
  console.log('  node validate-mcp-dependencies.js --all             # Validate all plugins');
  console.log('  node validate-mcp-dependencies.js --check-runtime   # Check runtime availability');
  console.log('\nExamples:');
  console.log('  node validate-mcp-dependencies.js robot-plugins/talib');
  console.log('  node validate-mcp-dependencies.js --all');
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const command = args[0];

  if (command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  if (command === '--all') {
    validateAll();
  } else if (command === '--check-runtime') {
    checkRuntime();
  } else {
    // Validate single plugin
    const result = validatePlugin(command, true);
    process.exit(result.success ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validatePlugin,
  validateAll,
  findPlugins,
  validateSchema,
  validateSemantics
};
