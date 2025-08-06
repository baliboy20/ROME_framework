#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Test Runner for Project Management Application Database Tests
 * Provides comprehensive testing capabilities with coverage reporting
 */

class TestRunner {
  constructor() {
    this.testDir = __dirname;
    this.rootDir = path.join(__dirname, '..');
    this.coverageDir = path.join(this.testDir, 'coverage');
  }

  async checkDependencies() {
    try {
      const packageJsonPath = path.join(this.testDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      console.log('📦 Checking test dependencies...');
      
      // Check if node_modules exists
      try {
        await fs.access(path.join(this.testDir, 'node_modules'));
        console.log('✅ Test dependencies are installed');
        return true;
      } catch {
        console.log('❌ Test dependencies not found');
        console.log('💡 Run: cd tests && npm install');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking dependencies:', error.message);
      return false;
    }
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Running: ${command} ${args.join(' ')}`);
      
      const child = spawn(command, args, {
        cwd: this.testDir,
        stdio: 'inherit',
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runAllTests() {
    try {
      console.log('🧪 Running all database model tests...\n');
      await this.runCommand('npm', ['test']);
      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Test run failed:', error.message);
      throw error;
    }
  }

  async runTestsWithCoverage() {
    try {
      console.log('📊 Running tests with coverage analysis...\n');
      await this.runCommand('npm', ['run', 'test:coverage']);
      
      // Display coverage information
      const coverageReportPath = path.join(this.coverageDir, 'lcov-report', 'index.html');
      try {
        await fs.access(coverageReportPath);
        console.log(`\n📊 Coverage report generated: ${coverageReportPath}`);
      } catch {
        console.log('\n📊 Coverage analysis completed (report not found)');
      }
      
      console.log('\n✅ Coverage analysis completed successfully!');
    } catch (error) {
      console.error('\n❌ Coverage analysis failed:', error.message);
      throw error;
    }
  }

  async runSpecificModel(modelName) {
    try {
      console.log(`🧪 Running tests for ${modelName} model...\n`);
      await this.runCommand('npm', ['run', `test:${modelName.toLowerCase()}`]);
      console.log(`\n✅ ${modelName} tests completed successfully!`);
    } catch (error) {
      console.error(`\n❌ ${modelName} tests failed:`, error.message);
      throw error;
    }
  }

  async runWatchMode() {
    try {
      console.log('👀 Starting test watch mode...\n');
      console.log('Press Ctrl+C to stop watching\n');
      await this.runCommand('npm', ['run', 'test:watch']);
    } catch (error) {
      console.error('\n❌ Watch mode failed:', error.message);
      throw error;
    }
  }

  async runCITests() {
    try {
      console.log('🤖 Running CI/CD tests...\n');
      await this.runCommand('npm', ['run', 'test:ci']);
      console.log('\n✅ CI tests completed successfully!');
    } catch (error) {
      console.error('\n❌ CI tests failed:', error.message);
      throw error;
    }
  }

  async installDependencies() {
    try {
      console.log('📦 Installing test dependencies...\n');
      await this.runCommand('npm', ['install']);
      console.log('\n✅ Dependencies installed successfully!');
    } catch (error) {
      console.error('\n❌ Dependency installation failed:', error.message);
      throw error;
    }
  }

  async showCoverage() {
    try {
      const coverageReportPath = path.join(this.coverageDir, 'lcov-report', 'index.html');
      const coverageExists = await fs.access(coverageReportPath).then(() => true).catch(() => false);
      
      if (coverageExists) {
        console.log(`📊 Coverage report: ${coverageReportPath}`);
        
        // Try to read coverage summary
        const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
        try {
          const summary = JSON.parse(await fs.readFile(coverageSummaryPath, 'utf8'));
          const total = summary.total;
          
          console.log('\n📊 Coverage Summary:');
          console.log(`   Lines: ${total.lines.pct}%`);
          console.log(`   Functions: ${total.functions.pct}%`);
          console.log(`   Branches: ${total.branches.pct}%`);
          console.log(`   Statements: ${total.statements.pct}%`);
        } catch {
          console.log('   (Detailed summary not available)');
        }
      } else {
        console.log('❌ No coverage report found. Run tests with coverage first:');
        console.log('   node run-tests.js coverage');
      }
    } catch (error) {
      console.error('❌ Error showing coverage:', error.message);
    }
  }

  async listTests() {
    try {
      console.log('📋 Available Test Suites:\n');
      
      const testFiles = await fs.readdir(path.join(this.testDir, 'unit', 'database'));
      const modelTests = testFiles.filter(file => file.endsWith('.model.test.js'));
      
      console.log('🗂️  Database Model Tests:');
      modelTests.forEach((file, index) => {
        const modelName = file.replace('.model.test.js', '');
        console.log(`   ${index + 1}. ${modelName} model`);
      });
      
      console.log('\n🚀 Available Commands:');
      console.log('   npm test              - Run all tests');
      console.log('   npm run test:coverage - Run tests with coverage');
      console.log('   npm run test:watch    - Run tests in watch mode');
      console.log('   npm run test:project  - Run project model tests');
      console.log('   npm run test:task     - Run task model tests');
      console.log('   npm run test:blog     - Run blog model tests');
      console.log('   npm run test:file     - Run file model tests');
      console.log('   npm run test:ci       - Run CI/CD tests');
      
    } catch (error) {
      console.error('❌ Error listing tests:', error.message);
    }
  }

  async validateTestEnvironment() {
    console.log('🔍 Validating test environment...\n');
    
    const checks = [
      {
        name: 'Node.js version',
        check: async () => {
          const version = process.version;
          const majorVersion = parseInt(version.slice(1).split('.')[0]);
          return majorVersion >= 16;
        },
        requirement: 'Node.js 16 or higher'
      },
      {
        name: 'Test directory structure',
        check: async () => {
          const requiredDirs = ['unit/database', 'setup'];
          for (const dir of requiredDirs) {
            await fs.access(path.join(this.testDir, dir));
          }
          return true;
        },
        requirement: 'Proper test directory structure'
      },
      {
        name: 'Test files',
        check: async () => {
          const testFiles = [
            'unit/database/project.model.test.js',
            'unit/database/task.model.test.js',
            'unit/database/blog.model.test.js',
            'unit/database/file.model.test.js'
          ];
          for (const file of testFiles) {
            await fs.access(path.join(this.testDir, file));
          }
          return true;
        },
        requirement: 'All test files present'
      },
      {
        name: 'Configuration files',
        check: async () => {
          const configFiles = ['package.json', 'setup/jest.setup.js'];
          for (const file of configFiles) {
            await fs.access(path.join(this.testDir, file));
          }
          return true;
        },
        requirement: 'Test configuration files'
      }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      try {
        const passed = await check.check();
        if (passed) {
          console.log(`✅ ${check.name}`);
        } else {
          console.log(`❌ ${check.name} - ${check.requirement}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${check.name} - ${check.requirement}`);
        console.log(`   Error: ${error.message}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('\n🎉 Test environment is properly configured!');
      return true;
    } else {
      console.log('\n❌ Test environment has issues that need to be resolved.');
      return false;
    }
  }

  printUsage() {
    console.log(`
🧪 Database Test Runner - Project Management Application

Usage: node run-tests.js [command]

Commands:
  all                   Run all database model tests
  coverage             Run tests with coverage analysis
  watch                Run tests in watch mode (auto-rerun on changes)
  ci                   Run tests in CI/CD mode
  install              Install test dependencies
  
  project              Run project model tests only
  task                 Run task model tests only  
  blog                 Run blog model tests only
  file                 Run file model tests only
  
  list                 List all available tests
  coverage-report      Show coverage report
  validate             Validate test environment
  help                 Show this help message

Examples:
  node run-tests.js all
  node run-tests.js coverage
  node run-tests.js project
  node run-tests.js watch

Test Coverage Requirements:
  - Minimum 80% code coverage required
  - All model validation tests must pass
  - All instance and static method tests must pass
  - All edge case tests must pass

Environment:
  - Node.js 16+ required
  - MongoDB Memory Server for isolated testing
  - Jest testing framework
`);
  }
}

// Main execution
async function main() {
  const runner = new TestRunner();
  const command = process.argv[2] || 'help';
  
  try {
    switch (command.toLowerCase()) {
      case 'all':
      case 'run':
        if (!(await runner.checkDependencies())) {
          process.exit(1);
        }
        await runner.runAllTests();
        break;
        
      case 'coverage':
        if (!(await runner.checkDependencies())) {
          process.exit(1);
        }
        await runner.runTestsWithCoverage();
        break;
        
      case 'watch':
        if (!(await runner.checkDependencies())) {
          process.exit(1);
        }
        await runner.runWatchMode();
        break;
        
      case 'ci':
        if (!(await runner.checkDependencies())) {
          process.exit(1);
        }
        await runner.runCITests();
        break;
        
      case 'project':
      case 'task':
      case 'blog':
      case 'file':
        if (!(await runner.checkDependencies())) {
          process.exit(1);
        }
        await runner.runSpecificModel(command);
        break;
        
      case 'install':
        await runner.installDependencies();
        break;
        
      case 'list':
        await runner.listTests();
        break;
        
      case 'coverage-report':
        await runner.showCoverage();
        break;
        
      case 'validate':
        const isValid = await runner.validateTestEnvironment();
        process.exit(isValid ? 0 : 1);
        
      case 'help':
      default:
        runner.printUsage();
        break;
    }
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Test runner interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Test runner terminated');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TestRunner;