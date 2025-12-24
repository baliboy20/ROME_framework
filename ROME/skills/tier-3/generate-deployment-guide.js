/**
 * /generate-deployment-guide skill (Tier 3)
 *
 * Generates comprehensive deployment and operations guide from P2 artifacts.
 *
 * Sections:
 * 1. System Overview - Architecture and components
 * 2. Prerequisites - Requirements for deployment
 * 3. Database Setup - Database installation and schema
 * 4. API Deployment - API server deployment
 * 5. Environment Config - Configuration management
 * 6. Security Setup - Auth, encryption, access control
 * 7. Monitoring - Logging and metrics
 * 8. Backup & Recovery - Data protection
 * 9. Maintenance - Routine operations
 * 10. Troubleshooting - Common issues
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class GenerateDeploymentGuide {
  static async execute(params, executionId) {
    const {
      artifacts_directory,
      output_file = null,
      output_format = 'markdown',
      include_diagrams = true,
      deployment_target = 'cloud'
    } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('📚 GENERATING DEPLOYMENT GUIDE');
      console.log('='.repeat(70));
      console.log('');

      // Load artifacts
      console.log('Loading artifacts...\n');
      const artifacts = this.loadArtifacts(artifacts_directory);

      // Generate sections
      const sections = [];
      let diagramCount = 0;

      console.log('Generating guide sections...\n');

      sections.push(this.generateSystemOverview(artifacts, deployment_target));
      sections.push(this.generatePrerequisites(artifacts, deployment_target));
      sections.push(this.generateDatabaseSetup(artifacts));
      sections.push(this.generateAPIDeployment(artifacts, deployment_target));
      sections.push(this.generateEnvironmentConfig(artifacts));
      sections.push(this.generateSecuritySetup(artifacts));
      sections.push(this.generateMonitoring(artifacts));
      sections.push(this.generateBackupRecovery(artifacts));
      sections.push(this.generateMaintenance(artifacts));
      sections.push(this.generateTroubleshooting(artifacts));

      // Add diagrams if requested
      if (include_diagrams) {
        diagramCount = 2; // Architecture and deployment diagrams
      }

      // Assemble guide
      const guide = this.assembleGuide(sections, artifacts, deployment_target, include_diagrams);

      // Write output
      if (output_file) {
        if (output_format === 'markdown') {
          fs.writeFileSync(output_file, guide);
        } else if (output_format === 'html') {
          const html = this.convertToHTML(guide);
          fs.writeFileSync(output_file, html);
        }
      }

      console.log('');
      console.log('='.repeat(70));
      console.log('Deployment Guide Generated');
      console.log('='.repeat(70));
      console.log(`Sections: ${sections.length}`);
      console.log(`Diagrams: ${diagramCount}`);
      console.log(`Format: ${output_format}`);
      console.log('');

      return {
        guide_file: output_file,
        sections_generated: sections.length,
        diagram_count: diagramCount
      };

    } catch (error) {
      throw new Error(`Deployment guide generation failed: ${error.message}`);
    }
  }

  /**
   * Load P2 artifacts
   */
  static loadArtifacts(artifactsDir) {
    const artifacts = {};

    // Load data dictionary
    const dictPath = path.join(artifactsDir, '02-analysis/data-dictionary.json');
    if (fs.existsSync(dictPath)) {
      artifacts.data_dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
    }

    // Load API spec
    const apiSpecPath = path.join(artifactsDir, '05-api-specs/unified-api-spec.yaml');
    if (fs.existsSync(apiSpecPath)) {
      artifacts.api_spec = yaml.load(fs.readFileSync(apiSpecPath, 'utf8'));
    }

    // Load database schema
    const schemaPath = path.join(artifactsDir, '06-database-schema/schema-postgresql.sql');
    if (fs.existsSync(schemaPath)) {
      artifacts.database_schema = fs.readFileSync(schemaPath, 'utf8');
    }

    // Count requirements
    const reqDir = path.join(artifactsDir, '01-requirements');
    if (fs.existsSync(reqDir)) {
      const reqFiles = fs.readdirSync(reqDir).filter(f => f.match(/^REQ-\\d{3}\\.yaml$/));
      artifacts.requirement_count = reqFiles.length;
    }

    return artifacts;
  }

  /**
   * Section 1: System Overview
   */
  static generateSystemOverview(artifacts, deploymentTarget) {
    const entities = artifacts.data_dictionary?.entities?.filter(e => e.type === 'primary') || [];
    const apiPaths = artifacts.api_spec?.paths ? Object.keys(artifacts.api_spec.paths).length : 0;

    return `## 1. System Overview

### Architecture

This system is a **${deploymentTarget}**-based application with a three-tier architecture:

- **Presentation Layer**: RESTful API (${apiPaths} endpoints)
- **Business Logic Layer**: Application services
- **Data Layer**: PostgreSQL database (${entities.length} primary entities)

### Key Components

1. **API Server**: Exposes RESTful endpoints for client applications
2. **Database**: PostgreSQL ${artifacts.database_schema ? '(schema provided)' : ''}
3. **Authentication**: JWT-based authentication and authorization
4. **Monitoring**: Application and infrastructure monitoring

### Technology Stack

- **Database**: PostgreSQL 14+
- **API Framework**: Node.js / Express.js (recommended)
- **Authentication**: JWT
- **Deployment**: ${deploymentTarget === 'cloud' ? 'AWS/Azure/GCP' : deploymentTarget === 'on-premise' ? 'Docker/Kubernetes' : 'Hybrid Cloud'}
`;
  }

  /**
   * Section 2: Prerequisites
   */
  static generatePrerequisites(artifacts, deploymentTarget) {
    const cloudPrereqs = `
- Cloud account (AWS, Azure, or GCP)
- CLI tools installed (aws-cli, azure-cli, or gcloud)
- Appropriate IAM permissions
- Domain name and SSL certificate`;

    const onPremisePrereqs = `
- Server infrastructure (physical or virtual)
- Docker and Kubernetes installed
- Network configuration access
- SSL certificates`;

    const prerequisites = deploymentTarget === 'cloud' ? cloudPrereqs : onPremisePrereqs;

    return `## 2. Prerequisites

### Software Requirements

- PostgreSQL 14 or higher
- Node.js 18 LTS or higher
- npm or yarn package manager
- Git version control

### ${deploymentTarget === 'cloud' ? 'Cloud' : 'Infrastructure'} Requirements
${prerequisites}

### Access Requirements

- Database administrator credentials
- API deployment credentials
- Monitoring service access
- Backup storage access
`;
  }

  /**
   * Section 3: Database Setup
   */
  static generateDatabaseSetup(artifacts) {
    const tableCount = artifacts.database_schema ?
      (artifacts.database_schema.match(/CREATE TABLE/g) || []).length : 0;

    return `## 3. Database Setup

### Installation

\`\`\`bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Or using Docker
docker run --name project-db \\
  -e POSTGRES_PASSWORD=yourpassword \\
  -e POSTGRES_DB=projectdb \\
  -p 5432:5432 \\
  -d postgres:14
\`\`\`

### Schema Deployment

The database schema includes **${tableCount} tables**. Apply the schema using:

\`\`\`bash
# Connect to database
psql -U postgres -d projectdb

# Or run schema file
psql -U postgres -d projectdb -f 06-database-schema/schema-postgresql.sql
\`\`\`

### Database Configuration

Create a dedicated database user:

\`\`\`sql
CREATE USER projectapp WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE projectdb TO projectapp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO projectapp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO projectapp;
\`\`\`

### Connection String

\`\`\`
postgresql://projectapp:secure_password@localhost:5432/projectdb
\`\`\`
`;
  }

  /**
   * Section 4: API Deployment
   */
  static generateAPIDeployment(artifacts, deploymentTarget) {
    const apiPaths = artifacts.api_spec?.paths ? Object.keys(artifacts.api_spec.paths).length : 0;

    const cloudDeployment = `
\`\`\`bash
# Deploy to AWS Elastic Beanstalk
eb init -p node.js project-api
eb create project-api-prod
eb deploy

# Or deploy to Azure App Service
az webapp create --name project-api --resource-group myResourceGroup
az webapp deployment source config-zip --src api.zip
\`\`\``;

    const dockerDeployment = `
\`\`\`bash
# Build Docker image
docker build -t project-api:latest .

# Run container
docker run -d \\
  --name project-api \\
  -p 3000:3000 \\
  -e DATABASE_URL="postgresql://..." \\
  -e JWT_SECRET="..." \\
  project-api:latest

# Or deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
\`\`\``;

    const deployment = deploymentTarget === 'cloud' ? cloudDeployment : dockerDeployment;

    return `## 4. API Deployment

### API Overview

The API exposes **${apiPaths} endpoints** following RESTful conventions.

### Deployment Steps
${deployment}

### Health Check

\`\`\`bash
curl http://your-api-host:3000/health
\`\`\`

Expected response:
\`\`\`json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-24T10:00:00Z"
}
\`\`\`
`;
  }

  /**
   * Section 5: Environment Configuration
   */
  static generateEnvironmentConfig(artifacts) {
    return `## 5. Environment Configuration

### Environment Variables

Create a \`.env\` file with the following variables:

\`\`\`bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# API Server
PORT=3000
NODE_ENV=production
API_BASE_URL=https://api.yourcompany.com

# Authentication
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRY=24h

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# External Services
SMTP_HOST=smtp.yourcompany.com
SMTP_PORT=587
SMTP_USER=notifications@yourcompany.com
SMTP_PASS=yoursmtppassword
\`\`\`

### Configuration Management

For production deployments, use a secrets management service:

- **AWS**: AWS Secrets Manager / Parameter Store
- **Azure**: Azure Key Vault
- **GCP**: Google Secret Manager
- **On-Premise**: HashiCorp Vault
`;
  }

  /**
   * Section 6: Security Setup
   */
  static generateSecuritySetup(artifacts) {
    return `## 6. Security Setup

### Authentication

The system uses JWT-based authentication:

1. **Generate JWT Secret**:
   \`\`\`bash
   openssl rand -base64 32
   \`\`\`

2. **Configure JWT Settings**:
   - Token expiry: 24 hours (configurable)
   - Refresh token: 7 days
   - Algorithm: HS256

### SSL/TLS Configuration

For production, always use HTTPS:

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name api.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

### Database Security

1. Use connection pooling with limits
2. Enable SSL for database connections
3. Regular password rotation (90 days)
4. Principle of least privilege for users

### API Security

- Rate limiting: 100 requests/minute per IP
- CORS configuration
- Input validation on all endpoints
- SQL injection prevention (use parameterized queries)
- XSS protection headers
`;
  }

  /**
   * Section 7: Monitoring
   */
  static generateMonitoring(artifacts) {
    return `## 7. Monitoring & Logging

### Application Logging

Configure structured logging:

\`\`\`javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
\`\`\`

### Metrics Collection

Key metrics to monitor:

- **API Metrics**: Request rate, response time, error rate
- **Database Metrics**: Connection pool usage, query performance
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: Active users, transaction volume

### Monitoring Tools

Recommended tools:

- **Application**: New Relic, Datadog, or Application Insights
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime**: Pingdom, UptimeRobot

### Alerting

Configure alerts for:

- API response time > 500ms
- Error rate > 5%
- Database connections > 80% of pool
- Disk usage > 85%
- Failed authentication attempts > 10/minute
`;
  }

  /**
   * Section 8: Backup & Recovery
   */
  static generateBackupRecovery(artifacts) {
    return `## 8. Backup & Disaster Recovery

### Database Backup

Automated daily backups:

\`\`\`bash
# Create backup
pg_dump -U projectapp -d projectdb > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U projectapp -d projectdb | gzip > backup_$(date +%Y%m%d).sql.gz

# Automated backup script (add to cron)
0 2 * * * /usr/local/bin/backup-db.sh
\`\`\`

### Backup Retention

- **Daily backups**: Retain for 7 days
- **Weekly backups**: Retain for 4 weeks
- **Monthly backups**: Retain for 12 months

### Recovery Procedures

\`\`\`bash
# Restore from backup
psql -U projectapp -d projectdb < backup_20251224.sql

# Or from compressed backup
gunzip -c backup_20251224.sql.gz | psql -U projectapp -d projectdb
\`\`\`

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 24 hours
3. **Backup Location**: Off-site storage (different region)
4. **Recovery Testing**: Quarterly recovery drills
`;
  }

  /**
   * Section 9: Maintenance
   */
  static generateMaintenance(artifacts) {
    return `## 9. Routine Maintenance

### Daily Tasks

- Review application logs for errors
- Monitor system resource usage
- Verify backup completion

### Weekly Tasks

- Database index optimization
- Clear expired sessions
- Review security alerts

### Monthly Tasks

- Update dependencies (security patches)
- Database vacuum and analyze
- Review and rotate logs
- Capacity planning review

### Quarterly Tasks

- Security audit
- Disaster recovery drill
- Performance optimization review
- SSL certificate renewal check

### Database Maintenance

\`\`\`sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE projectdb;

-- Check table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
\`\`\`
`;
  }

  /**
   * Section 10: Troubleshooting
   */
  static generateTroubleshooting(artifacts) {
    return `## 10. Troubleshooting

### Common Issues

#### 1. API Server Won't Start

**Symptoms**: Application crashes on startup

**Possible Causes**:
- Database connection failure
- Missing environment variables
- Port already in use

**Solutions**:
\`\`\`bash
# Check database connectivity
psql -U projectapp -h localhost -d projectdb

# Verify environment variables
env | grep DATABASE_URL

# Check port availability
netstat -tuln | grep 3000
\`\`\`

#### 2. Slow API Response

**Symptoms**: Response times > 1 second

**Possible Causes**:
- Missing database indexes
- Connection pool exhausted
- Unoptimized queries

**Solutions**:
\`\`\`sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX idx_table_column ON table_name(column_name);
\`\`\`

#### 3. Authentication Failures

**Symptoms**: Users cannot log in

**Possible Causes**:
- Expired JWT secret
- Clock skew
- Session table full

**Solutions**:
- Verify JWT_SECRET is set correctly
- Check system time synchronization
- Clear expired sessions

#### 4. Database Connection Errors

**Symptoms**: "Too many connections" error

**Solutions**:
\`\`\`sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Terminate idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < current_timestamp - interval '1 hour';
\`\`\`

### Support Contacts

- **Development Team**: dev@yourcompany.com
- **Operations Team**: ops@yourcompany.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX
`;
  }

  /**
   * Assemble complete guide
   */
  static assembleGuide(sections, artifacts, deploymentTarget, includeDiagrams) {
    const reqCount = artifacts.requirement_count || 0;
    const entities = artifacts.data_dictionary?.entities?.filter(e => e.type === 'primary') || [];
    const apiPaths = artifacts.api_spec?.paths ? Object.keys(artifacts.api_spec.paths).length : 0;

    let guide = `# Deployment & Operations Guide

**Generated**: ${new Date().toISOString().split('T')[0]}
**Deployment Target**: ${deploymentTarget}
**Requirements**: ${reqCount} functional requirements
**Entities**: ${entities.length} primary entities
**API Endpoints**: ${apiPaths} endpoints

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Database Setup](#3-database-setup)
4. [API Deployment](#4-api-deployment)
5. [Environment Configuration](#5-environment-configuration)
6. [Security Setup](#6-security-setup)
7. [Monitoring & Logging](#7-monitoring--logging)
8. [Backup & Disaster Recovery](#8-backup--disaster-recovery)
9. [Routine Maintenance](#9-routine-maintenance)
10. [Troubleshooting](#10-troubleshooting)

---

`;

    sections.forEach(section => {
      guide += section + '\n\n';
    });

    guide += `---

*This guide was automatically generated from P2 artifacts.*

`;

    return guide;
  }

  /**
   * Convert markdown to HTML (simplified)
   */
  static convertToHTML(markdown) {
    // Simple markdown to HTML conversion
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>Deployment Guide</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #333; border-bottom: 3px solid #0066cc; }
    h2 { color: #0066cc; margin-top: 30px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
${markdown.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
         .replace(/## (.*)/g, '<h2>$1</h2>')
         .replace(/### (.*)/g, '<h3>$1</h3>')
         .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
         .replace(/\n\n/g, '</p><p>')}
</body>
</html>`;
    return html;
  }
}

module.exports = GenerateDeploymentGuide;
