const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class InfrastructureValidator {
  constructor() {
    this.results = {
      passed: [],
      warnings: [],
      failed: []
    };
  }

  /**
   * Run all infrastructure validation checks
   */
  async validateAll() {
    console.log('🔍 Infrastructure Validation Started\n');
    
    await this.validateProjectStructure();
    await this.validatePackageJson();
    await this.validateEnvironmentFiles();
    await this.validateServerFile();
    await this.validateTestSuite();
    await this.validateDatabaseConfig();
    
    this.generateReport();
    return this.results.failed.length === 0;
  }

  /**
   * Validate project structure exists
   */
  async validateProjectStructure() {
    console.log('📋 Validating project structure...');
    
    const requiredDirectories = [
      '../backend',
      '../infrastructure',
      '../tests',
      '../tests/unit'
    ];
    
    const requiredFiles = [
      '../backend/package.json',
      '../backend/server.js',
      '../backend/.env',
      '../backend/.env.example',
      '../backend/config/database.js'
    ];
    
    // Check directories
    for (const dir of requiredDirectories) {
      const fullPath = path.resolve(__dirname, dir);
      if (fs.existsSync(fullPath)) {
        this.results.passed.push(`Directory exists: ${dir}`);
      } else {
        this.results.failed.push(`Missing directory: ${dir}`);
      }
    }
    
    // Check files
    for (const file of requiredFiles) {
      const fullPath = path.resolve(__dirname, file);
      if (fs.existsSync(fullPath)) {
        this.results.passed.push(`File exists: ${file}`);
      } else {
        this.results.failed.push(`Missing file: ${file}`);
      }
    }
  }

  /**
   * Validate package.json configuration
   */
  async validatePackageJson() {
    console.log('📋 Validating package.json...');
    
    try {
      const packagePath = path.resolve(__dirname, '../backend/package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check required fields
      const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
      for (const field of requiredFields) {
        if (packageJson[field]) {
          this.results.passed.push(`package.json has ${field}`);
        } else {
          this.results.failed.push(`package.json missing ${field}`);
        }
      }
      
      // Check required dependencies
      const requiredDeps = [
        'express', 'mongoose', 'jsonwebtoken', 'bcryptjs', 
        'cors', 'dotenv', 'express-validator', 'helmet'
      ];
      
      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.results.passed.push(`Dependency exists: ${dep}`);
        } else {
          this.results.failed.push(`Missing dependency: ${dep}`);
        }
      }
      
      // Check test configuration
      if (packageJson.jest) {
        this.results.passed.push('Jest configuration exists');
        
        if (packageJson.jest.coverageThreshold) {
          this.results.passed.push('Coverage threshold configured');
        } else {
          this.results.warnings.push('No coverage threshold set');
        }
      } else {
        this.results.warnings.push('No Jest configuration found');
      }
      
    } catch (error) {
      this.results.failed.push(`Failed to read package.json: ${error.message}`);
    }
  }

  /**
   * Validate environment files
   */
  async validateEnvironmentFiles() {
    console.log('📋 Validating environment configuration...');
    
    const envFiles = ['.env', '.env.example'];
    const requiredVars = [
      'NODE_ENV', 'PORT', 'MONGODB_URI', 'MONGODB_TEST_URI', 
      'JWT_SECRET', 'JWT_EXPIRE'
    ];
    
    for (const envFile of envFiles) {
      try {
        const envPath = path.resolve(__dirname, `../backend/${envFile}`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        this.results.passed.push(`Environment file exists: ${envFile}`);
        
        // Check for required variables
        for (const variable of requiredVars) {
          if (envContent.includes(`${variable}=`)) {
            this.results.passed.push(`${envFile} contains ${variable}`);
          } else {
            this.results.failed.push(`${envFile} missing ${variable}`);
          }
        }
        
        // Security checks
        if (envFile === '.env' && envContent.includes('change-in-production')) {
          this.results.warnings.push('JWT_SECRET contains placeholder text');
        }
        
      } catch (error) {
        this.results.failed.push(`Failed to read ${envFile}: ${error.message}`);
      }
    }
  }

  /**
   * Validate server file
   */
  async validateServerFile() {
    console.log('📋 Validating server configuration...');
    
    try {
      const serverPath = path.resolve(__dirname, '../backend/server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      // Check for required middleware
      const requiredMiddleware = [
        'helmet', 'cors', 'compression', 'express.json', 'morgan'
      ];
      
      for (const middleware of requiredMiddleware) {
        if (serverContent.includes(middleware)) {
          this.results.passed.push(`Server uses ${middleware} middleware`);
        } else {
          this.results.failed.push(`Server missing ${middleware} middleware`);
        }
      }
      
      // Check for health endpoint
      if (serverContent.includes('/health')) {
        this.results.passed.push('Health check endpoint exists');
      } else {
        this.results.failed.push('No health check endpoint');
      }
      
      // Check for error handling
      if (serverContent.includes('app.use((err, req, res, next)')) {
        this.results.passed.push('Global error handler exists');
      } else {
        this.results.failed.push('No global error handler');
      }
      
      // Check for graceful shutdown
      if (serverContent.includes('SIGTERM') && serverContent.includes('SIGINT')) {
        this.results.passed.push('Graceful shutdown handlers exist');
      } else {
        this.results.warnings.push('No graceful shutdown handlers');
      }
      
    } catch (error) {
      this.results.failed.push(`Failed to validate server file: ${error.message}`);
    }
  }

  /**
   * Validate test suite
   */
  async validateTestSuite() {
    console.log('📋 Validating test suite...');
    
    const testFiles = [
      'environment-validation.test.js',
      'backend-server.test.js',
      'database-connection.test.js',
      'database-config.test.js'
    ];
    
    for (const testFile of testFiles) {
      try {
        const testPath = path.resolve(__dirname, `../tests/unit/${testFile}`);
        if (fs.existsSync(testPath)) {
          this.results.passed.push(`Test file exists: ${testFile}`);
          
          const testContent = fs.readFileSync(testPath, 'utf8');
          
          // Check for test structure
          if (testContent.includes('describe(') && testContent.includes('test(')) {
            this.results.passed.push(`${testFile} has proper test structure`);
          } else {
            this.results.warnings.push(`${testFile} may have incomplete test structure`);
          }
          
        } else {
          this.results.failed.push(`Missing test file: ${testFile}`);
        }
      } catch (error) {
        this.results.failed.push(`Failed to validate ${testFile}: ${error.message}`);
      }
    }
  }

  /**
   * Validate database configuration
   */
  async validateDatabaseConfig() {
    console.log('📋 Validating database configuration...');
    
    try {
      const dbConfigPath = path.resolve(__dirname, '../backend/config/database.js');
      const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');
      
      // Check for required methods
      const requiredMethods = [
        'connect', 'disconnect', 'getConnectionStatus', 
        'isDbConnected', 'healthCheck'
      ];
      
      for (const method of requiredMethods) {
        if (dbConfigContent.includes(method)) {
          this.results.passed.push(`Database config has ${method} method`);
        } else {
          this.results.failed.push(`Database config missing ${method} method`);
        }
      }
      
      // Check for error handling
      if (dbConfigContent.includes('try') && dbConfigContent.includes('catch')) {
        this.results.passed.push('Database config has error handling');
      } else {
        this.results.warnings.push('Database config may lack error handling');
      }
      
    } catch (error) {
      this.results.failed.push(`Failed to validate database config: ${error.message}`);
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 INFRASTRUCTURE VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Passed: ${this.results.passed.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILURES:');
      this.results.failed.forEach(failure => console.log(`  - ${failure}`));
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed.length === 0) {
      console.log('✅ INFRASTRUCTURE VALIDATION PASSED!');
      console.log('Ready for development to proceed.');
    } else {
      console.log('❌ INFRASTRUCTURE VALIDATION FAILED!');
      console.log('Please address the failures above before proceeding.');
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Run validation tests with Jest
   */
  async runTests() {
    console.log('\n🧪 Running infrastructure tests...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test'], {
        cwd: path.resolve(__dirname, '../backend'),
        stdio: 'inherit'
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ All tests passed!');
          resolve(true);
        } else {
          console.log('❌ Some tests failed!');
          resolve(false);
        }
      });
      
      testProcess.on('error', (error) => {
        console.error('❌ Failed to run tests:', error.message);
        reject(error);
      });
    });
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new InfrastructureValidator();
  
  validator.validateAll()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = InfrastructureValidator;