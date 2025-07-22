#!/usr/bin/env node
/**
 * ROME Configuration Test Script
 * Validates that all services can load and use the centralized configuration
 */

const { config, validate, isServiceConfigured } = require('./config-loader');

console.log('🧪 Testing ROME Centralized Configuration\n');

try {
  // Load configuration
  const cfg = config.load();
  
  // Validate required settings
  console.log('1️⃣ Validating required configuration...');
  validate();
  console.log('   ✅ All required settings present\n');
  
  // Test service configurations
  console.log('2️⃣ Testing service configurations...');
  const services = ['mcp', 'monitoring', 'weaviate', 'coffee'];
  
  services.forEach(service => {
    const configured = isServiceConfigured(service);
    const status = configured ? '✅' : '❌';
    console.log(`   ${status} ${service.toUpperCase()} service: ${configured ? 'configured' : 'missing'}`);
  });
  
  console.log('\n3️⃣ Service URLs:');
  console.log(`   • MCP Server:      ${cfg.services.mcp.url}`);
  console.log(`   • Monitor Backend: ${cfg.services.monitoring.backend.url}`);
  console.log(`   • Monitor Frontend:${cfg.services.monitoring.frontend.url}`);
  console.log(`   • Weaviate:        ${cfg.services.weaviate.url}`);
  console.log(`   • Coffee Backend:  ${cfg.services.coffee.backend.url}`);
  
  console.log('\n4️⃣ Authentication:');
  console.log(`   • ROME API Key:    ${cfg.auth.romeApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   • OpenAI API Key:  ${cfg.auth.openaiApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   • JWT Secret:      ${cfg.auth.jwtSecret ? '✅ Set' : '❌ Missing'}`);
  
  console.log('\n5️⃣ Key Paths:');
  console.log(`   • ROME Docs:       ${cfg.paths.rome}`);
  console.log(`   • ROME Search:     ${cfg.paths.romeSearch}`);
  console.log(`   • Experimental:    ${cfg.paths.experimental}`);
  console.log(`   • Artifact Dir:    ${cfg.paths.artifact}`);
  
  console.log('\n6️⃣ Feature Flags:');
  console.log(`   • Expert Advisor:  ${cfg.features.expertAdvisor ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   • Advanced Search: ${cfg.features.advancedSearch ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   • Auto Reindexing: ${cfg.features.autoReindexing ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   • Debug Mode:      ${cfg.app.debugMode ? '✅ Enabled' : '❌ Disabled'}`);
  
  console.log('\n7️⃣ Cache & Performance:');
  console.log(`   • Cache Enabled:   ${cfg.cache.enabled ? '✅ Yes' : '❌ No'}`);
  console.log(`   • Cache TTL:       ${cfg.cache.ttl} seconds`);
  console.log(`   • Search Limit:    ${cfg.search.defaultLimit} (max: ${cfg.search.maxLimit})`);
  
  console.log('\n🎉 Configuration test completed successfully!');
  console.log('\n📋 Usage Examples:');
  console.log('');
  console.log('// Load in your Node.js application:');
  console.log("const { config } = require('./artifact/config-loader');");
  console.log('const cfg = config.load();');
  console.log('const mcpUrl = cfg.services.mcp.url;');
  console.log('');
  console.log('// Check service availability:');
  console.log("const mcpReady = config.isServiceConfigured('mcp');");
  console.log('');
  console.log('// Get specific section:');
  console.log("const authConfig = config.get('auth');");
  
} catch (error) {
  console.error('❌ Configuration test failed:', error.message);
  process.exit(1);
}