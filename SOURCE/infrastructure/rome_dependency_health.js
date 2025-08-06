const https = require('https');
const fs = require('fs');
const path = require('path');

// Core dependencies for our project management application
const coreDependencies = {
  // Backend essentials
  'express': { minVersion: '4.18.0', purpose: 'Web framework' },
  'mongoose': { minVersion: '7.0.0', purpose: 'MongoDB ODM' },
  'jsonwebtoken': { minVersion: '9.0.0', purpose: 'JWT authentication' },
  'bcryptjs': { minVersion: '2.4.3', purpose: 'Password hashing' },
  'cors': { minVersion: '2.8.5', purpose: 'CORS middleware' },
  'dotenv': { minVersion: '16.0.0', purpose: 'Environment variables' },
  'express-validator': { minVersion: '7.0.0', purpose: 'Input validation' },
  'helmet': { minVersion: '7.0.0', purpose: 'Security headers' },
  'multer': { minVersion: '1.4.5', purpose: 'File upload' },
  'compression': { minVersion: '1.7.4', purpose: 'Response compression' },
  
  // Development dependencies
  'nodemon': { minVersion: '3.0.0', purpose: 'Development server', dev: true },
  'jest': { minVersion: '29.0.0', purpose: 'Testing framework', dev: true },
  'supertest': { minVersion: '6.3.0', purpose: 'API testing', dev: true },
  'eslint': { minVersion: '8.0.0', purpose: 'Code linting', dev: true },
  '@types/node': { minVersion: '18.0.0', purpose: 'TypeScript types', dev: true }
};

// Function to fetch package info from npm registry
async function fetchPackageInfo(packageName) {
  return new Promise((resolve, reject) => {
    https.get(`https://registry.npmjs.org/${packageName}/latest`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const info = JSON.parse(data);
          resolve(info);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Function to check if a package is maintained
function checkMaintenance(packageInfo) {
  const lastModified = new Date(packageInfo.time?.modified || packageInfo.time?.created);
  const daysSinceUpdate = (Date.now() - lastModified) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > 365) {
    return { status: '🔴 UNMAINTAINED', reason: `Last update: ${Math.floor(daysSinceUpdate)} days ago` };
  } else if (daysSinceUpdate > 180) {
    return { status: '🟡 IRREGULAR', reason: `Last update: ${Math.floor(daysSinceUpdate)} days ago` };
  } else {
    return { status: '🟢 ACTIVE', reason: `Last update: ${Math.floor(daysSinceUpdate)} days ago` };
  }
}

// Function to check version compatibility
function checkVersion(currentVersion, minVersion) {
  const current = currentVersion.split('.').map(Number);
  const min = minVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, min.length); i++) {
    const c = current[i] || 0;
    const m = min[i] || 0;
    if (c > m) return true;
    if (c < m) return false;
  }
  return true;
}

// Function to get alternative packages
function getAlternatives(packageName) {
  const alternatives = {
    'express': ['fastify', 'koa', 'hapi'],
    'mongoose': ['mongodb', 'prisma'],
    'jest': ['vitest', 'mocha', 'ava'],
    'bcryptjs': ['bcrypt', 'argon2']
  };
  return alternatives[packageName] || [];
}

async function assessDependencyHealth() {
  console.log('🔍 ROME Dependency Health Assessment');
  console.log('====================================\n');
  
  const results = {
    healthy: [],
    warnings: [],
    errors: []
  };
  
  console.log('📋 Checking npm registry access...');
  
  for (const [name, config] of Object.entries(coreDependencies)) {
    try {
      process.stdout.write(`Checking ${name}... `);
      const info = await fetchPackageInfo(name);
      
      // Check maintenance status
      const maintenance = checkMaintenance(info);
      
      // Check version compatibility
      const versionOk = checkVersion(info.version, config.minVersion);
      
      // Check for known vulnerabilities (simplified check)
      const hasVulnerabilities = info.bugs?.url?.includes('security') || false;
      
      // Get alternatives
      const alternatives = getAlternatives(name);
      
      const result = {
        name,
        purpose: config.purpose,
        currentVersion: info.version,
        minVersion: config.minVersion,
        maintenance,
        versionOk,
        hasVulnerabilities,
        alternatives,
        license: info.license || 'Unknown',
        isDev: config.dev || false
      };
      
      // Categorize result
      if (maintenance.status.includes('🔴') || hasVulnerabilities || !versionOk) {
        results.errors.push(result);
        console.log('❌');
      } else if (maintenance.status.includes('🟡')) {
        results.warnings.push(result);
        console.log('⚠️');
      } else {
        results.healthy.push(result);
        console.log('✅');
      }
      
    } catch (error) {
      console.log('❌');
      results.errors.push({
        name,
        error: error.message,
        purpose: config.purpose
      });
    }
  }
  
  // Generate report
  console.log('\n====================================');
  console.log('📊 DEPENDENCY HEALTH REPORT');
  console.log('====================================\n');
  
  console.log(`✅ Healthy packages: ${results.healthy.length}`);
  console.log(`⚠️  Packages with warnings: ${results.warnings.length}`);
  console.log(`❌ Packages with issues: ${results.errors.length}\n`);
  
  // Show detailed results
  if (results.errors.length > 0) {
    console.log('❌ CRITICAL ISSUES:');
    results.errors.forEach(pkg => {
      console.log(`\n  ${pkg.name} (${pkg.purpose})`);
      if (pkg.error) {
        console.log(`    Error: ${pkg.error}`);
      } else {
        console.log(`    Status: ${pkg.maintenance.status}`);
        console.log(`    Version: ${pkg.currentVersion} (min: ${pkg.minVersion})`);
        if (pkg.alternatives.length > 0) {
          console.log(`    Alternatives: ${pkg.alternatives.join(', ')}`);
        }
      }
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(pkg => {
      console.log(`\n  ${pkg.name} (${pkg.purpose})`);
      console.log(`    Status: ${pkg.maintenance.status}`);
      console.log(`    ${pkg.maintenance.reason}`);
    });
  }
  
  // Write detailed report to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      healthy: results.healthy.length,
      warnings: results.warnings.length,
      errors: results.errors.length
    },
    details: results,
    recommendations: generateRecommendations(results)
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'dependency_health_report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Detailed report saved to dependency_health_report.json');
  
  return results.errors.length === 0;
}

function generateRecommendations(results) {
  const recommendations = [];
  
  results.errors.forEach(pkg => {
    if (pkg.maintenance?.status.includes('UNMAINTAINED')) {
      recommendations.push({
        package: pkg.name,
        severity: 'HIGH',
        recommendation: `Replace ${pkg.name} with one of: ${pkg.alternatives.join(', ') || 'No direct alternatives'}`
      });
    }
  });
  
  results.warnings.forEach(pkg => {
    recommendations.push({
      package: pkg.name,
      severity: 'MEDIUM',
      recommendation: `Monitor ${pkg.name} for updates. Consider alternatives if maintenance doesn't improve.`
    });
  });
  
  return recommendations;
}

// Run the assessment
if (require.main === module) {
  assessDependencyHealth()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { assessDependencyHealth, coreDependencies };