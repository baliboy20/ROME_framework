#!/usr/bin/env node

import { startServer } from '../index.js';
import path from 'path';

const docsDir = process.argv[2] || path.join(process.cwd(), '../ROME');

console.error(`Starting ROME Vector Database MCP Server...`);
console.error(`Docs directory: ${docsDir}`);

try {
  await startServer(docsDir);
} catch (error) {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
}