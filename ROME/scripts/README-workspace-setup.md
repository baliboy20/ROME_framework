# ROME Workspace Setup Script

**Purpose**: Automates complete ROME v5.0 project setup with iTerm split-pane workspace

---

## What It Does

1. **Prompts for project name** (e.g., "InventorySystem", "MyApp")
2. **Creates project structure**:
   ```
   ProjectName/
   ├── requirements/
   ├── dev/
   ├── design/
   └── user_docs/
   ```
3. **Creates symlink**: `Project -> ProjectName`
4. **Creates all 7 robot directories**:
   - robot_talib
   - robot_pma
   - robot_chaperone
   - robot_clara
   - robot_ashok
   - robot_reena
   - robot_charlie
5. **Launches iTerm with split-pane layout**:
   ```
   ┌───────────────────────────────────────┐
   │  📋 TALIB  │ 🏗️ PMA  │ ✅ CHAPERONE │
   │            │          │               │
   ├───────────────────────────────────────┤
   │  🎨 CLARA  │ 🗄️ ASHOK │ ⚙️ REENA     │
   │            │          │               │
   ├───────────────────────────────────────┤
   │         🖥️ CHARLIE                    │
   │                                       │
   └───────────────────────────────────────┘
   ```
6. **Configures each pane**:
   - Session name set to robot name
   - Working directory set to robot folder
   - Badge displaying robot emoji + name
   - Custom prompt showing robot context

---

## Usage

### Quick Start

```bash
cd /Users/will/flutterProjects/Exercises/oct/romev2

# Run the setup script
./ROME/scripts/setup-workspace.sh
```

### Step-by-Step

1. **Navigate to ROME root**:
   ```bash
   cd /path/to/ROME
   ```

2. **Run script**:
   ```bash
   ./ROME/scripts/setup-workspace.sh
   ```

3. **Enter project name** when prompted:
   ```
   Enter project name: InventorySystem
   ```

4. **Wait for completion** - Script will:
   - Create directories
   - Generate robots
   - Launch iTerm with layout
   - Show confirmation dialog

5. **Start working**:
   - Click on TALIB pane
   - Type `claude` to start Phase 1
   - Place your PRD in `Project/requirements/`

---

## iTerm Layout Details

### Top Row - Phase 1 & 2
- **TALIB** (📋): HTM Requirements Engineer - Phase 1
- **PMA** (🏗️): Project Manager/Architect - Phase 2
- **CHAPERONE** (✅): Specification Validator - Phase 2B

### Middle Row - Phase 2A & 3
- **CLARA** (🎨): UX Designer - Phase 2A
- **ASHOK** (🗄️): Data Architect - Phase 3 (Data)
- **REENA** (⚙️): Backend Engineer - Phase 3 (Backend)

### Bottom Row - Phase 3
- **CHARLIE** (🖥️): Frontend Developer - Phase 3 (Frontend)

---

## Badge Configuration

Badges display automatically via escape sequences. To customize badges:

### Manual Badge Setting
In any pane:
```bash
printf '\e]1337;SetBadgeFormat=%s\a' $(echo -n 'YOUR TEXT' | base64)
```

### Enable Badges in iTerm
1. Open iTerm Preferences
2. Go to Profiles → General
3. Check "Badge" checkbox
4. Badges will now appear in bottom-right of panes

---

## Project Structure Created

```
ROME/
├── Project → InventorySystem/     (symlink)
├── InventorySystem/                (actual project directory)
│   ├── requirements/
│   ├── dev/
│   ├── design/
│   └── user_docs/
├── robot_talib/
│   ├── .claude/
│   │   └── CLAUDE.md → ../../ROME/templates/claude-md/talib.md
│   ├── notes/
│   └── README.md → ../role-talib.md
├── robot_pma/
├── robot_chaperone/
├── robot_clara/
├── robot_ashok/
├── robot_reena/
└── robot_charlie/
```

---

## Workflow After Setup

### Phase 1: Requirements (TALIB pane)
```bash
# In TALIB pane
claude

# Tell Talib:
"Hi Talib, please read Project/requirements/my-prd.pdf and begin Phase 1"
```

### Phase 2: Architecture (PMA pane)
```bash
# In PMA pane (after Phase 1 complete)
claude

# Tell PMA:
"Hi PMA, Phase 1 is complete. Please validate artifacts and begin Phase 2"
```

### Phase 2A: UX Design (CLARA pane)
```bash
# In CLARA pane (when PMA identifies UI requirements)
claude

# Tell Clara:
"Hi Clara, please create UX specifications based on requirements"
```

### Phase 3: Development (ASHOK, REENA, CHARLIE panes)
Start with ASHOK (data layer must be ready first):
```bash
# In ASHOK pane
claude

# Tell Ashok:
"Hi Ashok, implement database schema from data_model.md"
```

Then REENA (backend APIs):
```bash
# In REENA pane
claude

# Tell Reena:
"Hi Reena, implement APIs using Ashok's data layer"
```

Finally CHARLIE (frontend):
```bash
# In CHARLIE pane
claude

# Tell Charlie:
"Hi Charlie, implement UI using Clara's designs and Reena's APIs"
```

---

## Customization

### Modify Layout

Edit `setup-rome-workspace.applescript` to change:
- Pane arrangement
- Badge emojis
- Prompt format
- Additional automation

### Add Auto-Launch Claude

To automatically start `claude` in each pane, add after each `write text "cd..."`:
```applescript
write text "claude"
```

### Change Split Ratios

iTerm doesn't support setting split ratios via AppleScript directly. Adjust manually after launch or use iTerm's "Save Window Arrangement" feature.

---

## Troubleshooting

### iTerm Not Opening
**Issue**: Script runs but iTerm doesn't open
**Fix**: Grant AppleScript permission to control iTerm:
1. System Preferences → Security & Privacy → Automation
2. Check "iTerm" under script name

### Badges Not Showing
**Issue**: No badges visible in panes
**Fix**:
1. iTerm Preferences → Profiles → General → Badge (check)
2. Restart iTerm

### Wrong Directory in Panes
**Issue**: Panes don't navigate to robot folders
**Fix**: Ensure `create-robot.sh` ran successfully:
```bash
ls -la robot_talib/.claude/CLAUDE.md
# Should show symlink
```

### Project Already Exists
**Issue**: "File exists" error
**Fix**: Remove existing project or symlink:
```bash
rm -rf Project ProjectName
./ROME/scripts/setup-workspace.sh
```

---

## Advanced Usage

### Multiple Projects

Run script multiple times with different project names:
```bash
# First project
./ROME/scripts/setup-workspace.sh
# Enter: InventorySystem

# Later, second project
./ROME/scripts/setup-workspace.sh
# Enter: CRMSystem
```

Each creates separate workspace. Switch by changing `Project` symlink:
```bash
rm Project && ln -s InventorySystem Project
```

### Restore Workspace

If iTerm closes, restore layout:
```bash
./ROME/scripts/restore-workspace.sh ProjectName
```
(Would need to create this script if desired)

---

## Files Created

- `setup-rome-workspace.applescript` - Main AppleScript
- `setup-workspace.sh` - Shell launcher wrapper
- `README-workspace-setup.md` - This file

---

## Related Documentation

- `/ROME/guide-robot-setup.md` - Robot directory structure
- `/ROME/start-here.md` - ROME methodology overview
- `/ROME/integration/quick-start-htm-rome.md` - Phase-by-phase workflow

---

**Status**: Ready to use
**Version**: 1.0
**Last Updated**: 2025-11-06
