#!/bin/bash
# rome_dehydrate.sh [PROJECT_ID]
# ROME Project Dehydration - Create portable project snapshot

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 [PROJECT_ID]"
    echo "Example: $0 ROME-2025-0722-1430-FARM-WEATHER"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="ROME-DEHYDRATED-${PROJECT_ID}-${TIMESTAMP}.tar.gz"
ROME_DIR="/Users/will/flutterProjects/Exercises/july/zz_robot_army/ROME"

echo "🏺 ROME Project Dehydration"
echo "=========================="
echo "Project: $PROJECT_ID"
echo "Archive: $ARCHIVE_NAME"
echo "Working from: $ROME_DIR"

cd "$ROME_DIR" || exit 1

# Validate project exists
if [ ! -f "PROJECT/project_metadata.json" ]; then
    echo "❌ Error: Project metadata not found"
    exit 1
fi

# Create dehydration manifest
create_dehydration_manifest() {
    cat > dehydration_manifest.json << EOF
{
  "projectId": "$PROJECT_ID",
  "dehydratedAt": "$(date -Iseconds)",
  "romeVersion": "1.0",
  "sourceFiles": $(find ../PROJECT/SOURCE -type f 2>/dev/null | wc -l),
  "robotCount": $(ls -d ../rodeo_* 2>/dev/null | wc -l),
  "totalSize": "$(du -sh . 2>/dev/null | cut -f1)",
  "components": {
    "source": "$([ -d ../PROJECT/SOURCE ] && echo 'included' || echo 'missing')",
    "artifacts": "$([ -d PROJECT ] && echo 'included' || echo 'missing')",
    "robots": "$([ -d ../rodeo_luc ] && echo 'included' || echo 'missing')"
  }
}
EOF
}

echo "📋 Creating dehydration manifest..."
create_dehydration_manifest

# Create archive with comprehensive inclusion
echo "📦 Creating archive..."
tar -czf "$ARCHIVE_NAME" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log.bak' \
    --exclude='*.tmp' \
    --exclude='.DS_Store' \
    PROJECT/project_metadata.json \
    PROJECT/ \
    ../PROJECT/SOURCE/ \
    ../rodeo_*/CLAUDE.md \
    ../rodeo_*/.claude/settings.local.json \
    ../rodeo_*/robot_activity_*.log \
    dehydration_manifest.json \
    2>/dev/null

if [ $? -eq 0 ]; then
    # Move to dehydrated projects folder
    mkdir -p dehydrated_projects
    mv "$ARCHIVE_NAME" dehydrated_projects/
    
    # Update project status
    if command -v jq >/dev/null 2>&1; then
        jq '.status = "suspended" | .lifecycle.suspended = now | .lifecycle.suspended |= strftime("%Y-%m-%dT%H:%M:%SZ")' \
            PROJECT/project_metadata.json > PROJECT/project_metadata.json.tmp && \
        mv PROJECT/project_metadata.json.tmp PROJECT/project_metadata.json
    fi
    
    # Clean up
    rm -f dehydration_manifest.json
    
    echo "✅ Dehydration complete: dehydrated_projects/$ARCHIVE_NAME"
    echo "📊 Archive size: $(du -sh dehydrated_projects/$ARCHIVE_NAME | cut -f1)"
    echo "📝 Project status updated to 'suspended'"
else
    echo "❌ Error: Dehydration failed"
    rm -f dehydration_manifest.json
    exit 1
fi