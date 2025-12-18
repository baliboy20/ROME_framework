# Bootstrap Content Review - Adaptation to ROME Standards

## Document Analysis: ROME v8.0 vs Current ROME Framework

---

## ✅ DIRECTLY USABLE CONTENT

### 1. Mission Statement Concept
**From v8.0:**
```
You are the Project Bootstrap Orchestrator - responsible for setting up a complete ROME project.
Your job is to:
1. Gather project information from the sponsor
2. Validate prerequisites
3. Initialize tracking database
4. Create framework symlink (read-only)
5. Create robot workspaces
6. Create initial SOURCE/ structure
7. Guide sponsor through first steps
```

**Adaptation for Current ROME:**
- ✅ Gather project information (via sponsor-interaction.md procedures)
- ✅ Validate prerequisites (adapt for our tech stack)
- ⚠️ Replace MongoDB/MCP with our traceability approach (ARTIFACTS/reference/meetings/sponsor-interactions.md)
- ✅ Framework symlink concept (read-only ROME)
- ✅ Robot workspace creation (we have 8 robots defined)
- ✅ SOURCE/ structure (adapt to our ARTIFACTS/ approach)
- ✅ Sponsor guidance

---

### 2. Project Information Gathering
**From v8.0:**
```
- Project Name (alphanumeric, CamelCase or snake_case)
- Project Description (1-2 sentences)
- Sponsor Name/Email
```

**Adaptation:**
- ✅ Adopt these fields for `.rome-project.json`
- ✅ Add validation rules (alphanumeric check)
- ✅ CamelCase/snake_case convention aligns with our standards
- ➕ **ADD**: Phase status tracking, ROME framework version

**Proposed .rome-project.json Structure:**
```json
{
  "projectName": "ProjectName",
  "projectDescription": "Brief description",
  "sponsor": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "created": "2025-11-20T00:00:00Z",
  "romeVersion": "1.0",
  "frameworkPath": "/Users/will/.../ROME",
  "phases": {
    "current": "bootup",
    "completed": []
  },
  "robots": {
    "orchestrator": "roma",
    "active": ["bootstrap"]
  }
}
```

---

### 3. Framework Symlink Process
**From v8.0:**
```bash
# Locate ROME framework
ROME_FRAMEWORK=$(cd "$(dirname "$PWD")" && pwd)

# Create symlink
ln -sf "$ROME_FRAMEWORK" ROME

# Verify
ls -la ROME
```

**Adaptation:**
- ✅ Use identical approach
- ✅ Verify symlink is read-only (chmod if needed)
- ✅ Add validation: symlink resolves to valid ROME framework
- ✅ Check for foundation documents (ROME-PRIN-001, ROME-LEX-001, ROME-GOV-001)

---

### 4. Robot Workspace Creation Concept
**From v8.0:**
```
robots = ['roma', 'talib', 'pma', 'clara', 'sarah', 'ashok', 'reena', 'charlie']
```

**Adaptation:**
- ✅ We have same 8 robots defined
- ✅ Create workspaces from robot-templates
- ✅ Copy CLAUDE.md from templates
- ✅ Create .claude/ subdirectory
- ⚠️ Replace MCP tool calls with bash/file operations

**Implementation:**
```bash
for robot in bootstrap talib pma roma sarah clara charlie reena; do
  mkdir -p "robots/${robot}/.claude"
  cp "ROME/robot-templates/${robot}/CLAUDE.md" "robots/${robot}/"
done
```

---

### 5. Validation Checks
**From v8.0:**
```bash
# Check symlink
[ -L "ROME" ] && echo "✓ ROME symlink exists" || echo "✗ ROME symlink missing"

# Check robots
[ -d "robots/roma" ] && echo "✓ Robot workspaces created" || echo "✗ Robot workspaces missing"

# Check SOURCE structure
[ -d "SOURCE/docs" ] && echo "✓ SOURCE/docs created" || echo "✗ SOURCE/docs missing"
```

**Adaptation:**
- ✅ Adopt validation approach
- ✅ Add to Quality Gates section of operations-guidelines.md
- ✅ Check all required directories
- ✅ Validate .rome-project.json well-formed JSON
- ➕ **ADD**: Validate git repository initialized

