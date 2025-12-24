/**
 * /generate-deployment-scripts skill (Tier 3)
 * Generates deployment automation scripts
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateDeploymentScripts {
  static async execute(params, executionId) {
    const { config_directory, output_directory } = params;

    try {
      const scriptsGenerated = [];

      console.log('Generating deployment scripts...\n');

      // 1. Deploy script
      console.log('  Creating deploy.sh...');
      const deployScript = this.generateDeployScript();
      fs.writeFileSync(path.join(output_directory, 'deploy.sh'), deployScript, { mode: 0o755 });
      scriptsGenerated.push('deploy.sh');
      console.log('    ✅ Created\n');

      // 2. Rollback script
      console.log('  Creating rollback.sh...');
      const rollbackScript = this.generateRollbackScript();
      fs.writeFileSync(path.join(output_directory, 'rollback.sh'), rollbackScript, { mode: 0o755 });
      scriptsGenerated.push('rollback.sh');
      console.log('    ✅ Created\n');

      // 3. Health check script
      console.log('  Creating health-check.sh...');
      const healthScript = this.generateHealthCheckScript();
      fs.writeFileSync(path.join(output_directory, 'health-check.sh'), healthScript, { mode: 0o755 });
      scriptsGenerated.push('health-check.sh');
      console.log('    ✅ Created\n');

      // 4. Database migration script
      console.log('  Creating migrate.sh...');
      const migrateScript = this.generateMigrationScript();
      fs.writeFileSync(path.join(output_directory, 'migrate.sh'), migrateScript, { mode: 0o755 });
      scriptsGenerated.push('migrate.sh');
      console.log('    ✅ Created\n');

      // 5. Backup script
      console.log('  Creating backup.sh...');
      const backupScript = this.generateBackupScript();
      fs.writeFileSync(path.join(output_directory, 'backup.sh'), backupScript, { mode: 0o755 });
      scriptsGenerated.push('backup.sh');
      console.log('    ✅ Created\n');

      return { scripts_generated: scriptsGenerated };

    } catch (error) {
      throw new Error(`Deployment scripts generation failed: ${error.message}`);
    }
  }

  static generateDeployScript() {
    return `#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load environment
ENV=\${1:-production}
echo "Environment: \$ENV"

# Pull latest images
echo "Pulling Docker images..."
docker-compose pull

# Stop old containers
echo "Stopping old containers..."
docker-compose down

# Run database migrations
echo "Running migrations..."
./migrate.sh

# Start new containers
echo "Starting new containers..."
docker-compose up -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 10

# Run health checks
echo "Running health checks..."
./health-check.sh

echo "✅ Deployment complete!"
`;
  }

  static generateRollbackScript() {
    return `#!/bin/bash
set -e

echo "⏪ Starting rollback..."

# Get previous version
PREVIOUS_VERSION=\${1}

if [ -z "\$PREVIOUS_VERSION" ]; then
  echo "Error: Please specify version to rollback to"
  echo "Usage: ./rollback.sh <version>"
  exit 1
fi

echo "Rolling back to version: \$PREVIOUS_VERSION"

# Stop current containers
docker-compose down

# Checkout previous version
git checkout "\$PREVIOUS_VERSION"

# Restore database backup (optional)
read -p "Restore database backup? (y/n) " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
  ./restore-backup.sh "\$PREVIOUS_VERSION"
fi

# Start containers
docker-compose up -d

# Health check
sleep 10
./health-check.sh

echo "✅ Rollback complete!"
`;
  }

  static generateHealthCheckScript() {
    return `#!/bin/bash

echo "🔍 Running health checks..."

API_URL=\${API_URL:-http://localhost:3000}
MAX_RETRIES=5
RETRY_DELAY=5

check_service() {
  local url=\$1
  local name=\$2
  
  for i in \$(seq 1 \$MAX_RETRIES); do
    if curl -f -s "\$url" > /dev/null; then
      echo "  ✅ \$name is healthy"
      return 0
    fi
    echo "  ⏳ Waiting for \$name... (attempt \$i/\$MAX_RETRIES)"
    sleep \$RETRY_DELAY
  done
  
  echo "  ❌ \$name health check failed"
  return 1
}

FAILED=0

# Check API
check_service "\${API_URL}/health" "API" || FAILED=1

# Check database
check_service "\${API_URL}/health/db" "Database" || FAILED=1

# Check Redis
check_service "\${API_URL}/health/redis" "Redis" || FAILED=1

if [ \$FAILED -eq 1 ]; then
  echo "❌ Health checks failed"
  exit 1
fi

echo "✅ All health checks passed"
exit 0
`;
  }

  static generateMigrationScript() {
    return `#!/bin/bash
set -e

echo "📊 Running database migrations..."

# Load environment
export \$(cat .env | xargs)

# Run migrations
docker-compose exec -T app npm run migration:run

echo "✅ Migrations complete"
`;
  }

  static generateBackupScript() {
    return `#!/bin/bash
set -e

echo "💾 Creating backup..."

BACKUP_DIR=./backups
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup database
echo "Backing up database..."
docker-compose exec -T db pg_dump -U postgres app_db | gzip > "\${BACKUP_DIR}/db_\${TIMESTAMP}.sql.gz"

# Backup volumes
echo "Backing up volumes..."
docker-compose exec -T app tar czf - /app/uploads > "\${BACKUP_DIR}/uploads_\${TIMESTAMP}.tar.gz"

# Clean old backups (keep last 7 days)
find \$BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup complete: \${TIMESTAMP}"
echo "Files:"
ls -lh \${BACKUP_DIR}/*\${TIMESTAMP}*
`;
  }
}

module.exports = GenerateDeploymentScripts;
