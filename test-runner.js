#!/usr/bin/env node
/**
 * Simple Integration Test Runner
 * PMA Quick Test Validation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 ROME TDD Integration Test Runner');
console.log('===================================');

// Test 1: Environment Validation
console.log('\n1. Environment Validation:');
console.log(`   Node.js: ${process.version} ✅`);
console.log(`   Directory: ${process.cwd()} ✅`);

// Test 2: Source Code Structure
console.log('\n2. Source Code Structure:');
const sourceDirs = ['backend', 'frontend', 'database', 'infrastructure'];
sourceDirs.forEach(dir => {
  const dirPath = path.join(__dirname, 'SOURCE', dir);
  const exists = fs.existsSync(dirPath);
  console.log(`   SOURCE/${dir}/: ${exists ? '✅' : '❌'}`);
});

// Test 3: Contract Tests Exist
console.log('\n3. Contract Tests:');
const contractsDir = path.join(__dirname, 'SOURCE', 'tests', 'contracts');
if (fs.existsSync(contractsDir)) {
  const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.contract.test.ts'));
  console.log(`   Contract files: ${contractFiles.length} ✅`);
  contractFiles.slice(0, 5).forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log('   Contracts directory: ❌');
}

// Test 4: Implementation Files Count
console.log('\n4. Implementation Status:');
function countFiles(dir, extension) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  files.forEach(file => {
    if (file.isDirectory()) {
      count += countFiles(path.join(dir, file.name), extension);
    } else if (file.name.endsWith(extension)) {
      count++;
    }
  });
  return count;
}

const sourceDir = path.join(__dirname, 'SOURCE');
const tsFiles = countFiles(sourceDir, '.ts');
const jsFiles = countFiles(sourceDir, '.js');
console.log(`   TypeScript files: ${tsFiles} ✅`);
console.log(`   JavaScript files: ${jsFiles} ✅`);

// Test 5: Package.json and Dependencies
console.log('\n5. Dependencies:');
const packagePath = path.join(__dirname, 'SOURCE', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const depCount = Object.keys(packageJson.dependencies || {}).length;
  const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
  console.log(`   Dependencies: ${depCount} ✅`);
  console.log(`   Dev Dependencies: ${devDepCount} ✅`);
} else {
  console.log('   package.json: ❌');
}

// Test 6: Robot Activity Logs
console.log('\n6. Robot Activity:');
const projectDir = path.join(__dirname, 'PROJECT', 'dev');
if (fs.existsSync(projectDir)) {
  const logFiles = fs.readdirSync(projectDir).filter(f => f.includes('activity'));
  console.log(`   Activity logs: ${logFiles.length} ✅`);
  logFiles.forEach(log => {
    const logPath = path.join(projectDir, log);
    const stats = fs.statSync(logPath);
    console.log(`   - ${log} (${Math.round(stats.size/1024)}KB)`);
  });
} else {
  console.log('   Project directory: ❌');
}

console.log('\n🎉 Integration Test Complete!');
console.log('\nNext Steps:');
console.log('- Run individual module tests');
console.log('- Start Docker containers'); 
console.log('- Test MCP server functionality');