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

- `ARTIFACTS/_requirements/phase2-handover.md` - Entry point
- `ARTIFACTS/_requirements/requirements-matrix.yaml` - Requirements source
- `ARTIFACTS/_requirements/user-stories.md` - User context
- `ARTIFACTS/_requirements/acceptance-criteria.md` - Validation criteria
- `ARTIFACTS/_requirements/non-functional-requirements.md` - NFR specifications

## Outputs

- `ARTIFACTS/_design/design-decisions/tech-stack.yaml`
- `ARTIFACTS/_design/data-models/data-dictionary.yaml`
- `ARTIFACTS/_design/api-contracts/api-design.md`
- `ARTIFACTS/_design/design-decisions/use-cases.md`
- `ARTIFACTS/_design/architecture/system-architecture.md`
- `ARTIFACTS/_design/design-decisions/actionlist.md`
- `ARTIFACTS/_design/design-decisions/test-architecture.md`
- `ARTIFACTS/_design/design-decisions/phase3-handover.md`

## Related Commands

- `/rome-p3:activate-clara` - Activate Clara for UX design work

## Related Skills

- `/generate-architecture-diagram` - Generate architecture diagrams (layered, deployment, dataflow)

## Notes

- Requires GATE-P2 approval
- Iterative workflow with sponsor engagement
- Maintains AORDL traceability
- Prepares for P4 (Config) and P5 (Generation)
