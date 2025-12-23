# AORDL: AI‑Optimized Requirement Design Language — Framework

## 1. Purpose of This Document
This document defines a complete, AI‑native requirements methodology designed for deterministic parsing, automated validation, BDD generation, capability modelling, architecture mapping, and code generation. It provides the foundational framework for AORDL, independent of domain examples.

## 2. AORDL Overview
AORDL (AI‑Optimized Requirement Design Language) is a structured, machine‑parsable grammar that replaces user stories and traditional requirements with atomic, verifiable, AI‑ready specifications. It is designed for AI assistants to parse, validate, extend, and generate downstream artefacts without ambiguity.

### Core Principles
- deterministic structure
- atomic intent
- controlled vocabulary
- round‑trip safety (Requirement → BDD → Capability → Requirement)
- machine‑readable constraints
- strict anti‑patterns
- AI‑reviewable

## 3. AORDL Canonical Structure
Every requirement must contain the following fields **in this exact order**:
```
ID:
Actor:
Intent:
Preconditions:
Conditions:
Postconditions:
Outcomes:
Invariants:
NonFunctional:
Errors:
ScopeBoundary:
OpenQuestions:
CopilotMode:
```

## 4. Field Definitions
- **ID** — unique requirement identifier.
- **Actor** — single initiating role (User, Admin, HiringManager, System).
- **Intent** — atomic action expressed as `<verb> <business-object>`.
- **Preconditions** — system state required before execution.
- **Conditions** — contextual constraints (when/if/unless).
- **Postconditions** — system state guaranteed after execution.
- **Outcomes** — observable effects visible to the actor.
- **Invariants** — truths that must always hold.
- **NonFunctional** — latency, availability, compliance, performance.
- **Errors** — user‑visible failure states.
- **ScopeBoundary** — explicitly excluded behaviour.
- **OpenQuestions** — unresolved decisions.
- **CopilotMode** — instructions for AI assistance (validation, BDD generation, etc.).

## 5. Controlled Vocabulary
A stable vocabulary ensures consistent AI interpretation.

### Approved Verbs
```
create
update
delete
submit
approve
reject
authenticate
view
list
assign
cancel
```

### Approved Business Objects
```
invoice
session
user
profile
payment
document
approval
application
candidate
offer
```

## 6. AORDL Anti‑Patterns (AI‑Detectable)
Copilot must reject requirements containing:
- multiple verbs in Intent
- missing actor
- UI language ("click", "screen", "button")
- technical language ("POST", "SQL", "endpoint")
- ambiguous verbs ("manage", "handle", "process")
- compound intents
- state transitions ("move invoice to submitted")
- vague outcomes ("improve experience")

## 7. AORDL Review Protocol
Copilot evaluates each requirement using this checklist:
1. Is the actor explicit?
2. Is the intent atomic?
3. Are preconditions valid system states?
4. Are outcomes observable?
5. Are invariants domain‑correct?
6. Are anti‑patterns present?
7. Is the field order correct?
8. Can BDD be generated deterministically?

## 8. AORDL Template (Copy‑Ready)
```
ID: REQ-XXX

Actor:
  <role>

Intent:
  <verb> <business-object>

Preconditions:
  - …

Conditions:
  - …

Postconditions:
  - …

Outcomes:
  - …

Invariants:
  - …

NonFunctional:
  - …

Errors:
  - …

ScopeBoundary:
  - …

OpenQuestions:
  - …

CopilotMode:
  - validate structure
  - generate BDD
  - propose invariants
  - map to capability registry
```

## 9. Summary
This file contains the complete AORDL framework, including structure, vocabulary, anti‑patterns, review protocol, and templates. It forms the foundation for all downstream artefacts such as capability registries, BDD suites, and technical specifications.
