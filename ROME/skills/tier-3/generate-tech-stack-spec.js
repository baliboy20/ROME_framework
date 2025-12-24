/**
 * /generate-tech-stack-spec skill (Tier 3)
 * Generates comprehensive technology stack specification
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateTechStackSpec {
  static async execute(params, executionId) {
    const { design_directory, output_file = null, deployment_target = 'cloud' } = params;

    try {
      const techStack = {
        backend: {
          runtime: 'Node.js 18 LTS',
          framework: 'Express.js 4.x',
          language: 'TypeScript 5.x',
          orm: 'TypeORM / Prisma'
        },
        database: {
          primary: 'PostgreSQL 14+',
          cache: 'Redis 7+',
          migrations: 'TypeORM Migrations'
        },
        authentication: {
          strategy: 'JWT',
          library: 'jsonwebtoken',
          encryption: 'bcrypt'
        },
        api: {
          protocol: 'REST',
          documentation: 'OpenAPI 3.0',
          validation: 'class-validator'
        },
        testing: {
          framework: 'Jest',
          coverage: 'Istanbul',
          e2e: 'Supertest'
        },
        devops: deployment_target === 'cloud' ? {
          platform: 'AWS / Azure / GCP',
          containers: 'Docker',
          orchestration: 'Kubernetes',
          ci_cd: 'GitHub Actions'
        } : {
          containers: 'Docker',
          orchestration: 'Docker Compose',
          ci_cd: 'Jenkins'
        },
        monitoring: {
          logging: 'Winston',
          metrics: 'Prometheus',
          apm: 'New Relic / Datadog'
        },
        dependencies: {
          dotenv: 'Environment configuration',
          helmet: 'Security headers',
          cors: 'CORS middleware',
          morgan: 'HTTP logging'
        }
      };

      const spec = {
        metadata: { generated_at: new Date().toISOString(), deployment_target },
        tech_stack: techStack,
        rationale: {
          nodejs: 'High performance async I/O, large ecosystem',
          typescript: 'Type safety, better tooling, reduced bugs',
          postgresql: 'ACID compliance, robust feature set',
          redis: 'High-performance caching and session storage',
          jwt: 'Stateless authentication, scalable'
        }
      };

      if (output_file) fs.writeFileSync(output_file, JSON.stringify(spec, null, 2));

      return {
        tech_stack: techStack,
        components_count: Object.keys(techStack).length
      };
    } catch (error) {
      throw new Error(`Tech stack spec generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateTechStackSpec;
