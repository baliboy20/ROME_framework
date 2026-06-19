# Roma Procedure: Phase Transitions

---

## P0→P1: Bootstrap Complete

**Robots:** Bootstrap → Talib

**Roma Responsibilities:**
- Verify project structure created
- Monitor Bootstrap setup activities
- Confirm ARTIFACTS structure ready
- Verify activity log initialized

**Transition Check:**
```javascript
Check:
- PHASE-0 = COMPLETED
- .rome-project.json exists
- ARTIFACTS/ directories exist
- Raw requirements present

If all met:
  Notify Talib to begin P1
```

---

## P1→P2: AORDL Requirements Complete

**Robot:** Talib (continues)

**Roma Responsibilities:**
- Monitor Talib's AORDL requirement creation
- Track AORDL validation status
- Ensure all anti-patterns eliminated
- Verify 13 AORDL fields populated

**Transition Check:**
```javascript
Check:
- PHASE-1 = COMPLETED
- REQ-*.yaml files exist
- requirements-catalog.md exists
- aordl-validation-report.md shows 100% STRICT pass
- All OpenQuestions status = RESOLVED
- phase1-handover.md exists

If all met:
  Request Sarah GATE-P1 review

  mcp__Seez__show_doc({
    label: "GATE-P1 Request",
    content: "P1 AORDL complete. Sarah: validate requirements before P2."
  })

Wait for Sarah decision:
- If GATE-P1 = APPROVE: Talib continues to P2
- If GATE-P1 = BLOCK: Notify Talib of blockers
```

---

## P2→P3: Analysis Complete

**Robots:** Talib → PMA

**Roma Responsibilities:**
- Monitor requirements decomposition
- Track sponsor clarifications
- Ensure 8-dimensions coverage
- Verify AORDL→Features mapping

**Transition Check:**
```javascript
Check:
- PHASE-2 = COMPLETED
- requirements-matrix.yaml exists
- All AORDL requirements mapped (REQ-###→FUNC-###)
- user-stories.md exists
- acceptance-criteria.md exists
- phase2-handover.md exists

If all met:
  Request Sarah GATE-P2 review

  mcp__Seez__show_doc({
    label: "GATE-P2 Request",
    content: "P2 Analysis complete. Sarah: validate requirements before P3."
  })

Wait for Sarah decision:
- If GATE-P2 = APPROVE: Notify PMA to begin P3
- If GATE-P2 = BLOCK: Notify Talib of blockers
```

---

## P3→P4: Design Complete

**Robots:** PMA → Lucien

**Roma Responsibilities:**
- Monitor architecture design
- Track Clara design system (if activated)
- Verify 8-dimensions addressed
- Ensure actionlist.md created (CRITICAL for P4)

**Transition Check:**
```javascript
Check:
- PHASE-3 = COMPLETED
- architecture-overview.md or system-architecture.md exists
- data-dictionary.yaml exists
- api-design.md exists
- tech-stack.yaml exists
- actionlist.md exists (CRITICAL — defines workspaces for P4/P5)
- 100% requirements coverage (all P2→P3)
- Features→Use cases mapping complete (FUNC-###→UC-###)

If all met:
  Request Sarah GATE-P3 review

  mcp__Seez__show_doc({
    label: "GATE-P3 Request",
    content: "P3 Design complete. Sarah: validate architecture before P4."
  })

Wait for Sarah decision:
- If GATE-P3 = APPROVE: Notify Lucien to begin P4
- If GATE-P3 = BLOCK: Notify PMA of blockers
```

---

## P4→P5: Configuration Complete

**Robots:** Lucien → capability robots per tech-stack.yaml

**Roma Responsibilities:**
- Monitor workspace scaffolding
- Verify CI/CD pipeline setup
- Track environment configuration
- Ensure phase4-handover.md created

**Transition Check:**
```javascript
Check:
- PHASE-4 = COMPLETED
- All workspaces from actionlist.md exist
- technical-specs.md exists
- phase4-handover.md exists
- CI/CD configured
- Environment config complete

If all met:
  Request Sarah GATE-P4 review

  mcp__Seez__show_doc({
    label: "GATE-P4 Request",
    content: "P4 Config complete. Sarah: validate config before P5."
  })

Wait for Sarah decision:
- If GATE-P4 = APPROVE: Assign P5 capability work (see procedures/p5-capability-coordination.md)
- If GATE-P4 = BLOCK: Notify Lucien of blockers
```

---

## P5→Delivery: Generation Complete

**P5 Composite Completion Protocol:**

After all P5 robots signal completion, Roma executes the composite close:

1. Query activity log — verify all capability robots COMPLETED:
   ```javascript
   mcp__activity-log-file__query({phase: "P5-generation"})
   ```
2. Log composite PHASE-5 COMPLETED:
   ```javascript
   mcp__activity-log-file__append({
     type: "PHASE", id: "PHASE-5",
     attributes: {
       status: "COMPLETED",
       robot: "roma",
       robotsCompleted: "[capability robots from tech-stack.yaml]",
       completed: new Date().toISOString()
     }
   })
   ```
3. Publish Seez notification requesting GATE-P5 from Sarah
4. **Do NOT initiate CR-### or close the project until GATE-P5 = APPROVED is in the activity log**

**Transition Check:**
```javascript
Check:
- PHASE-5 = COMPLETED
- All FEAT-### = COMPLETED
- All capability stories = COMPLETED
- No blockers OPEN
- Application runs end-to-end
- Complete AORDL→Code traceability

If all met:
  Request Sarah GATE-P5 review

  mcp__Seez__show_doc({
    label: "GATE-P5 Request",
    content: "P5 Generation complete. Sarah: final validation before delivery."
  })

Wait for Sarah decision:
- If GATE-P5 = APPROVE: Application ready for delivery
- If GATE-P5 = BLOCK: Address final issues
```