---

### 6. Success Message Template
**From v8.0:**
```markdown
================================================
🎉 Project Initialized Successfully!
================================================

Project Name: ${PROJECT_NAME}
Database: ${DATABASE_NAME}
Framework: ${ROME_FRAMEWORK}
```

**Adaptation:**
- ✅ Use similar success message format
- ⚠️ Remove database references (not using MongoDB/MCP)
- ✅ Guide sponsor to next steps (upload requirements)
- ✅ Clear instructions on where to place materials

---

## ⚠️ REQUIRES SIGNIFICANT ADAPTATION

### 1. MCP/MongoDB Integration
**From v8.0:**
- Uses MongoDB for activity tracking
- MCP tools for robot creation
- Database initialization procedures

**Our Approach:**
- ❌ Not using MongoDB/MCP
- ✅ Use git commits for traceability
- ✅ Use ARTIFACTS/reference/ for tracking
- ✅ Use .rome-project.json for phase status
- ✅ Reference ROME-PROC-002 (sponsor-interaction.md) for tracking

---

### 2. Directory Structure Differences
**v8.0 Structure:**
```
SOURCE/
├── docs/
│   ├── 00-requirements/
│   ├── 01-architecture/
│   ├── 02-design/
│   ├── 03-quality/
│   └── 04-deployment/
├── artifacts/
└── tests/
```

**Our Structure:**
```
SOURCE/                    → Application code only
├── [workspaces]/
├── tests/
└── config/

ARTIFACTS/                 → Phase outputs (separate from code)
├── 00-bootup/
├── 01-ingest/
├── 02-analysis/
├── 03-design/
├── 04-config/
├── 05-generation/
└── reference/
```

**Adaptation:**
- ✅ Keep separate ARTIFACTS/ and SOURCE/
- ✅ ARTIFACTS/ contains phase outputs and docs
- ✅ SOURCE/ contains only executable code
- ✅ Clearer separation of concerns

---

### 3. Phase Naming Differences
**v8.0 Phases:**
- PHASE-1: Requirements (Talib)
- PHASE-2: Architecture (PMA)
- PHASE-2a: Design (Clara) - Optional
- PHASE-2b: Quality Gate (Sarah) - Mandatory
- PHASE-3: Implementation (Ashok, Reena, Charlie)

**Our Phases:**
- Phase Bootup: Framework setup (Bootstrap)
- Phase 0 (Ingest): Intake raw materials
- Phase 1 (Analysis): Atomic requirements (Talib)
- Phase 2 (Design): Architecture (PMA, Clara, Sarah)
- Phase 3 (Config): Technical specs (Charlie, Reena)
- Phase 4 (Generation): Code generation

**Adaptation:**
- ✅ Map v8.0 content to our phase structure
- ✅ Talib in Phase 1 (Analysis) - same role
- ✅ PMA/Clara in Phase 2 (Design) - same role
- ✅ Sarah in Phase 2 (Quality Gate) - adapt
- ⚠️ Different config/generation split

---

## 📝 RECOMMENDED ADDITIONS TO OUR BOOTSTRAP

### From v8.0 Content:

1. **Project Name Validation**
   ```bash
   # Validate project name (alphanumeric, no spaces)
   if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9_]+$ ]]; then
     echo "Error: Project name must be alphanumeric (CamelCase or snake_case)"
     exit 1
   fi
   ```

2. **Prerequisite Checks**
   ```bash
   # Check git installed
   command -v git >/dev/null 2>&1 || {
     echo "Error: git is required but not installed"
     exit 1
   }

   # Check framework exists
   if [ ! -d "$ROME_FRAMEWORK" ]; then
     echo "Error: ROME framework not found at: $ROME_FRAMEWORK"
     exit 1
   fi
   ```

3. **.gitignore Template**
   ```
   # ROME Framework (symlinked, not tracked)
   /ROME

   # Robot local state
   robots/*/.claude/*
   !robots/*/.claude/.gitkeep

   # Build artifacts
   **/node_modules/
   **/dist/
   **/build/
   **/.DS_Store

   # IDE
   .vscode/
   .idea/
   *.swp

   # Logs
   *.log
   ```

