#!/bin/bash

###############################################################################
# Production Deployment Script for Flutter MCP Documentation Server
# 
# This script handles the complete deployment process including:
# - Environment validation
# - Docker services deployment
# - Weaviate schema setup
# - Document ingestion
# - Health checks
# - Monitoring setup
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/infrastructure/docker/docker-compose.yml"

# Logging
LOG_FILE="${PROJECT_ROOT}/deployment-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

###############################################################################
# Pre-deployment Checks
###############################################################################

check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18 or higher is required (found: $(node -v))"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
    fi
    
    # Check Docker Compose
    if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
    fi
    
    # Validate OpenAI API key
    if ! grep -q "OPENAI_API_KEY=" "$ENV_FILE" || [ -z "$(grep OPENAI_API_KEY= "$ENV_FILE" | cut -d'=' -f2)" ]; then
        error "OPENAI_API_KEY not set in .env file"
    fi
    
    success "All requirements met"
}

###############################################################################
# Docker Services Management
###############################################################################

deploy_docker_services() {
    log "Deploying Docker services..."
    
    cd "${PROJECT_ROOT}/infrastructure/docker"
    
    # Stop existing services
    if docker compose ps -q | grep -q .; then
        warning "Stopping existing services..."
        docker compose down
    fi
    
    # Start services
    log "Starting Docker services..."
    docker compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps | grep -q "healthy"; then
            success "Docker services are healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        sleep 5
        echo -n "."
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Services failed to become healthy within timeout"
    fi
}

###############################################################################
# Weaviate Setup
###############################################################################

setup_weaviate() {
    log "Setting up Weaviate..."
    
    cd "$PROJECT_ROOT"
    
    # Wait for Weaviate to be ready
    log "Checking Weaviate connectivity..."
    local max_attempts=20
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8088/v1/.well-known/ready | grep -q "true"; then
            success "Weaviate is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        sleep 3
        echo -n "."
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Weaviate failed to start within timeout"
    fi
    
    # Setup schema and ingest documents
    log "Creating Weaviate schema and ingesting documents..."
    npm run setup:weaviate
    
    if [ $? -eq 0 ]; then
        success "Weaviate setup completed"
    else
        error "Failed to setup Weaviate"
    fi
}

###############################################################################
# Application Deployment
###############################################################################

deploy_application() {
    log "Deploying application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "Installing dependencies..."
    npm install --production
    
    # Build TypeScript
    log "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        success "Application built successfully"
    else
        error "Build failed"
    fi
}

###############################################################################
# Health Checks
###############################################################################

perform_health_checks() {
    log "Performing health checks..."
    
    # Check Weaviate
    if curl -s http://localhost:8088/v1/.well-known/ready | grep -q "true"; then
        success "Weaviate health check passed"
    else
        error "Weaviate health check failed"
    fi
    
    # Check document count
    local doc_count=$(curl -s http://localhost:8088/v1/graphql -H 'Content-Type: application/json' \
        -d '{"query":"{ Aggregate { FlutterDoc { meta { count } } } }"}' \
        | grep -o '"count":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$doc_count" ] && [ "$doc_count" -gt 0 ]; then
        success "Found $doc_count documents in Weaviate"
    else
        warning "No documents found in Weaviate"
    fi
    
    # Test search functionality
    log "Testing search functionality..."
    npm run test:search
    
    if [ $? -eq 0 ]; then
        success "Search functionality test passed"
    else
        warning "Search functionality test failed"
    fi
}

###############################################################################
# Start Services
###############################################################################

start_services() {
    log "Starting production services..."
    
    cd "$PROJECT_ROOT"
    
    # Start MCP server in background
    log "Starting MCP server..."
    nohup npm run start:mcp > mcp-server.log 2>&1 &
    local MCP_PID=$!
    
    echo $MCP_PID > mcp-server.pid
    success "MCP server started (PID: $MCP_PID)"
    
    # Start Express server
    log "Starting Express server..."
    nohup npm start > express-server.log 2>&1 &
    local EXPRESS_PID=$!
    
    echo $EXPRESS_PID > express-server.pid
    success "Express server started (PID: $EXPRESS_PID)"
    
    # Wait for servers to be ready
    sleep 5
    
    # Check if servers are running
    if kill -0 $MCP_PID 2>/dev/null && kill -0 $EXPRESS_PID 2>/dev/null; then
        success "All services started successfully"
    else
        error "One or more services failed to start"
    fi
}

###############################################################################
# Monitoring Setup
###############################################################################

setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring directory
    mkdir -p "${PROJECT_ROOT}/monitoring"
    
    # Create basic monitoring script
    cat > "${PROJECT_ROOT}/monitoring/health-check.sh" << 'EOF'
#!/bin/bash
# Health check script - run via cron

SERVICES_HEALTHY=true

# Check Weaviate
if ! curl -s http://localhost:8088/v1/.well-known/ready | grep -q "true"; then
    echo "$(date): Weaviate is unhealthy" >> health-check.log
    SERVICES_HEALTHY=false
fi

# Check Express server
if ! curl -s http://localhost:3040/health | grep -q "healthy"; then
    echo "$(date): Express server is unhealthy" >> health-check.log
    SERVICES_HEALTHY=false
fi

if [ "$SERVICES_HEALTHY" = true ]; then
    echo "$(date): All services healthy" >> health-check.log
fi
EOF
    
    chmod +x "${PROJECT_ROOT}/monitoring/health-check.sh"
    
    # Add to crontab (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * ${PROJECT_ROOT}/monitoring/health-check.sh") | crontab -
    
    success "Monitoring setup completed"
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}     Flutter MCP Documentation Server - Production Deployment${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    
    log "Starting deployment process..."
    
    # Run deployment steps
    check_requirements
    deploy_docker_services
    setup_weaviate
    deploy_application
    perform_health_checks
    start_services
    setup_monitoring
    
    echo
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}                    DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    echo "Services Running:"
    echo "  - Weaviate:      http://localhost:8088"
    echo "  - Express API:   http://localhost:3040"
    echo "  - Health Check:  http://localhost:3040/health"
    echo
    echo "Log files:"
    echo "  - Deployment:    $LOG_FILE"
    echo "  - MCP Server:    ${PROJECT_ROOT}/mcp-server.log"
    echo "  - Express:       ${PROJECT_ROOT}/express-server.log"
    echo "  - Monitoring:    ${PROJECT_ROOT}/monitoring/health-check.log"
    echo
    success "Deployment completed at $(date)"
}

# Run main function
main "$@"