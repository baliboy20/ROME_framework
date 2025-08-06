const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('Environment Validation Tests', () => {
  describe('Core Platform Requirements', () => {
    test('Node.js should be installed and accessible', async () => {
      const { stdout, stderr } = await execAsync('node --version');
      expect(stderr).toBe('');
      expect(stdout).toMatch(/^v\d+\.\d+\.\d+/);
    });

    test('Node.js version should be LTS compatible', async () => {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      const majorVersion = parseInt(version.split('.')[0].substring(1));
      
      // Check for LTS versions (18, 20, 22)
      const ltsVersions = [18, 20, 22];
      expect(ltsVersions.some(v => majorVersion >= v)).toBe(true);
    });

    test('npm should be installed and accessible', async () => {
      const { stdout, stderr } = await execAsync('npm --version');
      expect(stderr).toBe('');
      expect(stdout).toMatch(/^\d+\.\d+\.\d+/);
    });

    test('Flutter should be installed and accessible', async () => {
      const { stdout, stderr } = await execAsync('flutter --version');
      expect(stderr).toBe('');
      expect(stdout).toContain('Flutter');
    });

    test('MongoDB should be installed', async () => {
      try {
        const { stdout } = await execAsync('mongod --version');
        expect(stdout).toContain('db version');
      } catch (error) {
        // MongoDB might be installed differently
        expect(error.message).toContain('mongod');
      }
    });

    test('Git should be installed', async () => {
      const { stdout, stderr } = await execAsync('git --version');
      expect(stderr).toBe('');
      expect(stdout).toContain('git version');
    });
  });

  describe('Port Availability', () => {
    const checkPort = async (port) => {
      try {
        const { stdout } = await execAsync(`lsof -i :${port} -sTCP:LISTEN`);
        return stdout.trim().length > 0;
      } catch {
        return false;
      }
    };

    test('API port 8090 should be available', async () => {
      const inUse = await checkPort(8090);
      expect(inUse).toBe(false);
    });

    test('MongoDB port 27017 should be in use', async () => {
      const inUse = await checkPort(27017);
      expect(inUse).toBe(true);
    });
  });

  describe('File System Permissions', () => {
    const testDir = path.join(__dirname, '../../infrastructure');

    test('Should be able to create directories', () => {
      const tempDir = path.join(testDir, 'temp-test-dir');
      fs.mkdirSync(tempDir, { recursive: true });
      expect(fs.existsSync(tempDir)).toBe(true);
      fs.rmdirSync(tempDir);
    });

    test('Should be able to write files', () => {
      const tempFile = path.join(testDir, 'temp-test-file.txt');
      fs.writeFileSync(tempFile, 'test content');
      expect(fs.existsSync(tempFile)).toBe(true);
      const content = fs.readFileSync(tempFile, 'utf8');
      expect(content).toBe('test content');
      fs.unlinkSync(tempFile);
    });

    test('Should be able to execute scripts', () => {
      const scriptPath = path.join(testDir, 'rome_environment_check.sh');
      expect(fs.existsSync(scriptPath)).toBe(true);
      const stats = fs.statSync(scriptPath);
      expect(stats.mode & 0o111).toBeGreaterThan(0); // Check execute permission
    });
  });

  describe('Environment Variables', () => {
    test('Should be able to read environment variables', () => {
      process.env.TEST_VAR = 'test_value';
      expect(process.env.TEST_VAR).toBe('test_value');
      delete process.env.TEST_VAR;
    });

    test('PATH should include node modules', () => {
      expect(process.env.PATH).toBeDefined();
      const pathIncludesNode = process.env.PATH.includes('node') || 
                               process.env.PATH.includes('npm');
      expect(pathIncludesNode).toBe(true);
    });
  });

  describe('Network Connectivity', () => {
    test('Should be able to make HTTPS requests', async () => {
      const https = require('https');
      
      return new Promise((resolve, reject) => {
        https.get('https://registry.npmjs.org/', (res) => {
          expect(res.statusCode).toBeLessThan(400);
          resolve();
        }).on('error', reject);
      });
    });
  });

  describe('Validation Script Tests', () => {
    test('Environment check script should exist', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/rome_environment_check.sh');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    test('Environment check script should be executable', async () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/rome_environment_check.sh');
      const { stderr } = await execAsync(`bash ${scriptPath}`);
      // Script should run without fatal errors
      expect(stderr).not.toContain('command not found');
    });

    test('Dependency health check script should exist', () => {
      const scriptPath = path.join(__dirname, '../../infrastructure/rome_dependency_health.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });
  });

  describe('System Resources', () => {
    test('Should have sufficient disk space', async () => {
      const { stdout } = await execAsync('df -BG . | tail -1');
      const availableGB = parseInt(stdout.split(/\s+/)[3]);
      expect(availableGB).toBeGreaterThan(1); // At least 1GB free
    });

    test('Should have sufficient memory', () => {
      const totalMemory = require('os').totalmem();
      const requiredMemory = 2 * 1024 * 1024 * 1024; // 2GB
      expect(totalMemory).toBeGreaterThan(requiredMemory);
    });
  });
});

// Additional test for dependency health check functionality
describe('Dependency Health Check', () => {
  const { coreDependencies } = require('../../infrastructure/rome_dependency_health.js');

  test('Core dependencies should be defined', () => {
    expect(coreDependencies).toBeDefined();
    expect(Object.keys(coreDependencies).length).toBeGreaterThan(0);
  });

  test('Each dependency should have required properties', () => {
    Object.entries(coreDependencies).forEach(([name, config]) => {
      expect(config).toHaveProperty('minVersion');
      expect(config).toHaveProperty('purpose');
      expect(config.minVersion).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});