4. **README.md Template Variables**
   ```markdown
   # ${PROJECT_NAME}

   **Description**: ${PROJECT_DESCRIPTION}
   **Sponsor**: ${SPONSOR}
   **Created**: ${CREATED_DATE}
   **ROME Version**: ${ROME_VERSION}
   **Status**: ${STATUS}

   ## Phase Status
   - [ ] Bootup
   - [ ] Ingest
   - [ ] Analysis
   - [ ] Design
   - [ ] Config
   - [ ] Generation
   ```

5. **Interactive Sponsor Guidance**
   ```markdown
   ================================================
   NEXT STEPS
   ================================================

   1. UPLOAD REQUIREMENTS
      Place your documents here:
      ARTIFACTS/01-ingest/source-materials/

      Acceptable formats:
      - PDF documents
      - Markdown files (.md)
      - Word documents (.docx)
      - Meeting notes
      - Design sketches

   2. LAUNCH ORCHESTRATOR (Roma)
      cd robots/roma
      claude

      Roma will coordinate the ingest phase.

   3. REVIEW FRAMEWORK DOCS
      - Core Principles: ROME/foundation/core-principles.md
      - Lexicon: ROME/foundation/lexicon.md
      - Document Governance: ROME/foundation/document-governance.md
   ```

6. **Error Recovery Instructions**
   ```markdown
   ## Troubleshooting

   ### "Symlink creation failed"
   rm -f ROME
   ln -sf /absolute/path/to/ROME ROME
   ls -la ROME  # Verify

   ### "Git not initialized"
   git init
   git add .
   git commit -m "Initial ROME project structure"

   ### "Robot workspace missing"
   # Re-run robot creation from bootstrap instructions
   ```

---

## ❌ NOT APPLICABLE TO OUR FRAMEWORK

### 1. MCP Server Configuration
- v8.0 uses `.mcp.json` with activity-log, Seez, setup-robots servers
- ❌ Not using MCP tools
- ✅ Use standard bash/git operations

### 2. Interactive Forms (Seez)
- v8.0 uses Seez MCP server for interactive prompts
- ❌ Not using Seez
- ✅ Use sponsor-interaction.md procedures (ROME-PROC-002)

### 3. Database Activity Tracking
- v8.0 tracks phases/stories in MongoDB
- ❌ Not using MongoDB
- ✅ Use git commits + ARTIFACTS/reference/ logs

### 4. Technology-Specific Workspace Creation
- v8.0 defers workspace creation until PMA defines tech stack
- ⚠️ Our approach: SOURCE/ created during bootup, populated during Generation
- ✅ Similar concept: don't assume tech stack early

---

## 🎯 PROPOSED INTEGRATION PLAN

### 1. Update project-setup-instructions.md (ROME-PROC-001)

**Add from v8.0:**
- Project name validation logic
- Prerequisite checks (git, framework location)
- .gitignore template
- README.md template with variables
- Success message with clear next steps
- Troubleshooting section

**Keep our approach:**
- ARTIFACTS/ vs SOURCE/ separation
- Our phase structure (0-4 + Bootup)
- Git-based traceability (no MongoDB)
- Reference to sponsor-interaction.md (ROME-PROC-002)

### 2. Create New Documents

**bootstrap-templates/ folder:**
- `.gitignore` template
- `README.md` template
- `.rome-project.json` schema

**Add to lexicon.md:**
- Term: "Project Name" - validation rules
- Term: "Sponsor" - role definition
- Term: ".rome-project.json" - metadata file format

### 3. Update P01-operations-guidelines.md

**Add sections:**
- Entry Criteria: Prerequisites validation
- Quality Gates: Validation checklist (from v8.0)
- Outputs: List of created files/folders
- Operational Procedures: Step-by-step from project-setup-instructions.md

---

## 📊 COMPATIBILITY MATRIX

