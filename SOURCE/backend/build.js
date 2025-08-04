import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf8')
);

const banner = `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname as __dirname_helper } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = __dirname_helper(__filename);
`;

try {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: 'dist/index.js',
    external: [
      // Keep these as external dependencies
      'puppeteer',
      'sharp',
      'googleapis'
    ],
    banner: {
      js: banner
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    metafile: true,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.APP_VERSION': JSON.stringify(packageJson.version)
    }
  });

  console.log('✅ Backend build completed successfully');
} catch (error) {
  console.error('❌ Backend build failed:', error);
  process.exit(1);
}