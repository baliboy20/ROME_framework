# Robot Instructions

Execute the following tasks:

## 1. Read Methodology
Read all documents in `../ROME` folder:
- rome-overview.md - Core philosophy
- rome-implementation-guide.md - Implementation details
- rome-reference.md - Quick reference and protocols
- Your role specification

## 2. Understand Project Context

Read project documentation:
- `../PROJECT/dev/data_model.md` - Entity definitions and relationships
- `../PROJECT/dev/use_cases.md` - User workflows and scenarios
- `../PROJECT/dev/actionlist.md` - Your assigned features and tasks

## 2A. ⚠️ CRITICAL: Read Technical Standards FIRST (v6.2+)

**BEFORE writing ANY code, you MUST read:**

1. **`../PROJECT/dev/technical-decisions.md`** → "Layer-Specific Technical Standards" → **YOUR LAYER**
2. **All referenced expert documents** (if provided)
3. **Forbidden patterns list** - Do NOT use these technologies/patterns
4. **Test Data Strategy** section - Use canonical test data only

###YOUR LAYER: [Database|Backend|Frontend]

**Find your standards here:**
`../PROJECT/dev/technical-decisions.md` → "Layer-Specific Technical Standards" → "[Your Layer]"

**What to look for:**
- ✅ **Mandated**: Technologies/patterns you MUST use
- ❌ **Forbidden**: Anti-patterns you MUST NOT use
- 📚 **Expert References**: Documentation to follow
- 📝 **Coding Standards**: Naming conventions, file structure

**Test data location:**
`../PROJECT/dev/technical-decisions.md` → "Test Data Strategy"
- Use canonical test IDs (e.g., `test-user-001`, `test-prod-001`)
- DO NOT create ad-hoc test data

### ⚠️ Consequences of Not Following Standards

- **Sarah will BLOCK your work** in Phase 2B review
- **You will need to refactor** before Phase 3 can proceed
- **Integration with other layers will fail**
- **Project timeline will be delayed**

### When in Doubt

1. Check `technical-decisions.md` first
2. Read referenced expert docs
3. Ask PMA for clarification
4. **DO NOT proceed if unsure**

## 3. Determine Session Purpose

Identify the purpose of this session:
- [ ] Create new system (initial development)
- [ ] Continue modification (add features to existing)
- [ ] Complete existing system (finish in-progress work)
- [ ] Conduct review (code review, architecture review)
- [ ] Fix bugs (address specific issues)
- [ ] Other: _______________

## 4. Follow ROME 6-Step Protocol

For each feature/task:

### Step 1: ANALYZE
- Understand use cases and data model
- Review feature requirements in actionlist.md
- Identify integration points with other features
- Assess complexity (Low/Medium/High)

### Step 2: DESIGN
- Sketch feature design
- Define class/module structure
- Plan integration test approach
- Identify potential issues

### Step 3: IMPLEMENT
Build from data layer outward:

**When Creating New Class/Module:**
```
Add initial annotations:
@Created [TODAY] by [YOUR_NAME]
@TestLevel None
@Stable false
@ComplexityLevel [Low|Medium|High]
```

**Write the code following best practices**

**Write Integration Test:**
- Test against real systems (database, API)
- Verify data flow
- Test error cases

**Update Annotations:**
```
@Modified [TODAY] by [YOUR_NAME]
@TestLevel Integration
[Add test file reference]
```

### Step 4: INTEGRATE
- Run integration tests
- Verify tests pass against real systems
- Validate data flows correctly
- Test edge cases and errors

### Step 5: VALIDATE
- Feature works end-to-end
- All integration tests passing
- Error handling comprehensive
- Annotations complete and accurate

### Step 6: REPORT
Update tracking files using CLI tools (v6.1+):
```bash
# Update feature status:
../../rome-tools/cli/rome-cli.js update-status FEAT-001-db COMPLETED --notes "Tests passing"

# Add blocker if needed:
../../rome-tools/cli/rome-cli.js add-blocker FEAT-001-api "Description" --severity HIGH

# Request amendment if needed:
../../rome-tools/cli/rome-cli.js request-amendment FEAT-001 "Amendment description" --target-phase 2
```

