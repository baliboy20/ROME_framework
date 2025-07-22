#!/bin/bash
# rome_rehydrate.sh [ARCHIVE_PATH] [TARGET_DIRECTORY]
# ROME Project Rehydration - Restore project from snapshot

ARCHIVE_PATH=$1
TARGET_DIR=${2:-"."}

if [ -z "$ARCHIVE_PATH" ]; then
    echo "Usage: $0 [ARCHIVE_PATH] [TARGET_DIRECTORY]"
    echo "Example: $0 dehydrated_projects/ROME-DEHYDRATED-ROME-2025-0722-1430-FARM-WEATHER-20250722_143000.tar.gz"
    exit 1
fi

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "❌ Error: Archive not found: $ARCHIVE_PATH"
    exit 1
fi

TEMP_DIR="/tmp/rome_rehydration_$$"
ROME_DIR="/Users/will/flutterProjects/Exercises/july/zz_robot_army/ROME"

echo "💧 ROME Project Rehydration"  
echo "=========================="
echo "Archive: $ARCHIVE_PATH"
echo "Target: $TARGET_DIR"

cd "$ROME_DIR" || exit 1

# Extract and validate
echo "📦 Extracting archive..."
mkdir -p "$TEMP_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to extract archive"
    cleanup_temp_dir
    exit 1
fi

# Read project metadata
if [ ! -f "$TEMP_DIR/PROJECT/project_metadata.json" ]; then
    echo "❌ Error: Invalid archive - missing project metadata"
    cleanup_temp_dir
    exit 1
fi

if command -v jq >/dev/null 2>&1; then
    PROJECT_ID=$(jq -r '.projectId' "$TEMP_DIR/PROJECT/project_metadata.json")
    PROJECT_NAME=$(jq -r '.projectName' "$TEMP_DIR/PROJECT/project_metadata.json")
else
    PROJECT_ID="Unknown"
    PROJECT_NAME="Unknown"
fi

echo "🔍 Rehydrating project: $PROJECT_ID"
echo "📝 Project name: $PROJECT_NAME"

# Validate dehydration manifest
if [ -f "$TEMP_DIR/dehydration_manifest.json" ]; then
    echo "📋 Validating manifest..."
    if command -v jq >/dev/null 2>&1; then
        DEHYDRATED_AT=$(jq -r '.dehydratedAt' "$TEMP_DIR/dehydration_manifest.json")
        echo "📅 Dehydrated: $DEHYDRATED_AT"
    fi
fi

# Restore directory structure
echo "📂 Restoring project structure..."

# Restore ROME artifacts
if [ -d "$TEMP_DIR/PROJECT" ]; then
    cp -r "$TEMP_DIR/PROJECT"/* ./PROJECT/ 2>/dev/null || true
fi

# Restore source code
if [ -d "$TEMP_DIR/PROJECT/SOURCE" ]; then
    mkdir -p ../PROJECT/SOURCE
    cp -r "$TEMP_DIR/PROJECT/SOURCE"/* ../PROJECT/SOURCE/ 2>/dev/null || true
fi

# Restore robot configurations
echo "🤖 Restoring robot configurations..."
for robot_backup in "$TEMP_DIR"/rodeo_*; do
    if [ -d "$robot_backup" ]; then
        robot_name=$(basename "$robot_backup")
        mkdir -p "../$robot_name"
        
        # Restore CLAUDE.md
        if [ -f "$robot_backup/CLAUDE.md" ]; then
            cp "$robot_backup/CLAUDE.md" "../$robot_name/"
        fi
        
        # Restore settings
        if [ -f "$robot_backup/.claude/settings.local.json" ]; then
            mkdir -p "../$robot_name/.claude"
            cp "$robot_backup/.claude/settings.local.json" "../$robot_name/.claude/"
        fi
        
        # Restore activity logs
        if [ -f "$robot_backup/robot_activity_${robot_name#rodeo_}.log" ]; then
            cp "$robot_backup/robot_activity_${robot_name#rodeo_}.log" "../$robot_name/"
        fi
        
        echo "  ✅ Restored $robot_name"
    fi
done

# Reinstall dependencies if needed
if [ -f "../PROJECT/SOURCE/package.json" ]; then
    echo "📦 Reinstalling dependencies..."
    cd ../PROJECT/SOURCE
    npm install --silent 2>/dev/null
    cd "$ROME_DIR"
fi

# Update project status
echo "📝 Updating project status..."
if command -v jq >/dev/null 2>&1 && [ -f "PROJECT/project_metadata.json" ]; then
    jq '.status = "active" | .lifecycle.rehydrated = now | .lifecycle.rehydrated |= strftime("%Y-%m-%dT%H:%M:%SZ")' \
        PROJECT/project_metadata.json > PROJECT/project_metadata.json.tmp && \
    mv PROJECT/project_metadata.json.tmp PROJECT/project_metadata.json
fi

# Cleanup function
cleanup_temp_dir() {
    rm -rf "$TEMP_DIR"
}

cleanup_temp_dir

echo "✅ Rehydration complete for $PROJECT_ID"
echo "🎯 Project status: active"
echo "📍 Ready to resume development"

# Optional: run environment readiness check
if [ -f "scripts/rome_environment_check.sh" ]; then
    echo "🔍 Running environment readiness check..."
    bash scripts/rome_environment_check.sh
fi