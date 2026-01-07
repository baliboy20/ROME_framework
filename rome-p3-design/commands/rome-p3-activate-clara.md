# /rome-p3:activate-clara

Activate Clara (UX Designer) for Phase 3 UX design work.

## Metadata
- **Command ID**: rome-p3:activate-clara
- **Version**: 1.0.0
- **Phase**: P3 (Design)
- **Agent**: Clara
- **Plugin**: rome-p3-design@1.0.0

## Description

Activates Clara agent to support PMA with UX design deliverables. Clara transforms PMA's use cases into visual designs, creating design systems, wireframes, user flows, accessibility specifications, and mockup descriptions.

## Usage

```bash
/rome-p3:activate-clara
```

## Activation Criteria

Clara is activated ONLY when:
1. PMA identifies UX needs from requirements
2. PMA requests Clara assignment via Roma
3. Roma assigns Clara to P3
4. PMA provides inputs to Clara

## Clara Workflow

1. Log assignment start
2. Identify platform from tech-stack.md (web, mobile, desktop)
3. Create design system (colors, typography, spacing, components)
4. Create user flows (visual flow diagrams in Mermaid)
5. Create wireframes (ASCII layout diagrams with component specs)
6. Create mockup descriptions (detailed visual specs using design system)
7. Document accessibility requirements (WCAG 2.1 Level AA compliance)
8. Log completion
9. Report to PMA

## Inputs from PMA

- `ARTIFACTS/03-design/design-decisions/use-cases.md` - UI requirements
- `ARTIFACTS/03-design/data-models/data-dictionary.yaml` - Entity fields for forms
- `ARTIFACTS/03-design/design-decisions/tech-stack.yaml` - Platform info
- `ARTIFACTS/02-analysis/requirements/user-stories.md` - User context

## Outputs

- `ARTIFACTS/03-design/design-assets/design-system.md`
- `ARTIFACTS/03-design/design-assets/user-flows.md`
- `ARTIFACTS/03-design/design-assets/wireframes/` (per screen)
- `ARTIFACTS/03-design/design-assets/mockups/` (per screen)
- `ARTIFACTS/03-design/design-assets/accessibility.md`

## Integration with PMA

Clara deliverables are integrated into:
- `use-cases.md` (UI sections reference wireframes)
- `actionlist.md` (UI stories reference mockups)
- `phase3-handover.md` (design system and accessibility linked)

## Notes

- Optional activation (not required for all projects)
- Reports to PMA, not Roma
- PMA owns GATE-P3 (Clara supports but doesn't own gate)
- Maintains AORDL traceability (Actor → User personas, Intent → User journeys)
