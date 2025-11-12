#!/bin/bash
# ROME Project Initialization with MCP
# Version: 1.0
# Purpose: Initialize new ROME project with MCP activity log

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROME_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$ROME_ROOT/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ROME Project Initialization (MCP Mode)      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check MongoDB
echo -n "Checking MongoDB... "
if ! pgrep -x mongod > /dev/null 2>&1; then
    echo -e "${RED}✗ MongoDB not running${NC}"
    echo "Please start MongoDB first"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Get project name
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter project name:${NC}"
    read -r PROJECT_NAME
else
    PROJECT_NAME="$1"
fi

DB_NAME="rome_${PROJECT_NAME}"

echo ""
echo -e "${BLUE}Project: ${GREEN}$PROJECT_NAME${NC}"
echo -e "${BLUE}Database: ${GREEN}$DB_NAME${NC}"
echo ""

# Initialize MCP database
echo -e "${YELLOW}Initializing MCP database...${NC}"

cat > /tmp/init-${PROJECT_NAME}.js <<'INITEOF'
const { MongoClient } = require('mongodb');

async function init() {
    const dbName = process.argv[2];
    const projectName = process.argv[3];
    const client = new MongoClient('mongodb://localhost:27017');

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('activity_entries');

        // Create indexes
        await collection.createIndex({ id: 1 }, { unique: true });
        await collection.createIndex({ type: 1 });
        await collection.createIndex({ status: 1 });
        await collection.createIndex({ robot: 1 });
        await collection.createIndex({ feature: 1 });
        await collection.createIndex({ phase: 1 });
        await collection.createIndex({ layer: 1 });

        // Insert initial phase entries
        await collection.insertMany([
            {
                id: 'PHASE-1',
                type: 'phase',
                phase: '1',
                phaseName: 'Requirements',
                robot: 'talib',
                status: 'NOT_STARTED',
                gateDecision: null,
                blockingIssues: null,
                startDate: null,
                completionDate: null,
                notes: 'Waiting to start'
            },
            {
                id: 'PHASE-2',
                type: 'phase',
                phase: '2',
                phaseName: 'Architecture',
                robot: 'pma',
                status: 'NOT_STARTED',
                gateDecision: null,
                blockingIssues: null,
                startDate: null,
                completionDate: null,
                notes: 'Waiting for Phase 1 completion'
            },
            {
                id: 'PHASE-2a',
                type: 'phase',
                phase: '2a',
                phaseName: 'UX Design',
                robot: 'clara',
                status: 'NOT_STARTED',
                gateDecision: null,
                blockingIssues: null,
                startDate: null,
                completionDate: null,
                notes: 'Optional - waiting for Phase 2 completion'
            },
            {
                id: 'PHASE-2b',
                type: 'phase',
                phase: '2b',
                phaseName: 'Quality Gate',
                robot: 'sarah',
                status: 'NOT_STARTED',
                gateDecision: null,
                blockingIssues: null,
                startDate: null,
                completionDate: null,
                notes: 'Waiting for Phase 2 completion'
            },
            {
                id: 'PHASE-3',
                type: 'phase',
                phase: '3',
                phaseName: 'Implementation',
                robot: null,
                status: 'NOT_STARTED',
                gateDecision: null,
                blockingIssues: null,
                startDate: null,
                completionDate: null,
                notes: 'Waiting for Phase 2B approval'
            }
        ]);

        console.log('✓ Database initialized with phase entries');
        console.log(`✓ Ready for project: ${projectName}`);

    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

init();
INITEOF

if node /tmp/init-${PROJECT_NAME}.js "$DB_NAME" "$PROJECT_NAME"; then
    echo -e "${GREEN}✓ MCP database initialized${NC}"
else
    echo -e "${RED}✗ Initialization failed${NC}"
    exit 1
fi

# Create MCP config
echo -e "${YELLOW}Creating project configuration...${NC}"

cat > "${ROME_ROOT}/.mcp-config-${PROJECT_NAME}.json" <<CONFIGEOF
{
  "project": "$PROJECT_NAME",
  "database": "$DB_NAME",
  "initialized": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "mode": "MCP_ONLY",
  "mongodb": {
    "host": "localhost",
    "port": 27017,
    "database": "$DB_NAME",
    "collection": "activity_entries"
  }
}
CONFIGEOF

echo -e "${GREEN}✓ Configuration created${NC}"

# Success
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Project Initialized! ✓                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Project: ${GREEN}$PROJECT_NAME${NC}"
echo -e "${BLUE}MCP Database: ${GREEN}$DB_NAME${NC}"
echo -e "${BLUE}Initial Phases: ${GREEN}PHASE-1 through PHASE-3 created${NC}"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Create robots: ${YELLOW}./ROME/scripts/create-robot.sh talib${NC}"
echo "2. Start Talib: ${YELLOW}cd robot_talib && claude${NC}"
echo "3. Monitor with Roma: ${YELLOW}cd robot_roma && claude${NC}"
echo ""

echo -e "${BLUE}MCP Functions Available:${NC}"
echo "  - ${YELLOW}await mcp__activity-log__find_by_robot('talib')${NC}"
echo "  - ${YELLOW}await mcp__activity-log__get_statistics()${NC}"
echo "  - ${YELLOW}await mcp__activity-log__find_by_id('PHASE-1')${NC}"
echo ""

echo -e "${GREEN}ROME project ready! 🚀${NC}"