| Feature | v8.0 Approach | Our Approach | Action |
|---------|---------------|--------------|--------|
| Project metadata | .rome-project.json | .rome-project.json | ✅ Adopt v8.0 fields |
| Framework access | Symlink (read-only) | Symlink (read-only) | ✅ Identical |
| Robot workspaces | 8 robots | 8 robots | ✅ Identical |
| Activity tracking | MongoDB/MCP | Git + ARTIFACTS/ | ⚠️ Adapt approach |
| Phase structure | 5 phases | 6 phases (0-4 + Bootup) | ⚠️ Map concepts |
| Directory layout | SOURCE/docs + artifacts | ARTIFACTS/ + SOURCE/ | ⚠️ Use our structure |
| Sponsor interaction | Seez forms | sponsor-interaction.md | ⚠️ Use ROME-PROC-002 |
| Validation | Bash checks | Bash checks | ✅ Adopt v8.0 approach |
| Error handling | Troubleshooting section | error-recovery.md | ✅ Reference ROME-PROC-003 |
| Success message | Formatted output | (none currently) | ✅ Adopt v8.0 template |

---

## 🔧 RECOMMENDED CHANGES TO OUR DOCUMENTS

### 1. project-setup-instructions.md (ROME-PROC-001)
- ➕ Add project name validation
- ➕ Add prerequisite checks section
- ➕ Add .rome-project.json creation with v8.0 fields
- ➕ Add .gitignore creation
- ➕ Add README.md template creation
- ➕ Add success message template
- ➕ Add troubleshooting section
- ✅ Keep our ARTIFACTS/ + SOURCE/ structure

### 2. P01-operations-guidelines.md (ROME-PHASE-001)
- ➕ Add Entry Criteria section (prerequisites)
- ➕ Add Exit Criteria section (validation checklist)
- ➕ Add Outputs section (explicit list)
- ➕ Reference project-setup-instructions.md
- ➕ Add troubleshooting references to error-recovery.md

### 3. Create bootstrap-templates/ folder
```
ROME/robot-templates/bootstrap/
├── CLAUDE.md
├── .claude/
├── project-setup-instructions.md (existing)
└── templates/                     (NEW)
    ├── gitignore-template
    ├── readme-template.md
    └── rome-project-schema.json
```

---

## 💡 KEY INSIGHTS FROM v8.0

### 1. Clear Sponsor Guidance
v8.0 excels at guiding sponsors through next steps. We should adopt:
- Explicit file upload locations
- Clear formatting of next actions
- Step-by-step numbered instructions
- Visual separators (===) for sections

### 2. Validation-First Approach
v8.0 validates prerequisites before proceeding. Adopt:
- Check git installed
- Check framework accessible
- Validate project name format
- Verify permissions

### 3. Troubleshooting Embedded
v8.0 includes troubleshooting in bootstrap docs. Adopt:
- Common error scenarios
- Recovery commands
- References to deeper docs (our error-recovery.md)

### 4. Metadata-Driven
v8.0 uses .rome-project.json extensively. Enhance ours:
- Track phase progression
- Record orchestrator assignment
- Store framework version for compatibility

---

## ✅ FINAL RECOMMENDATIONS

### ADOPT IMMEDIATELY:
1. Project name validation logic
2. .rome-project.json enhanced schema
3. .gitignore template
4. README.md template
5. Success message with sponsor guidance
6. Validation checklist approach
7. Troubleshooting section

### ADAPT WITH CHANGES:
1. Directory structure (use our ARTIFACTS/ + SOURCE/)
2. Phase tracking (use our 6-phase model)
3. Activity tracking (git + files, not MongoDB)
4. Sponsor interaction (use ROME-PROC-002)

### REJECT:
1. MCP server integration
2. MongoDB activity tracking
3. Seez interactive forms
4. v8.0's 5-phase model

---

## 🔌 MCP SERVER ANALYSIS (v10 AVAILABLE TOOLS)

### Available MCP Servers
Four MCP servers are available in ROME v10 environment:
1. **setup-robots** - ROME robot/project directory management
2. **Seez** - Interactive UI, forms, charts, documentation display
3. **activity-log** - MongoDB-based activity/phase tracking
4. **rome-terminal** - Flutter Multi-Terminal integration

---

### 1. setup-robots MCP Server

