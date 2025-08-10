#!/bin/bash
# rome_status.sh [PROJECT_ID]
# ROME Project Status - Check current project state

PROJECT_ID=$1
ROME_DIR="/Users/will/flutterProjects/Exercises/july/zz_robot_army/ROME"

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: $0 [PROJECT_ID]"
    echo "Example: $0 ROME-2025-0722-1430-FARM-WEATHER"
    exit 1
fi

echo "📊 ROME Project Status"
echo "====================="

cd "$ROME_DIR" || exit 1

# Check if project metadata exists
if [ ! -f "PROJECT/project_metadata.json" ]; then
    echo "❌ Project not found: $PROJECT_ID"
    echo ""
    echo "Available projects:"
    find . -name "project_metadata.json" -exec dirname {} \; 2>/dev/null | sed 's|./||'
    exit 1
fi

# Display project information
if command -v jq >/dev/null 2>&1; then
    echo "📋 Project Information:"
    echo "  ID: $(jq -r '.projectId' PROJECT/project_metadata.json)"
    echo "  Name: $(jq -r '.projectName' PROJECT/project_metadata.json)"
    echo "  Title: $(jq -r '.title' PROJECT/project_metadata.json)"
    echo "  Status: $(jq -r '.status' PROJECT/project_metadata.json)"
    echo "  Version: $(jq -r '.version' PROJECT/project_metadata.json)"
    echo ""
    
    echo "🤖 Robot Configuration:"
    ROBOTS=$(jq -r '.robots[]' PROJECT/project_metadata.json)
    for robot in $ROBOTS; do
        ROBOT_DIR="../rodeo_$robot"
        if [ -d "$ROBOT_DIR" ]; then
            echo "  ✅ $robot (rodeo_$robot)"
            # Check if robot has activity log
            if [ -f "$ROBOT_DIR/robot_activity_$robot.log" ]; then
                LAST_ACTIVITY=$(tail -1 "$ROBOT_DIR/robot_activity_$robot.log" 2>/dev/null | cut -d']' -f1 | cut -d'[' -f2)
                echo "    Last activity: $LAST_ACTIVITY"
            fi
        else
            echo "  ❌ $robot (missing rodeo_$robot directory)"
        fi
    done
    echo ""
    
    echo "🛠️ Technical Stack:"
    TECH_STACK=$(jq -r '.techStack[]' PROJECT/project_metadata.json)
    for tech in $TECH_STACK; do
        echo "  - $tech"
    done
    echo ""
    
    echo "🌐 Port Configuration:"
    PORTS=$(jq -r '.ports[]' PROJECT/project_metadata.json)
    for port in $PORTS; do
        echo "  - Port $port"
    done
    echo ""
    
    echo "📅 Lifecycle:"
    echo "  Created: $(jq -r '.lifecycle.created' PROJECT/project_metadata.json)"
    if [ "$(jq -r '.lifecycle.activated' PROJECT/project_metadata.json)" != "null" ]; then
        echo "  Activated: $(jq -r '.lifecycle.activated' PROJECT/project_metadata.json)"
    fi
    if [ "$(jq -r '.lifecycle.suspended' PROJECT/project_metadata.json)" != "null" ]; then
        echo "  Suspended: $(jq -r '.lifecycle.suspended' PROJECT/project_metadata.json)"
    fi
    if [ "$(jq -r '.lifecycle.rehydrated' PROJECT/project_metadata.json)" != "null" ]; then
        echo "  Rehydrated: $(jq -r '.lifecycle.rehydrated' PROJECT/project_metadata.json)"
    fi
    if [ "$(jq -r '.lifecycle.cleaned' PROJECT/project_metadata.json)" != "null" ]; then
        echo "  Cleaned: $(jq -r '.lifecycle.cleaned' PROJECT/project_metadata.json)"
    fi
else
    echo "⚠️  jq not available - showing raw metadata"
    cat PROJECT/project_metadata.json
fi

echo ""

# Check source code status
echo "💻 Source Code:"
if [ -d "../PROJECT/SOURCE" ]; then
    SOURCE_FILES=$(find ../PROJECT/SOURCE -type f | wc -l)
    SOURCE_SIZE=$(du -sh ../PROJECT/SOURCE 2>/dev/null | cut -f1)
    echo "  ✅ Source directory exists"
    echo "  📁 Files: $SOURCE_FILES"
    echo "  📊 Size: $SOURCE_SIZE"
    
    # Check for package.json
    if [ -f "../PROJECT/SOURCE/package.json" ]; then
        echo "  📦 Package.json present"
        if [ -d "../PROJECT/SOURCE/node_modules" ]; then
            echo "  📚 Dependencies installed"
        else
            echo "  ⚠️  Dependencies not installed (run: npm install)"
        fi
    fi
else
    echo "  ❌ Source directory missing"
fi

echo ""

# Check project artifacts
echo "📂 Project Artifacts:"
if [ -d "PROJECT" ]; then
    ARTIFACT_FILES=$(find PROJECT -type f | wc -l)
    echo "  ✅ Project directory exists"
    echo "  📁 Artifact files: $ARTIFACT_FILES"
    
    # Check specific artifacts
    [ -f "PROJECT/dev/actionlist.md" ] && echo "  📋 Action list present"
    [ -f "PROJECT/dev/project_tasks.log" ] && echo "  📝 Task log present"
    [ -f "PROJECT/dev/project_activity.status" ] && echo "  📊 Activity status present"
else
    echo "  ❌ Project artifacts missing"
fi

echo ""

# Check for dehydrated versions
echo "💾 Archive Status:"
DEHYDRATED_COUNT=$(ls dehydrated_projects/ROME-DEHYDRATED-${PROJECT_ID}-*.tar.gz 2>/dev/null | wc -l)
DELIVERY_COUNT=$(ls completed_projects/ROME-DELIVERY-${PROJECT_ID}-*.tar.gz 2>/dev/null | wc -l)

echo "  🏺 Dehydrated archives: $DEHYDRATED_COUNT"
if [ $DEHYDRATED_COUNT -gt 0 ]; then
    echo "    Latest: $(ls -t dehydrated_projects/ROME-DEHYDRATED-${PROJECT_ID}-*.tar.gz 2>/dev/null | head -1 | xargs basename)"
fi

echo "  📦 Delivery packages: $DELIVERY_COUNT" 
if [ $DELIVERY_COUNT -gt 0 ]; then
    echo "    Latest: $(ls -t completed_projects/ROME-DELIVERY-${PROJECT_ID}-*.tar.gz 2>/dev/null | head -1 | xargs basename)"
fi

echo ""

# Final status summary
if command -v jq >/dev/null 2>&1; then
    CURRENT_STATUS=$(jq -r '.status' PROJECT/project_metadata.json)
    case $CURRENT_STATUS in
        "active")
            echo "🟢 Status: Project is ACTIVE and ready for development"
            ;;
        "suspended")
            echo "🟡 Status: Project is SUSPENDED (use rome_rehydrate.sh to resume)"
            ;;
        "completed")
            echo "🔵 Status: Project is COMPLETED (delivery package available)"
            ;;
        "archived")
            echo "⚪ Status: Project is ARCHIVED (development artifacts cleaned)"
            ;;
        *)
            echo "❓ Status: Unknown state - $CURRENT_STATUS"
            ;;
    esac
fi