## 5. Class Annotation Requirements

**CRITICAL:** Every class/module MUST have these annotations:

```typescript
/**
 * @Created YYYY-MM-DD by [YOUR_NAME]
 * @Modified YYYY-MM-DD by [YOUR_NAME]
 * @TestLevel None|Integration|Unit|Both
 * @Stable false|true
 * @ComplexityLevel Low|Medium|High
 * 
 * [Optional: Description]
 * [Optional: Integration tests: path/to/test/file]
 */
```

### Annotation Lifecycle:
1. **Initial Creation:** @TestLevel None, @Stable false
2. **After Integration Tests:** @TestLevel Integration
3. **Production Ready:** @Stable true (requires PMA approval)
4. **Complex Logic Added:** @TestLevel Both (add unit tests)

### Modification Rules:
- **Before modifying existing class:**
  - Check @Stable status
  - If @Stable true → GET PMA APPROVAL FIRST
  - If @Stable false → Proceed with modification
- **After modification:**
  - Update @Modified date
  - Add CHANGELOG entry for significant changes
  - Ensure tests still pass

## 6. Integration Testing Requirements

**Test Progression:**
- Database layer → Integration test CRUD operations
- Backend models → Integration test with real database
- API endpoints → Integration test with real database
- Client data layer → Integration test with real API
- Domain logic → Integration test end-to-end
- Presentation → Integration test complete workflow

**Test File Locations:**
- `../PROJECT/SOURCE/tests/integration/database/`
- `../PROJECT/SOURCE/tests/integration/models/`
- `../PROJECT/SOURCE/tests/integration/api/`
- `../PROJECT/SOURCE/tests/integration/data/` (frontend)
- `../PROJECT/SOURCE/tests/integration/domain/` (frontend)
- `../PROJECT/SOURCE/tests/integration/presentation/` (frontend)

## 7. Source Code Location

**CRITICAL:** All source code must be created in:
- `../PROJECT/SOURCE/backend/` - Backend code
- `../PROJECT/SOURCE/frontend/` - Frontend code
- `../PROJECT/SOURCE/database/` - Database scripts
- `../PROJECT/SOURCE/tests/integration/` - Integration tests

**NOT in your robot workspace directory!**

## 8. Coordination

- Read actionlist.md to see other robots' tasks
- Check project_activity.status for current progress
- Coordinate with other robots on interfaces
- Escalate blockers to PMA immediately

## 9. Quality Standards

Before marking any feature complete:
- [ ] All classes have complete annotations
- [ ] Integration tests written and passing
- [ ] @TestLevel accurately reflects test coverage
- [ ] @ComplexityLevel assessed (Low/Medium/High)
- [ ] Error handling comprehensive
- [ ] Data validation in place
- [ ] Status files updated

## 10. When to Add Unit Tests

Add unit tests ONLY for:
- Complex state machines (@ComplexityLevel High)
- Algorithms with edge cases (@ComplexityLevel High)
- Complex calculations (@ComplexityLevel High)

For everything else, integration tests are sufficient.

---

## Important Reminders

✅ **Always:**
- Add class annotations immediately
- Write integration tests before moving to next layer
- Test against real systems (DB, API)
- Update status files
- Ask for clarification if requirements unclear

❌ **Never:**
- Skip class annotations
- Write code without integration tests
- Modify @Stable true classes without PMA approval
- Forget to update @Modified date
- Leave @TestLevel as None for completed features

---

## Your Role

You are: [ROBOT_NAME] - [ROLE_TITLE]

Your responsibilities: See `../ROME/role_spec_[your_role].md`

Your assigned features: See `../PROJECT/dev/actionlist.md`

---

**Ready to build high-quality software with ROME 3.0!**
