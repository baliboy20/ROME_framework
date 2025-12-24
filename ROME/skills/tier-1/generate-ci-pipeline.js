/**
 * /generate-ci-pipeline skill (Tier 1)
 * Generates CI/CD pipeline configuration
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateCIPipeline {
  static async execute(params, executionId) {
    const { design_directory, output_directory, ci_provider = 'github-actions' } = params;

    try {
      const filesGenerated = [];

      if (ci_provider === 'github-actions') {
        const workflow = this.generateGitHubActions();
        const workflowDir = path.join(output_directory, '.github', 'workflows');
        fs.mkdirSync(workflowDir, { recursive: true });
        fs.writeFileSync(path.join(workflowDir, 'ci.yml'), workflow);
        filesGenerated.push('.github/workflows/ci.yml');
      }

      return { files_generated: filesGenerated };

    } catch (error) {
      throw new Error(`CI pipeline generation failed: ${error.message}`);
    }
  }

  static generateGitHubActions() {
    return `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: test_db
          DB_USER: postgres
          DB_PASSWORD: postgres
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Build application
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t app:latest .

      - name: Push to registry
        run: |
          echo "Push to container registry"
`;
  }
}

module.exports = GenerateCIPipeline;
