# ROME Project Lifecycle Management
**Version**: 2.1  
**Last Updated**: 2025-08-07  
**Changelog**: No changes - version sync with other ROME documents

## Enhanced Project Management System

### Project Identity & Metadata

Every ROME project receives a unique identity and metadata structure for full lifecycle tracking.

---

## Project ID Generation System

### Unique Project Identifier Format
```
ROME-YYYY-MMDD-HHMM-[SHORT_NAME]
Examples:
- ROME-2025-0722-1430-FARM-WEATHER  
- ROME-2025-0723-0915-ECOMMERCE-API
- ROME-2025-0724-1145-DASHBOARD-REDESIGN
```

### Project Metadata Structure
```json
{
  "projectId": "ROME-2025-0722-1430-FARM-WEATHER",
  "projectName": "Farm Weather App PoC", 
  "title": "Simple Weather Button Application",
  "created": "2025-07-22T14:30:00Z",
  "status": "active|suspended|completed|archived",
  "version": "1.0.0",
  "methodology": "TDD-ROME",
  "pma": "Rome PMA",
  "robots": ["luc", "reena", "charlie", "roma"],
  "techStack": ["Node.js", "Express", "Vanilla JS"],
  "ports": [8094, 3301, 3302],
  "testMetrics": {
    "contractTests": 0,
    "passingTests": 0,
    "coverage": 0,
    "integrationFailures": 0,
    "reworkPercentage": 0
  },
  "paths": {
    "source": "../PROJECT/SOURCE/",
    "artifacts": "./PROJECT/",
    "tests": "../PROJECT/SOURCE/tests/",
    "contracts": "../PROJECT/SOURCE/tests/contracts/",
    "robots": ["../rodeo_luc", "../rodeo_reena", "../rodeo_charlie", "../rodeo_roma"]
  }
}
```

---

## Project Dehydration System

### What Gets Dehydrated
**Purpose**: Create portable, resumable project snapshots

```bash
# Dehydration creates compressed archive
ROME-PROJECT-[PROJECT_ID].tar.gz
├── project_metadata.json          # Core project information
├── source_code/                   # All source code from SOURCE/
├── project_artifacts/             # Documentation, logs, configs
├── robot_configurations/          # Each robot's notit.txt and settings
├── environment_state/             # Dependencies, package files
└── dehydration_manifest.json      # What was included/excluded
```

### Dehydration Process
1. **Validate Project State**: Ensure project is in valid state for dehydration
2. **Generate Manifest**: Document all files, dependencies, and configurations
3. **Archive Source Code**: Compress all code from PROJECT/SOURCE/
4. **Backup Artifacts**: Include logs, documentation, configurations
5. **Export Robot States**: Save each robot's configuration and progress
6. **Create Metadata**: Generate dehydration timestamp and manifest
7. **Compress Archive**: Create single `.tar.gz` file for transport

### Dehydration Script
```bash
#!/bin/bash
# rome_dehydrate.sh [PROJECT_ID]

PROJECT_ID=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="ROME-DEHYDRATED-${PROJECT_ID}-${TIMESTAMP}.tar.gz"

echo "🏺 ROME Project Dehydration"
echo "=========================="
echo "Project: $PROJECT_ID"
echo "Archive: $ARCHIVE_NAME"

# Create dehydration manifest
create_dehydration_manifest() {
  cat > dehydration_manifest.json << EOF
{
  "projectId": "$PROJECT_ID",
  "dehydratedAt": "$(date -Iseconds)",
  "romeVersion": "1.0",
  "sourceFiles": $(find ../PROJECT/SOURCE -type f | wc -l),
  "robotCount": $(ls -d ../rodeo_* | wc -l),
  "totalSize": "$(du -sh . | cut -f1)"
}
EOF
}

# Execute dehydration
tar -czf "$ARCHIVE_NAME" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log.bak' \
  project_metadata.json \
  ../PROJECT/SOURCE/ \
  ./PROJECT/ \
  ../rodeo_*/notit.txt \
  ../rodeo_*/.claude/settings.local.json \
  dehydration_manifest.json

echo "✅ Dehydration complete: $ARCHIVE_NAME"
```

---

## Project Rehydration System

### Rehydration Process
1. **Extract Archive**: Uncompress dehydrated project archive
2. **Validate Manifest**: Ensure all required components present  
3. **Restore Directory Structure**: Recreate ROME project layout
4. **Reinstall Dependencies**: Restore package.json dependencies
5. **Configure Robots**: Setup robot directories and configurations
6. **Validate Environment**: Run environment readiness checks
7. **Resume Project**: Update metadata status to "active"

