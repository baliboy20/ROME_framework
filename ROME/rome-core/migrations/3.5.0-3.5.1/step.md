# MIG-3.5.0→3.5.1 — current-model alignment (PROP-059)

Document UID: ROME-MIG-3.5.0-3.5.1
Status: Active
Source: ROME-PROP-059 (v3.5.1)

## applies
conventionLevel `3.5.0` → `3.5.1`

## transforms
None. v3.5.1 changes no state schema and no artifact format. `dispatch[]`
entries written from 3.5.1 carry an optional `model` field; entries without
it load unchanged.

## gaps
None.

## semantics
- Sub-agent prompts now end with the shared operating rules and are dispatched
  with the tier from `model-tiers.json`. Artifacts produced before 3.5.1 were
  produced under the earlier prompts; nothing is re-gated (AX-19).
- Sarah's gate checks read producer completion from `state.json` dispatch
  records instead of producer-written activity-log entries. A project whose
  state predates the single-session model (PROP-035) has no such records for
  its old phases; those gates are historical and stay as recorded.