**Tools:**
- `create_robot(robot_name, rome_path?, overwrite?)` - Create robot directory structure
  - Supports: talib, pma, clara, sarah, ashok, reena, charlie, roma
  - Creates config files, templates, notes
  - Auto-detects ROME path
- `list_robots()` - List available robots with descriptions/phases
- `reset_robots(confirm)` - Remove all robot directories + symlinks
- `create_project_structure(project_name, project_path, description?, sponsor?)` - Complete project setup
  - Creates subdirectories
  - Creates PROJECT.md
  - Creates ARTIFACTS symlink in ROME parent directory

**Integration Assessment:**
- ✅ **ADOPT IMMEDIATELY** - Replaces manual bash scripts
- ✅ Ensures consistent robot workspace creation
- ✅ Handles ROME path auto-detection
- ✅ Creates ARTIFACTS symlink (aligns with our structure)
- ✅ Template-driven approach (consistent with robot-templates/)
- ⚠️ **VERIFY**: Template locations match our framework paths
- ✅ **USE IN**: project-setup-instructions.md (ROME-PROC-001)

**Recommended Integration:**
```markdown
## Robot Workspace Creation
Use `mcp__setup-robots__create_robot` for each robot:
- bootstrap, roma, talib, pma, clara, sarah, charlie, reena

## Project Structure Creation
Use `mcp__setup-robots__create_project_structure`:
- Creates ARTIFACTS/ subdirectories
- Generates PROJECT.md with metadata
- Establishes symlinks
```

---

### 2. Seez MCP Server

**Tools:**
- `show_chart(content, label)` - Display Mermaid diagrams in tabs
- `show_doc(content, label)` - Display formatted markdown in tabs
- `ask_questions(label, title, questions[], description?, submitLabel?, autoDismiss?, playSound?)` - Interactive forms
  - Question types: text, textarea, radio, checkbox
  - Multi-select support
  - Validation (required fields)
  - Returns JSON responses
- `update_view(tab_id, content)` - Update existing tab
- `close_tab(tab_id)` / `close_all_tabs()` - Tab management
- `list_tabs()` - List open tabs with IDs, labels, types, content
- `clear_session_data(scope?)` - IPC cleanup (current/all)

**Integration Assessment:**
- ✅ **ADOPT FOR SPONSOR INTERACTION** - Superior UX vs text prompts
- ✅ Replaces manual Q&A in sponsor-interaction.md
- ✅ Can collect project metadata interactively
- ✅ Visual documentation display (show phase guides, checklists)
- ✅ Mermaid diagram support (architecture visualization)
- ⚠️ **DEPENDENCY**: Requires Flutter app running
- ⚠️ **UPDATE REJECT DECISION**: Seez should be ADOPTED, not rejected
- ✅ **USE IN**: project-setup-instructions.md, sponsor-interaction.md (ROME-PROC-002)

**Recommended Integration:**
```markdown
## Project Metadata Collection
Use `mcp__Seez__ask_questions` to gather:
- Project name (text, validation: alphanumeric)
- Project description (textarea)
- Sponsor name/email (text, required)
- Technology preferences (checkbox, multi-select)

## Sponsor Guidance
Use `mcp__Seez__show_doc` to display:
- Next steps after bootstrap
- Phase transition instructions
- Troubleshooting guides
```

**Revised Assessment:**
- ❌ **PREVIOUS REJECTION INCORRECT** - Seez provides significant value
- ✅ Aligns with sponsor-interaction goals (structured input collection)
- ✅ Enhances sponsor experience (visual guidance)
- ✅ Reduces bootstrap friction (interactive vs command-line)

---

### 3. activity-log MCP Server

