# How to Add Skills to Robot Plugins (ROME-PROP-020)

## Overview

Skills are capabilities that belong to robots. Each skill lives in the robot's plugin directory structure and is declared in the robot's `plugin.json` file.

## Complete Process

### Step 1: Create Skill Directory

```bash
mkdir -p ROME/robot-plugins/{robot-name}/skills/{skill-name}
```

**Example:**
```bash
mkdir -p ROME/robot-plugins/charlie/skills/apply-flutter-standards
```

### Step 2: Create SKILL.md File

Create a `SKILL.md` file in the skill directory following this template:

```markdown
# {Skill Title}

**ID**: {skill-id}
**Category**: {category}
**Phase**: {phase}
**Robot**: {robot-name}

## Purpose

{What this skill does and why it's needed}

## Inputs

- {Input artifact 1} (description)
- {Input artifact 2} (description)
- {Input artifact 3} (description)

## Outputs

- {Output artifact 1}
- {Output artifact 2}
- {Output artifact 3}

## Process

1. {Step 1}
2. {Step 2}
3. {Step 3}
...

## Example Output

```{language}
{Code example showing what this skill produces}
```

## AORDL Traceability

- {Requirement} → {Output mapping}
- {Design decision} → {Implementation choice}

## References

- {Link to documentation}
- {Link to best practices}
```

**Required Sections:**
- **ID** - Unique identifier (matches directory name)
- **Category** - Type of skill (e.g., "Frontend & UI", "Backend & API", "Data Layer")
- **Phase** - When used (e.g., "P5 (Generation)")
- **Robot** - Owner robot name
- **Purpose** - Clear explanation
- **Inputs** - What artifacts/files the skill needs
- **Outputs** - What the skill produces
- **Process** - Step-by-step procedure
- **Example Output** - Concrete code/artifact examples
- **AORDL Traceability** - How it maps to requirements

### Step 3: Update plugin.json - Add to Skills Array

Edit `ROME/robot-plugins/{robot-name}/.claude-plugin/plugin.json`:

```json
{
  "provides": {
    "robot": "charlie",
    "modes": ["P5-generation"],
    "skills": [
      "existing-skill-1",
      "existing-skill-2",
      "new-skill-name"  // ← Add here
    ]
  }
}
```

### Step 4: Update plugin.json - Add to Exports

Add the skill to the exports section:

```json
{
  "exports": {
    "ROBOT.md": "Core robot identity and baseline behavior",
    "modes/P5-generation.md": "P5 mode",
    "skills/existing-skill/SKILL.md": "Existing skill",
    "skills/new-skill-name/SKILL.md": "New skill description"  // ← Add here
  }
}
```

### Step 5: Update plugin.json - Add to Capabilities (Optional)

If this skill represents a new major capability, add it:

```json
{
  "robot": {
    "capabilities": [
      "Existing capability 1",
      "Existing capability 2",
      "New capability from this skill"  // ← Add here
    ]
  }
}
```

### Step 6: Commit Changes

```bash
git add ROME/robot-plugins/{robot-name}/
git commit -m "feat({robot}): add {skill-name} skill

{Description of what the skill does and why it was added}
"
```

---

## Example: Adding Flutter Skills to Charlie

### What We Just Did

**Step 1: Created skill directories**
```bash
mkdir -p ROME/robot-plugins/charlie/skills/apply-flutter-standards
mkdir -p ROME/robot-plugins/charlie/skills/select-flutter-libraries
```

**Step 2: Created SKILL.md files**
- `apply-flutter-standards/SKILL.md` - 200+ lines documenting Flutter coding standards
- `select-flutter-libraries/SKILL.md` - 400+ lines documenting Flutter package selection

**Step 3-5: Updated plugin.json**
```json
{
  "provides": {
    "skills": [
      "generate-ui-screens",
      "generate-ui-components",
      "apply-flutter-standards",      // ← NEW
      "select-flutter-libraries"      // ← NEW
    ]
  },
  "exports": {
    "skills/apply-flutter-standards/SKILL.md": "Apply Flutter coding standards skill",
    "skills/select-flutter-libraries/SKILL.md": "Select Flutter libraries skill"
  },
  "robot": {
    "capabilities": [
      "Flutter coding standards enforcement",
      "Flutter library selection and integration"
    ]
  }
}
```