### Rehydration Script
```bash
#!/bin/bash
# rome_rehydrate.sh [ARCHIVE_PATH] [TARGET_DIRECTORY]

ARCHIVE_PATH=$1
TARGET_DIR=${2:-"."}
TEMP_DIR="/tmp/rome_rehydration_$$"

echo "💧 ROME Project Rehydration"  
echo "=========================="
echo "Archive: $ARCHIVE_PATH"
echo "Target: $TARGET_DIR"

# Extract and validate
mkdir -p "$TEMP_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR"

# Read project metadata
PROJECT_ID=$(jq -r '.projectId' "$TEMP_DIR/project_metadata.json")
echo "Rehydrating project: $PROJECT_ID"

# Restore directory structure
cp -r "$TEMP_DIR/PROJECT" "$TARGET_DIR/"
cp -r "$TEMP_DIR/source_code"/* "$TARGET_DIR/../PROJECT/SOURCE/"

# Restore robot configurations
for robot_dir in "$TEMP_DIR"/robot_configurations/rodeo_*; do
  robot_name=$(basename "$robot_dir")
  cp -r "$robot_dir" "$TARGET_DIR/../$robot_name"
done

# Reinstall dependencies
if [ -f "$TARGET_DIR/../PROJECT/SOURCE/package.json" ]; then
  cd "$TARGET_DIR/../PROJECT/SOURCE"
  npm install --silent
fi

# Update project status
jq '.status = "active" | .rehydratedAt = now | .rehydratedAt |= strftime("%Y-%m-%dT%H:%M:%SZ")' \
  "$TEMP_DIR/project_metadata.json" > "$TARGET_DIR/PROJECT/project_metadata.json"

echo "✅ Rehydration complete for $PROJECT_ID"
cleanup_temp_dir
```

---

## Project Completion & Cleanup

### Cleanup Categories

#### 🗂️ **Archive & Preserve**
```bash
# What to keep permanently
- Final source code (production-ready)
- Architecture documentation  
- Test results and coverage reports
- Final project metadata
- Deployment configurations
```

#### 🧹 **Clean Up**  
```bash
# What to remove after completion
- Individual robot activity logs
- Temporary build artifacts  
- Development dependencies
- Robot workspace directories
- Environment configuration files
```

#### 📦 **Package for Delivery**
```bash
# Create delivery package
- Production source code
- Deployment guide
- Architecture documentation
- API documentation
- Test suite
```

### Cleanup Script
```bash
#!/bin/bash
# rome_cleanup.sh [PROJECT_ID] [CLEANUP_MODE]

PROJECT_ID=$1
CLEANUP_MODE=${2:-"standard"} # standard|aggressive|preserve

echo "🧹 ROME Project Cleanup"
echo "======================"
echo "Project: $PROJECT_ID" 
echo "Mode: $CLEANUP_MODE"

case $CLEANUP_MODE in
  "standard")
    # Remove development artifacts but keep documentation
    rm -rf ../rodeo_*/PROJECT/dev/robot_activity_*.log
    rm -rf ../PROJECT/SOURCE/node_modules
    rm -rf ../PROJECT/SOURCE/.env.local
    ;;
    
  "aggressive") 
    # Remove all development artifacts and robot workspaces
    rm -rf ../rodeo_*
    rm -rf ./PROJECT/dev/
    find ../PROJECT/SOURCE -name "*.log" -delete
    ;;
    
  "preserve")
    # Only remove temporary files, keep everything else
    find . -name "*.tmp" -delete
    find . -name "*.bak" -delete
    ;;
esac

# Create final project package
create_delivery_package() {
  DELIVERY_NAME="ROME-DELIVERY-${PROJECT_ID}-$(date +%Y%m%d).tar.gz"
  
  tar -czf "$DELIVERY_NAME" \
    --exclude='*.log' \
    --exclude='node_modules' \
    --exclude='.env*' \
    ../PROJECT/SOURCE/ \
    ./PROJECT/SYSTEM_ARCHITECTURE.md \
    ./PROJECT/API_DOCUMENTATION.md \
    ./PROJECT/DEPLOYMENT_GUIDE.md
    
  echo "📦 Delivery package: $DELIVERY_NAME"
}

if [ "$CLEANUP_MODE" != "preserve" ]; then
  create_delivery_package
fi

echo "✅ Cleanup complete"
```

---

## Project Status Management

### Status Lifecycle
```
created → active → [suspended] → completed → archived → cleaned
```

### Status Transitions
| From | To | Trigger | Action |
|------|----|---------| -------|
| created | active | Robot launch | Initialize tracking |
| active | suspended | Manual/error | Dehydrate for pause |
| suspended | active | Resume | Rehydrate project |  
| active | completed | All tasks done | Final validation |
| completed | archived | Manual | Create delivery package |
| archived | cleaned | Manual | Remove artifacts |

### Project Status Commands
```bash
# Check project status
rome_status [PROJECT_ID]

# Suspend project (auto-dehydrate)  
rome_suspend [PROJECT_ID]

# Resume project (auto-rehydrate)
rome_resume [ARCHIVE_PATH]

# Mark project complete
rome_complete [PROJECT_ID]

# Full cleanup
rome_cleanup [PROJECT_ID] [MODE]
```

---

## Integration with ROME Workflow

### Enhanced PMA Responsibilities
- Generate unique project ID at initialization
- Create project metadata file
- Track project lifecycle status
- Coordinate dehydration/rehydration
- Manage project completion and cleanup

### Robot Integration
- Each robot logs to project-specific files using PROJECT_ID
- Robot configurations reference PROJECT_ID in settings
- All artifacts tagged with PROJECT_ID for easy cleanup

### File Structure Enhancement
```
ROME/
├── active_projects/
│   └── [PROJECT_ID]/
├── dehydrated_projects/
│   └── ROME-DEHYDRATED-*.tar.gz
├── completed_projects/
│   └── ROME-DELIVERY-*.tar.gz
└── scripts/
    ├── rome_dehydrate.sh
    ├── rome_rehydrate.sh
    └── rome_cleanup.sh
```

This system provides complete project lifecycle management with unique identification, portable snapshots, and systematic cleanup capabilities!