**Tools:**
- `initialize_database(databaseName, host?, port?)` - Create/name MongoDB database
- `add_entry(entry)` - Add feature/story/blocker/amendment/phase entry
- `update_entry(id, updates)` / `delete_entry(id)` - Modify entries
- `find_by_id(id)` - Single entry lookup
- `find_by_feature(featureId)` - All entries for feature
- `find_by_robot(robot)` - All entries for robot
- `find_by_status(status)` - Query by status (PENDING/IN_PROGRESS/COMPLETED/BLOCKED)
- `find_by_phase(phase)` - Query by phase (1, 2, 2a, 2b, 3)
- `find_by_layer(layer)` - Query by layer (database/backend/frontend)
- `list_all_entries(filters?)` - List with optional filters
- `get_statistics()` - Database stats
- `get_entry_instructions(type)` - Schema docs for entry types
- `list_entry_types()` - Available entry types with descriptions
- `validate_entry(entry)` - Pre-validation before insert

**Entry Schema:**
- Types: feature, story, blocker, amendment, phase
- Fields: featureId, status, phase, robot, layer, timestamps, dependencies

**Integration Assessment:**
- ❌ **REJECT - FUNDAMENTAL CONFLICT** - MongoDB dependency conflicts with git-based traceability
- ❌ ROME-PROC-002 (sponsor-interaction.md) mandates git commits for traceability
- ❌ Introduces external database dependency (MongoDB)
- ⚠️ **PARTIAL VALUE**: Entry schema structure is valuable
- ✅ **ALTERNATIVE**: Adapt entry schema to ARTIFACTS/reference/ file-based tracking
- ❌ **DO NOT USE** in ROME v10 framework

**Alternative Approach:**
```markdown
## Git-Based Activity Tracking (Instead of MongoDB)
Structure: ARTIFACTS/reference/activity-log/
- features.md - Feature registry
- stories.md - Story tracking
- blockers.md - Blocker log
- amendments.md - Change log

Schema: Markdown tables with same fields as activity-log entry schema
Traceability: Git commits provide timestamps, authorship, history
```

**Recommendation:**
- ❌ Do not integrate activity-log MCP server
- ✅ Extract schema design patterns
- ✅ Implement file-based equivalent in ARTIFACTS/reference/
- ✅ Maintain git-based traceability (ROME-PROC-002 compliance)

---

### 4. rome-terminal MCP Server

**Tools:**
- `create_terminal(workingDirectory?, title?, badge?, badgeImagePath?)` - Create terminal session
- `list_terminals()` - List active terminal sessions
- `execute_command(terminal_id, command)` - Execute command in specific terminal
- `close_terminal(terminal_id)` - Close session
- `get_terminal_info(terminal_id)` - Get session info
- `list_badge_images()` - Available badge images from assets/images
- `add_robot(robot_name, workingDirectory?)` - Create terminal with robot config
  - Supported: charlie, ashok, clara, roma, talib, sarah, reena
  - Predefined configurations per robot

**Integration Assessment:**
- ✅ **ADOPT FOR ROBOT WORKSPACE MANAGEMENT** - Excellent UX enhancement
- ✅ One terminal per robot with visual identity (badges)
- ✅ Simplifies robot activation workflow
- ✅ Aligns with 8-robot architecture
- ✅ Working directory management per robot
- ⚠️ **DEPENDENCY**: Requires Flutter Multi-Terminal app
- ✅ **USE IN**: Phase transition procedures, robot activation guides
- ✅ **ENHANCEMENT**: Visual clarity for sponsor (which robot is active)

**Recommended Integration:**
```markdown
## Robot Activation (Phase Transitions)
Use `mcp__rome-terminal__add_robot` to launch robots:

Phase 0 (Ingest): roma (orchestrator)
Phase 1 (Analysis): talib
Phase 2 (Design): pma, clara, sarah
Phase 3 (Config): charlie, reena

Each robot gets dedicated terminal with:
- Robot-specific badge/icon
- Working directory: robots/{robot_name}/
- Visual identity for sponsor orientation
```

**Benefits:**
- ✅ Reduces sponsor confusion (clear visual context)
- ✅ Parallel robot execution (multiple terminals)
- ✅ Persistent session management
- ✅ Command history per robot

---

## 🔄 REVISED RECOMMENDATIONS BASED ON MCP TOOLS

### ✅ ADOPT (Updated from original assessment)

