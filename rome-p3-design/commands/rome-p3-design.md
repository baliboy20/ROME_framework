# /rome-p3:design

Execute Phase 3 Design workflow with PMA agent.

## Metadata
- **Command ID**: rome-p3:design
- **Version**: 1.0.0
- **Phase**: P3 (Design)
- **Agent**: PMA
- **Plugin**: rome-p3-design@1.0.0

## Description

Initiates the complete Phase 3 Design workflow. PMA reads P2 outputs, conducts sponsor design kickoff, selects technology stack, creates data dictionary, designs APIs, elaborates use cases, creates system architecture, and prepares work breakdown for P5.

## Usage

```bash
/rome-p3:design
```

## Workflow Stages

### Stage 1: Foundation
1. Verify entry criteria (GATE-P2 approved, phase2-handover.md exists)
2. Log phase start
3. Read P2 outputs
4. Sponsor design kickoff
5. Technology stack selection

### Stage 2: Core Design (Iterative)
6. Data dictionary creation
7. Data model documentation
8. API design
9. Use case elaboration
10. System architecture
11. Test architecture design
12. Consistency check

### Stage 3: Finalization
13. Work breakdown (actionlist)
14. Test data specification
15. Validate requirements coverage
16. Sponsor design review
17. Prepare handover
18. Create feature entries in activity log
19. Log phase completion
20. Request GATE-P3 review

## Inputs

- `ARTIFACTS/02-analysis/requirements/phase2-handover.md` - Entry point
- `ARTIFACTS/02-analysis/requirements/requirements-matrix.yaml` - Requirements source
- `ARTIFACTS/02-analysis/requirements/user-stories.md` - User context
- `ARTIFACTS/02-analysis/requirements/acceptance-criteria.md` - Validation criteria
- `ARTIFACTS/02-analysis/requirements/non-functional-requirements.md` - NFR specifications

## Outputs

- `ARTIFACTS/03-design/design-decisions/tech-stack.yaml`
- `ARTIFACTS/03-design/data-models/data-dictionary.yaml`
- `ARTIFACTS/03-design/api-contracts/api-design.md`
- `ARTIFACTS/03-design/design-decisions/use-cases.md`
- `ARTIFACTS/03-design/architecture/system-architecture.md`
- `ARTIFACTS/03-design/design-decisions/actionlist.md`
- `ARTIFACTS/03-design/design-decisions/test-architecture.md`
- `ARTIFACTS/03-design/design-decisions/phase3-handover.md`

## Related Commands

- `/rome-p3:activate-clara` - Activate Clara for UX design work
- `/rome-p3:architecture` - Generate architecture diagrams

## Notes

- Requires GATE-P2 approval
- Iterative workflow with sponsor engagement
- Maintains AORDL traceability
- Prepares for P4 (Config) and P5 (Generation)
