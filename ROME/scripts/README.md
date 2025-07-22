# ROME Project Lifecycle Scripts

## Overview
These scripts provide complete project lifecycle management for ROME methodology projects.

## Scripts

### `rome_status.sh`
**Check project status and health**
```bash
./scripts/rome_status.sh ROME-2025-0722-1430-FARM-WEATHER
```
- Shows project metadata, robot status, source code status
- Displays lifecycle timeline and archive information
- Validates project integrity

### `rome_dehydrate.sh` 
**Create portable project snapshot**
```bash
./scripts/rome_dehydrate.sh ROME-2025-0722-1430-FARM-WEATHER
```
- Creates compressed archive with all project components
- Updates project status to "suspended"
- Stores in `dehydrated_projects/` folder
- Includes source code, artifacts, robot configurations

### `rome_rehydrate.sh`
**Restore project from snapshot**
```bash
./scripts/rome_rehydrate.sh dehydrated_projects/ROME-DEHYDRATED-PROJECT-20250722_143000.tar.gz
```
- Extracts and restores complete project structure
- Recreates robot directories and configurations
- Reinstalls dependencies automatically
- Updates project status to "active"

### `rome_cleanup.sh`
**Clean up completed projects**
```bash
# Standard cleanup (recommended)
./scripts/rome_cleanup.sh ROME-2025-0722-1430-FARM-WEATHER standard

# Aggressive cleanup (removes robot workspaces)
./scripts/rome_cleanup.sh ROME-2025-0722-1430-FARM-WEATHER aggressive

# Preserve mode (minimal cleanup)
./scripts/rome_cleanup.sh ROME-2025-0722-1430-FARM-WEATHER preserve
```

#### Cleanup Modes:
- **standard**: Remove development artifacts, create delivery package
- **aggressive**: Remove all development files including robot workspaces  
- **preserve**: Minimal cleanup, keeps project resumable

## Directory Structure

```
ROME/
├── scripts/                    # Lifecycle management scripts
│   ├── rome_status.sh         # Project status checker
│   ├── rome_dehydrate.sh      # Project snapshot creator
│   ├── rome_rehydrate.sh      # Project restoration
│   ├── rome_cleanup.sh        # Project cleanup
│   └── README.md              # This file
├── dehydrated_projects/       # Suspended project snapshots
│   └── ROME-DEHYDRATED-*.tar.gz
├── completed_projects/        # Final delivery packages
│   └── ROME-DELIVERY-*.tar.gz
└── PROJECT/
    └── project_metadata.json  # Current project metadata
```

## Project Status Lifecycle

```
created → active → [suspended] → completed → archived
```

- **created**: Project initialized with metadata
- **active**: Development in progress  
- **suspended**: Project dehydrated for pause/transport
- **completed**: Development finished, delivery package created
- **archived**: All artifacts cleaned, only delivery package remains

## Usage Examples

### Suspend project for transport
```bash
# Create snapshot
./scripts/rome_dehydrate.sh ROME-2025-0722-1430-FARM-WEATHER

# Transport the .tar.gz file to new location

# Restore on new machine
./scripts/rome_rehydrate.sh dehydrated_projects/ROME-DEHYDRATED-*.tar.gz
```

### Complete project and cleanup
```bash
# Check current status
./scripts/rome_status.sh ROME-2025-0722-1430-FARM-WEATHER

# Clean up and create delivery package
./scripts/rome_cleanup.sh ROME-2025-0722-1430-FARM-WEATHER standard
```

## Requirements

- **bash**: Shell environment
- **tar**: Archive creation/extraction  
- **jq**: JSON processing (optional, falls back to raw display)
- **npm**: Node.js dependency management (if applicable)

## Integration

These scripts integrate with the ROME methodology by:
- Updating `project_metadata.json` status automatically
- Preserving robot configurations and activity logs
- Maintaining project integrity across lifecycle transitions
- Creating portable, resumable project snapshots