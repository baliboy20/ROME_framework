# rome-qa

ROME Quality Assurance Plugin - Quality gates and validation across all phases

## Overview

This plugin provides quality gate validation and traceability verification across the entire ROME Framework lifecycle through the Sarah agent.

## Version

1.0.0

## Dependencies

- **rome-core**: ^1.0.0 (required)

## Agent

### Sarah (Quality Gatekeeper)

System Auditor & Quality Gatekeeper responsible for:

- Quality gate validation at all phase transitions
- Requirements coverage verification (100% traceability)
- Technical decision assessment
- Traceability validation (REQ→FUNC→UC→Code)
- Blocker creation and management
- Change request approval/rejection
- Gate decision documentation

**Authority**: Phase transitions BLOCKED without Sarah APPROVAL.

## Quality Gates

### GATE-P1 (AORDL Validation)
- Validate AORDL structure (all 13 fields)
- Detect anti-patterns (UI language, generic actors, ambiguous verbs)
- Verify atomic intents
- Confirm ambiguities resolved

### GATE-P2 (Analysis → Design)
- Validate 8-dimension coverage (Functional, Data, UI, Integration, Security, Performance, Quality, Deployment)
- Verify requirements decomposition
- Check acceptance criteria quality (SMART)
- Validate handover document completeness
- Verify AORDL→Feature traceability (REQ-###→FUNC-###)

### GATE-P3 (Design → Config)
- Validate 100% requirements coverage
- Verify data dictionary completeness
- Assess tech stack decisions
- Validate API design completeness
- Check system architecture meets NFRs
- Verify Feature→Use Case traceability (FUNC-###→UC-###)

### GATE-P4 (Config → Generation)
- Validate configuration completeness
- Verify environment specifications
- Check scaffolding instructions
- Validate security configuration

### GATE-P5 (Generation → Delivery)
- Validate all workspaces implemented
- Verify all tests passing
- Check complete AORDL→Code traceability
- Validate documentation completeness
- Verify Use Case→Code traceability (UC-###→Code via TRACEABILITY.md)

## Skills

### Quality & Validation
- validate-aordl-structure
- validate-requirements-coverage
- validate-data-dictionary
- verify-traceability

### Quality Gates
- quality-gate-p2
- quality-gate-p3

## Core Principle

**Be thorough, not pedantic.**

Sarah blocks on:
- Missing requirements
- Security/compliance gaps
- Architectural contradictions
- Unproven scalability for stated requirements

Sarah does NOT block on:
- Typos
- Style preferences
- Optimization opportunities
- Minor documentation gaps

## Change Management (ROME-PROP-015)

Sarah reviews and approves change requests:

1. **Review CR**: Impact analysis, effort, risk assessment
2. **Approve/Reject**: Update CR-###.yaml
3. **Verify Implementation**: Check traceability intact after implementation
4. **Approve Deployment**: Only after verification passes

## Verification Checklist

After CR implementation, Sarah verifies:
- [ ] All affected requirements have changeHistory
- [ ] All affected design docs have Change History
- [ ] All affected features have updated TRACEABILITY.md
- [ ] REQ → FUNC → UC → Code chain intact
- [ ] All tests pass
- [ ] Activity log updated
- [ ] Git commits reference CR-###

## Installation

This plugin is part of the ROME Framework v3 architecture and requires rome-core to be installed.

## Usage

Sarah is activated by the Roma orchestrator at quality gate checkpoints throughout the ROME lifecycle.

## License

MIT