**Step 6: Committed**
```bash
git commit -m "feat(charlie): add Flutter-specific skills..."
```

---

## Skill Naming Conventions

**Skill IDs** (directory names and ID field):
- Use kebab-case: `apply-flutter-standards`
- Be specific: `generate-ui-screens` not just `generate`
- Use verb-noun pattern: `validate-aordl`, `design-api-endpoints`

**Categories:**
- Frontend & UI
- Backend & API
- Data Layer
- Code Quality
- Technology Selection
- Testing
- Documentation

**Common Verbs:**
- `generate-` - Create new artifacts
- `validate-` - Check correctness
- `design-` - Create specifications
- `apply-` - Enforce standards
- `select-` - Choose technologies
- `configure-` - Set up systems

---

## Skill Organization by Robot

**Current Structure:**

```
ROME/robot-plugins/
├── talib/skills/          # Requirements & Analysis (6 skills)
│   ├── create-aordl-requirement/
│   ├── validate-aordl/
│   ├── transform-aordl-to-bdd/
│   ├── analyze-requirement/
│   ├── batch-analyze-requirements/
│   └── generate-user-stories/
├── pma/skills/            # Design & Architecture (12 skills)
│   ├── design-api-controllers/
│   ├── design-dto-models/
│   └── ...
├── lucien/skills/         # DevOps & Config (8 skills)
│   ├── scaffold-workspace/
│   ├── configure-build-system/
│   └── ...
├── ashok/skills/          # Database Layer (4 skills)
│   ├── generate-database-schema/
│   ├── generate-migrations/
│   ├── generate-orm-models/
│   └── generate-seed-data/
├── reena/skills/          # Backend API (2 skills)
│   ├── generate-api-endpoints/
│   └── generate-authentication-middleware/
├── charlie/skills/        # Frontend UI (4 skills)
│   ├── generate-ui-screens/
│   ├── generate-ui-components/
│   ├── apply-flutter-standards/
│   └── select-flutter-libraries/
└── sarah/skills/          # QA & Validation (6 skills)
    ├── quality-gate-p2/
    ├── quality-gate-p3/
    └── ...
```

---

## Invocation in Mode Files

After creating a skill, reference it in the robot's mode file:

**File:** `ROME/robot-plugins/charlie/modes/P5-generation.md`

```markdown
### Step X: Apply Flutter Standards

Use the `/apply-flutter-standards` skill to enforce coding standards:

```bash
/apply-flutter-standards --target SOURCE/lib/ --fix-violations true
```

This will:
- Check widget composition patterns
- Enforce naming conventions
- Add const constructors
- Format with dartfmt
- Run flutter analyze
```

---

## Testing Your New Skill

1. **Navigate to robot's phase directory:**
   ```bash
   cd ROME/rome-p5-generation
   # SessionStart hook loads Charlie
   ```

2. **Check skill is available:**
   ```bash
   # Skills should be listed in Charlie's mode file
   # Or Charlie will reference it when appropriate
   ```

3. **Invoke the skill:**
   ```bash
   # Charlie uses skill according to mode procedures
   # Example: During Step 15 of P5-generation mode
   ```

---

## Best Practices

1. **One skill, one purpose** - Don't make mega-skills
2. **Clear examples** - Always include concrete code examples
3. **Traceability** - Link to requirements/design decisions
4. **References** - Link to external documentation
5. **Process steps** - Make it actionable, not just descriptive
6. **Update mode files** - Reference new skills in relevant workflow steps

---

## Summary

**To add a skill to any robot:**

1. Create directory: `robot-plugins/{robot}/skills/{skill-name}/`
2. Create `SKILL.md` with complete documentation
3. Update `plugin.json`:
   - Add to `provides.skills` array
   - Add to `exports` section
   - Optionally add to `robot.capabilities`
4. Commit changes
5. Reference in mode files where appropriate

**Result:** Robot now has the skill, it's documented, discoverable, and ready to use.

---

## Related Documentation

- **ROME-PROP-020:** Skills in Robot Plugins (implemented-proposals/)
- **ROME-PROP-019:** Robot Plugins Architecture (implemented-proposals/)
- **USER-GUIDE.md:** Essential Skills section

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29 | Initial guide - complete process for adding skills to robot plugins with Flutter skills example |
