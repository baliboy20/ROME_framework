#!/usr/bin/env node
// =================================
// ENVIRONMENT SETUP SCRIPT
// =================================
// Automated environment configuration for Medium Flutter Extractor

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../../');

// Configuration
const REQUIRED_NODE_VERSION = '20.11.0';
const REQUIRED_DIRECTORIES = [
  'data',
  'data/articles',
  'data/logs',
  'data/temp',
  'logs',
  'backend/dist',
  'frontend/build'
];

// Color console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Check Node.js version
function checkNodeVersion() {
  logStep('1/8', 'Checking Node.js version...');
  
  const nodeVersion = process.version.substring(1); // Remove 'v' prefix
  const [major, minor, patch] = nodeVersion.split('.').map(Number);
  const [reqMajor, reqMinor, reqPatch] = REQUIRED_NODE_VERSION.split('.').map(Number);
  
  if (major < reqMajor || (major === reqMajor && minor < reqMinor) || 
      (major === reqMajor && minor === reqMinor && patch < reqPatch)) {
    logError(`Node.js ${REQUIRED_NODE_VERSION}+ required. Current: ${nodeVersion}`);
    process.exit(1);
  }
  
  logSuccess(`Node.js ${nodeVersion} ✓`);
}

// Create required directories
function createDirectories() {
  logStep('2/8', 'Creating required directories...');
  
  REQUIRED_DIRECTORIES.forEach(dir => {
    const fullPath = join(ROOT_DIR, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      log(`  Created: ${dir}`, 'green');
    } else {
      log(`  Exists: ${dir}`, 'yellow');
    }
  });
  
  logSuccess('Directory structure created');
}

// Setup environment files
function setupEnvironmentFiles() {
  logStep('3/8', 'Setting up environment files...');
  
  const envExamplePath = join(ROOT_DIR, '.env.example');
  const envPath = join(ROOT_DIR, '.env');
  
  if (!existsSync(envPath)) {
    if (existsSync(envExamplePath)) {
      const envContent = readFileSync(envExamplePath, 'utf8');
      writeFileSync(envPath, envContent);
      logSuccess('Created .env from .env.example');
      logWarning('Please update .env with your actual credentials');
    } else {
      logError('.env.example not found');
    }
  } else {
    logSuccess('.env file already exists');
  }
}

// Install dependencies
function installDependencies() {
  logStep('4/8', 'Installing dependencies...');
  
  try {
    // Install root dependencies
    log('  Installing root dependencies...', 'blue');
    execSync('npm install', { cwd: ROOT_DIR, stdio: 'pipe' });
    
    // Install workspace dependencies
    log('  Installing workspace dependencies...', 'blue');
    execSync('npm install --workspaces', { cwd: ROOT_DIR, stdio: 'pipe' });
    
    logSuccess('All dependencies installed');
  } catch (error) {
    logError(`Failed to install dependencies: ${error.message}`);
    process.exit(1);
  }
}

// Check MongoDB connection
function checkMongoDB() {
  logStep('5/8', 'Checking MongoDB connection...');
  
  try {
    // Try to connect to default MongoDB instance
    execSync('mongosh --eval "db.adminCommand(\'ping\')" --quiet', { stdio: 'pipe' });
    logSuccess('MongoDB connection ✓');
  } catch (error) {
    logWarning('MongoDB not accessible - please ensure MongoDB is running');
    log('  Install MongoDB: https://docs.mongodb.com/manual/installation/', 'blue');
    log('  Or use Docker: docker run -d -p 27017:27017 mongo:7.0', 'blue');
  }
}

// Validate environment configuration
function validateEnvironment() {
  logStep('6/8', 'Validating environment configuration...');
  
  const envPath = join(ROOT_DIR, '.env');
  if (!existsSync(envPath)) {
    logError('.env file not found');
    return;
  }
  
  const envContent = readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    return !regex.test(envContent) || envContent.includes(`${varName}=your-`);
  });
  
  if (missingVars.length > 0) {
    logWarning(`Please configure these environment variables in .env:`);
    missingVars.forEach(varName => log(`  - ${varName}`, 'yellow'));
  } else {
    logSuccess('Environment configuration looks good');
  }
}

// Setup Git hooks (optional)
function setupGitHooks() {
  logStep('7/8', 'Setting up Git hooks...');
  
  const gitHooksDir = join(ROOT_DIR, '.git/hooks');
  if (!existsSync(gitHooksDir)) {
    logWarning('Not a Git repository - skipping Git hooks');
    return;
  }
  
  // Pre-commit hook to check environment
  const preCommitHook = `#!/bin/sh
# Pre-commit hook for Medium Flutter Extractor
echo "Running pre-commit checks..."

# Check if .env is staged (should not be committed)
if git diff --cached --name-only | grep -q "^\\.env$"; then
  echo "❌ .env file should not be committed!"
  echo "Run: git reset HEAD .env"
  exit 1
fi

# Run linting
npm run lint --silent
if [ $? -ne 0 ]; then
  echo "❌ Linting failed!"
  exit 1
fi

echo "✅ Pre-commit checks passed"
`;
  
  const preCommitPath = join(gitHooksDir, 'pre-commit');
  writeFileSync(preCommitPath, preCommitHook);
  execSync(`chmod +x ${preCommitPath}`);
  
  logSuccess('Git hooks configured');
}

// Print final setup instructions
function printFinalInstructions() {
  logStep('8/8', 'Setup complete!');
  
  log('\n🎉 Environment setup completed successfully!\n', 'green');
  
  log('Next steps:', 'cyan');
  log('1. Configure your .env file with actual credentials', 'blue');
  log('2. Start MongoDB: brew services start mongodb/brew/mongodb-community', 'blue');
  log('3. Run development server: npm run dev', 'blue');
  log('4. Visit http://localhost:3000/health to verify backend', 'blue');
  
  log('\nUseful commands:', 'cyan');
  log('• npm run dev          - Start development server', 'blue');
  log('• npm run build        - Build for production', 'blue');
  log('• npm run test         - Run tests', 'blue');
  log('• npm run lint         - Check code quality', 'blue');
  log('• npm run health       - Check application health', 'blue');
  
  log('\nTroubleshooting:', 'cyan');
  log('• Check logs in ./logs/ directory', 'blue');
  log('• Verify .env configuration', 'blue');
  log('• Ensure MongoDB is running on port 27017', 'blue');
  log('• Check Node.js version with: node --version', 'blue');
  
  log('\n📚 Documentation: ./docs/README.md\n');
}

// Main setup function
async function main() {
  log('🚀 Medium Flutter Extractor - Environment Setup\n', 'magenta');
  
  try {
    checkNodeVersion();
    createDirectories();
    setupEnvironmentFiles();
    installDependencies();
    checkMongoDB();
    validateEnvironment();
    setupGitHooks();
    printFinalInstructions();
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;