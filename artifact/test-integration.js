#!/usr/bin/env node
/**
 * Test Integration Script
 * Validates that all updated services can load and use the centralized configuration
 */

const { config } = require('./config-loader');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Integration of Updated Services\n');

const cfg = config.load();

console.log('✅ Centralized Configuration Loaded from artifact/.env\n');

// Test each updated service
const tests = [
  {
    name: 'MCP Backend Configuration',
    path: '../ROME_SEARCH/vector_db/backend_ts/src/config/index.ts',
    check: () => {
      const filePath = path.resolve(__dirname, '../ROME_SEARCH/vector_db/backend_ts/src/config/index.ts');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('artifact/.env') && content.includes('MCP_SERVER_PORT');
      }
      return false;
    }
  },
  {
    name: 'CLI Tool Configuration',
    path: '../ROME_SEARCH/vector_db/cli/src/utils/config.ts',
    check: () => {
      const filePath = path.resolve(__dirname, '../ROME_SEARCH/vector_db/cli/src/utils/config.ts');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('artifact/.env') && content.includes('process.env.MCP_SERVER_HOST');
      }
      return false;
    }
  },
  {
    name: 'Coffee App Frontend Port Fix',
    path: '../coffee-ordering-webapp/frontend/lib/services/api_service.dart',
    check: () => {
      const filePath = path.resolve(__dirname, '../coffee-ordering-webapp/frontend/lib/services/api_service.dart');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Check that it's using port 3001 (correct) not 3012 (incorrect)
        return content.includes('localhost:3001') && !content.includes('localhost:3012');
      }
      return false;
    }
  },
  {
    name: 'Coffee App Backend Configuration',
    path: '../coffee-ordering-webapp/backend/src/server.ts',
    check: () => {
      const filePath = path.resolve(__dirname, '../coffee-ordering-webapp/backend/src/server.ts');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('artifact/.env');
      }
      return false;
    }
  },
  {
    name: 'Monitoring Backend Configuration',
    path: '../rome_search_experimental/monitoring_backend/config/monitor.config.js',
    check: () => {
      const filePath = path.resolve(__dirname, '../rome_search_experimental/monitoring_backend/config/monitor.config.js');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('artifact/.env') && content.includes('RSE_MONITORING_BACKEND_PORT');
      }
      return false;
    }
  },
  {
    name: 'Monitoring Frontend API Service',
    path: '../rome_search_experimental/monitoring_frontend/lib/services/api_service.dart',
    check: () => {
      const filePath = path.resolve(__dirname, '../rome_search_experimental/monitoring_frontend/lib/services/api_service.dart');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('RSE_MONITORING_BACKEND_URL');
      }
      return false;
    }
  },
  {
    name: 'Monitoring Frontend WebSocket Service',
    path: '../rome_search_experimental/monitoring_frontend/lib/services/websocket_service.dart',
    check: () => {
      const filePath = path.resolve(__dirname, '../rome_search_experimental/monitoring_frontend/lib/services/websocket_service.dart');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('RSE_MONITORING_WEBSOCKET_URL');
      }
      return false;
    }
  },
  {
    name: 'Docker Compose Integration',
    path: '../ROME_SEARCH/vector_db/infrastructure/docker-compose.yml',
    check: () => {
      const filePath = path.resolve(__dirname, '../ROME_SEARCH/vector_db/infrastructure/docker-compose.yml');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('artifact/.env') && content.includes('${WEAVIATE_PORT');
      }
      return false;
    }
  }
];

console.log('🔍 Checking Updated Service Configurations:\n');

let passCount = 0;
let failCount = 0;

tests.forEach((test, index) => {
  const passed = test.check();
  const status = passed ? '✅' : '❌';
  const result = passed ? 'PASS' : 'FAIL';
  
  console.log(`${index + 1}. ${status} ${test.name}: ${result}`);
  
  if (passed) {
    passCount++;
  } else {
    failCount++;
    console.log(`   📁 Check: ${test.path}`);
  }
});

console.log('\n📊 Integration Test Results:');
console.log(`   ✅ Passed: ${passCount}/${tests.length}`);
console.log(`   ❌ Failed: ${failCount}/${tests.length}`);

if (failCount === 0) {
  console.log('\n🎉 All service configurations successfully updated!');
  console.log('\n📋 Configuration Summary:');
  console.log(`   • MCP Server: ${cfg.services.mcp.url}`);
  console.log(`   • Monitoring Backend: ${cfg.services.monitoring.backend.url}`);
  console.log(`   • Monitoring Frontend: ${cfg.services.monitoring.frontend.url}`);
  console.log(`   • Weaviate Database: ${cfg.services.weaviate.url}`);
  console.log(`   • Coffee App Backend: ${cfg.services.coffee.backend.url}`);
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Restart all services to load new configuration');
  console.log('   2. Test connectivity between services');
  console.log('   3. Verify monitoring console shows correct status');
  console.log('   4. Test CLI with new environment variables');
} else {
  console.log('\n⚠️  Some configurations need manual verification.');
  console.log('   Please check the failed items above.');
}

console.log('\n📝 To test service connectivity:');
console.log('   node artifact/test-connectivity.js');