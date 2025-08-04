#!/usr/bin/env node
// =================================
// HEALTH CHECK SCRIPT
// =================================
// Comprehensive health check for all system components

import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../../');

// Configuration
const HEALTH_CHECKS = {
  backend: {
    name: 'Backend API',
    url: 'http://localhost:3000/health',
    timeout: 5000,
    critical: true
  },
  frontend: {
    name: 'Frontend App',
    url: 'http://localhost:5000',
    timeout: 3000,
    critical: false
  },
  mongodb: {
    name: 'MongoDB Database',
    command: 'mongosh --eval "db.adminCommand(\'ping\')" --quiet',
    timeout: 5000,
    critical: true
  }
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP health check
function checkHttpEndpoint(config) {
  return new Promise((resolve) => {
    const url = new URL(config.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(config.url, {
      timeout: config.timeout,
      headers: {
        'User-Agent': 'MFE-Health-Check/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const isHealthy = res.statusCode >= 200 && res.statusCode < 400;
        resolve({
          name: config.name,
          status: isHealthy ? 'healthy' : 'unhealthy',
          details: {
            statusCode: res.statusCode,
            responseTime: Date.now() - startTime,
            response: data.substring(0, 200)
          },
          critical: config.critical
        });
      });
    });
    
    const startTime = Date.now();
    
    req.on('error', (error) => {
      resolve({
        name: config.name,
        status: 'error',
        details: {
          error: error.message,
          responseTime: Date.now() - startTime
        },
        critical: config.critical
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: config.name,
        status: 'timeout',
        details: {
          error: `Timeout after ${config.timeout}ms`,
          responseTime: config.timeout
        },
        critical: config.critical
      });
    });
  });
}

// Command health check
function checkCommand(config) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      const output = execSync(config.command, {
        timeout: config.timeout,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      resolve({
        name: config.name,
        status: 'healthy',
        details: {
          responseTime: Date.now() - startTime,
          output: output.trim().substring(0, 200)
        },
        critical: config.critical
      });
    } catch (error) {
      resolve({
        name: config.name,
        status: 'error',
        details: {
          error: error.message,
          responseTime: Date.now() - startTime
        },
        critical: config.critical
      });
    }
  });
}

// Check system resources
function checkSystemResources() {
  return new Promise((resolve) => {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const memPercent = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
      
      // CPU load (approximate)
      const loadAvg = require('os').loadavg();
      
      // Disk space for data directory
      let diskUsage = 'N/A';
      try {
        const df = execSync('df -h ./data', { encoding: 'utf8', stdio: 'pipe' });
        diskUsage = df.split('\n')[1]?.split(/\s+/)[4] || 'N/A';
      } catch (e) {
        // Ignore disk check errors
      }
      
      const isHealthy = memPercent < 90 && loadAvg[0] < 10;
      
      resolve({
        name: 'System Resources',
        status: isHealthy ? 'healthy' : 'warning',
        details: {
          memory: {
            used: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
            total: `${(totalMem / 1024 / 1024 / 1024).toFixed(1)} GB`,
            percent: `${memPercent}%`
          },
          cpu: {
            load1min: loadAvg[0].toFixed(2),
            load5min: loadAvg[1].toFixed(2),
            load15min: loadAvg[2].toFixed(2)
          },
          disk: diskUsage
        },
        critical: false
      });
    } catch (error) {
      resolve({
        name: 'System Resources',
        status: 'error',
        details: { error: error.message },
        critical: false
      });
    }
  });
}

// Check environment configuration
function checkEnvironment() {
  return new Promise((resolve) => {
    const envPath = join(ROOT_DIR, '.env');
    
    if (!existsSync(envPath)) {
      resolve({
        name: 'Environment Config',
        status: 'error',
        details: { error: '.env file not found' },
        critical: true
      });
      return;
    }
    
    try {
      const envContent = readFileSync(envPath, 'utf8');
      const requiredVars = ['NODE_ENV', 'PORT', 'MONGODB_URI'];
      
      const missingVars = requiredVars.filter(varName => {
        const regex = new RegExp(`^${varName}=.+`, 'm');
        return !regex.test(envContent);
      });
      
      const isHealthy = missingVars.length === 0;
      
      resolve({
        name: 'Environment Config',
        status: isHealthy ? 'healthy' : 'warning',
        details: {
          configFile: '.env exists',
          missingVars: missingVars.length > 0 ? missingVars : undefined
        },
        critical: false
      });
    } catch (error) {
      resolve({
        name: 'Environment Config',
        status: 'error',
        details: { error: error.message },
        critical: false
      });
    }
  });
}

// Run all health checks
async function runHealthChecks() {
  log('🏥 Medium Flutter Extractor - Health Check\n', 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  log('─'.repeat(60), 'blue');
  
  const results = [];
  
  // HTTP endpoint checks
  for (const [key, config] of Object.entries(HEALTH_CHECKS)) {
    if (config.url) {
      const result = await checkHttpEndpoint(config);
      results.push(result);
    } else if (config.command) {
      const result = await checkCommand(config);
      results.push(result);
    }
  }
  
  // Additional checks
  results.push(await checkSystemResources());
  results.push(await checkEnvironment());
  
  // Display results
  let overallHealthy = true;
  let criticalIssues = 0;
  
  results.forEach(result => {
    const icon = result.status === 'healthy' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌';
    const color = result.status === 'healthy' ? 'green' :
                  result.status === 'warning' ? 'yellow' : 'red';
    
    log(`${icon} ${result.name}`, color);
    
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object') {
            log(`   ${key}:`, 'blue');
            Object.entries(value).forEach(([subKey, subValue]) => {
              log(`     ${subKey}: ${subValue}`, 'blue');
            });
          } else {
            log(`   ${key}: ${value}`, 'blue');
          }
        }
      });
    }
    
    if (result.status !== 'healthy') {
      overallHealthy = false;
      if (result.critical) {
        criticalIssues++;
      }
    }
    
    log(''); // Empty line for spacing
  });
  
  // Summary
  log('─'.repeat(60), 'blue');
  if (overallHealthy) {
    log('🎉 All systems healthy!', 'green');
  } else if (criticalIssues > 0) {
    log(`❌ ${criticalIssues} critical issue(s) found`, 'red');
  } else {
    log('⚠️  Some warnings detected', 'yellow');
  }
  
  // Return appropriate exit code
  process.exit(criticalIssues > 0 ? 1 : 0);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthChecks().catch(error => {
    log(`Health check failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

export default runHealthChecks;