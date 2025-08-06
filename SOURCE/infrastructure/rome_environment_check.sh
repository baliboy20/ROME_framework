#!/bin/bash

echo "🔍 ROME Environment Readiness Check for Project Management Application"
echo "====================================================================="
echo ""

VALIDATION_PASSED=true
WARNINGS=0
ERRORS=0

# Function to check command existence
check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to log success
log_success() {
    echo "✅ $1"
}

# Function to log warning
log_warning() {
    echo "⚠️  $1"
    ((WARNINGS++))
}

# Function to log error
log_error() {
    echo "❌ $1"
    ((ERRORS++))
    VALIDATION_PASSED=false
}

# Tech Stack Validation
echo "📋 PHASE 1: Core Platform Checks"
echo "---------------------------------"

# Node.js Check
echo "Checking Node.js..."
if check_command node; then
    NODE_VERSION=$(node --version)
    echo "Found Node.js: $NODE_VERSION"
    
    # Check if it's LTS version (18.x or 20.x)
    if [[ $NODE_VERSION =~ ^v(18|20)\. ]]; then
        log_success "Node.js version is LTS compatible"
    else
        log_warning "Node.js version $NODE_VERSION may not be LTS. Recommended: v18.x or v20.x"
    fi
else
    log_error "Node.js is not installed!"
fi

# npm Check
echo ""
echo "Checking npm..."
if check_command npm; then
    NPM_VERSION=$(npm --version)
    log_success "npm is installed: v$NPM_VERSION"
else
    log_error "npm is not installed!"
fi

# Flutter Check
echo ""
echo "Checking Flutter..."
if check_command flutter; then
    FLUTTER_VERSION=$(flutter --version | head -n 1)
    log_success "Flutter is installed: $FLUTTER_VERSION"
    
    # Check Flutter doctor
    echo "Running flutter doctor summary..."
    flutter doctor -v > /tmp/flutter_doctor_output.txt 2>&1
    if grep -q "No issues found!" /tmp/flutter_doctor_output.txt; then
        log_success "Flutter doctor reports no issues"
    else
        log_warning "Flutter doctor found some issues. Run 'flutter doctor' for details"
    fi
else
    log_error "Flutter is not installed!"
fi

# MongoDB Check
echo ""
echo "Checking MongoDB..."
if check_command mongod; then
    MONGO_VERSION=$(mongod --version | head -n 1)
    log_success "MongoDB is installed: $MONGO_VERSION"
    
    # Check if MongoDB is running
    if pgrep -x mongod > /dev/null; then
        log_success "MongoDB is currently running"
    else
        log_warning "MongoDB is installed but not running. User confirmed it's running locally."
    fi
else
    log_error "MongoDB is not installed!"
fi

# Development Tools Validation
echo ""
echo "📋 PHASE 2: Development Tools Validation"
echo "----------------------------------------"

# Git Check
echo "Checking Git..."
if check_command git; then
    GIT_VERSION=$(git --version)
    log_success "Git is installed: $GIT_VERSION"
else
    log_error "Git is not installed!"
fi

# Port Availability Check
echo ""
echo "📋 PHASE 3: Port Availability Check"
echo "-----------------------------------"

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Check required ports
PORTS=(8090 27017)
PORT_NAMES=("API Server" "MongoDB")

for i in ${!PORTS[@]}; do
    port=${PORTS[$i]}
    name=${PORT_NAMES[$i]}
    
    if [ "$port" -eq 27017 ]; then
        # MongoDB port - expect it to be in use
        if ! check_port $port; then
            log_success "$name port $port is in use (expected for MongoDB)"
        else
            log_warning "$name port $port is not in use. Ensure MongoDB is running."
        fi
    else
        # Other ports - expect them to be available
        if check_port $port; then
            log_success "$name port $port is available"
        else
            log_warning "$name port $port is already in use"
        fi
    fi
done

# Memory and Disk Space Check
echo ""
echo "📋 PHASE 4: System Resources Check"
echo "----------------------------------"

# Check available disk space
DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "Available disk space: $DISK_SPACE"

# Check available memory (different commands for macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    MEMORY=$(top -l 1 | grep PhysMem | awk '{print $2}')
    echo "Available memory: $MEMORY"
else
    # Linux
    MEMORY=$(free -h | awk '/^Mem:/ {print $7}')
    echo "Available memory: $MEMORY"
fi

# Summary
echo ""
echo "====================================================================="
echo "📊 VALIDATION SUMMARY"
echo "====================================================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [ "$VALIDATION_PASSED" = true ] && [ $ERRORS -eq 0 ]; then
    echo ""
    echo "✅ ENVIRONMENT VALIDATION PASSED!"
    echo "All core requirements are met. You can proceed with development."
    exit 0
else
    echo ""
    echo "❌ ENVIRONMENT VALIDATION FAILED!"
    echo "Please address the errors above before proceeding."
    exit 1
fi