**From v8.0 + MCP Tools:**
1. Project name validation logic
2. Enhanced .rome-project.json schema
3. .gitignore template
4. README.md template
5. Success message with sponsor guidance
6. Validation checklist approach
7. Troubleshooting section
8. **setup-robots MCP tools** - robot/project directory creation
9. **Seez MCP tools** - interactive sponsor interaction, visual guidance
10. **rome-terminal MCP tools** - robot workspace management, visual clarity

### ⚠️ ADAPT

**From v8.0:**
1. Directory structure (ARTIFACTS/ + SOURCE/)
2. Phase tracking (6-phase model: Bootup + P0-P4)
3. ~~Activity tracking (git + files, not MongoDB)~~ → **EXTRACT SCHEMA DESIGN**
4. Sponsor interaction ~~(ROME-PROC-002)~~ → **ENHANCED WITH SEEZ**

**From activity-log MCP:**
- ✅ Extract entry schema patterns (feature/story/blocker/amendment)
- ✅ Implement file-based equivalent in ARTIFACTS/reference/
- ✅ Maintain git traceability

### ❌ REJECT

1. ~~MCP server integration~~ → **INCORRECT - ADOPT setup-robots, Seez, rome-terminal**
2. **activity-log MCP server** - MongoDB dependency conflicts with git-based traceability
3. ~~Seez interactive forms~~ → **INCORRECT - ADOPT FOR SPONSOR INTERACTION**
4. v8.0's 5-phase model

---

## 📝 UPDATED INTEGRATION PLAN

### 1. Update project-setup-instructions.md (ROME-PROC-001)

**Add from v8.0:**
- Project name validation logic
- Prerequisite checks (git, framework location)
- .gitignore template
- README.md template
- Success message template
- Troubleshooting section

**Add from MCP tools:**
- Use `mcp__setup-robots__create_project_structure` for directory creation
- Use `mcp__setup-robots__create_robot` for robot workspace creation
- Use `mcp__Seez__ask_questions` for interactive metadata collection
- Use `mcp__Seez__show_doc` for sponsor guidance display
- Use `mcp__rome-terminal__add_robot` for bootstrap robot activation

**Keep our approach:**
- ARTIFACTS/ vs SOURCE/ separation
- 6-phase structure (Bootup + P0-P4)
- Git-based traceability

### 2. Update sponsor-interaction.md (ROME-PROC-002)

**Add:**
- Seez-based interaction patterns
- Interactive form templates for common sponsor questions
- Mermaid diagram templates for architecture review
- Terminal management for sponsor-visible robot activation

### 3. Create bootstrap-templates/ folder

**Templates:**
- `.gitignore` template
- `README.md` template
- `.rome-project.json` schema
- **Seez question templates** (project metadata, preferences)
- **Sponsor guidance docs** (next steps, troubleshooting)

### 4. Create activity-tracking-schema.md (file-based alternative)

**Document:**
- Entry types (feature, story, blocker, amendment, phase)
- Field definitions (featureId, status, phase, robot, layer)
- Markdown table schema
- Git commit conventions for tracking
- Location: ARTIFACTS/reference/activity-log/

---

## 🎯 KEY INSIGHT: MCP TOOLS ENABLE SUPERIOR UX

**Original v8.0 rejection of MCP tools was premature:**
- ✅ **setup-robots**: Eliminates bash script fragility, ensures consistency
- ✅ **Seez**: Transforms sponsor interaction from text-based to interactive
- ✅ **rome-terminal**: Provides visual clarity for multi-robot orchestration
- ❌ **activity-log**: Correct rejection (MongoDB conflicts with git traceability)

**MCP integration enhances ROME framework:**
- Superior sponsor experience (interactive forms vs command-line)
- Visual clarity (badges, tabs, diagrams)
- Consistency (template-driven robot creation)
- Traceability (git commits + structured metadata)

**Framework remains git-based, MCP tools enhance interface layer, not data persistence layer.**

---

**Status**: MCP tool analysis complete, integration recommendations updated
**Priority**: High - MCP tools significantly improve bootstrap UX
**Estimated Effort**:
- Update 3 documents (ROME-PROC-001, ROME-PROC-002, P01-operations-guidelines.md)
- Create 5-7 template files (gitignore, readme, schema, Seez templates)
- Document activity-tracking file-based schema
