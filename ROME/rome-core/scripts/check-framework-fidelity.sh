#!/bin/bash
# ROME Framework Fidelity Check Script
# ROME-PROP-026 §G10 — Automates fidelity checks from ROME-GOV-007
#
# Usage:
#   ./check-framework-fidelity.sh           # Full check (all 4 checks)
#   ./check-framework-fidelity.sh --quick   # Quick check (checks 1 and 2 only)
#
# Output:
#   Prints results to stdout.
#   Exits 0 if all checks pass.
#   Exits 1 if any check fails.

# Note: NOT using set -euo pipefail — many subcommands (grep, find+exec) legitimately
# return non-zero when nothing matches. Errors handled explicitly per check.

QUICK=false
if [[ "${1:-}" == "--quick" ]]; then
  QUICK=true
fi

# Resolve ROME root (two levels up from this script)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROME_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ROME_CORE="$ROME_ROOT/ROME/rome-core"
UID_REGISTRY="$ROME_CORE/docs/framework-maintenance/uid-registry.md"
LEXICON="$ROME_CORE/docs/foundation/lexicon.md"
DOCS_DIR="$ROME_CORE/docs"
PROPOSALS_DIR="$ROME_ROOT/ROME_framework_maintenance/proposals"
IMPL_PROPOSALS_DIR="$ROME_ROOT/ROME_framework_maintenance/implemented-proposals"
ACTIVITY_LOG_FORMAT="$ROME_CORE/docs/operational/activity-log-format.md"
VERSION_FILE="$ROME_CORE/VERSION"
ONTOLOGY="$ROME_CORE/docs/foundation/ontology.md"

FAIL_COUNT=0
WARN_COUNT=0

red()    { printf "\033[0;31m%s\033[0m\n" "$*"; }
green()  { printf "\033[0;32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[0;33m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

fail() { red "  FAIL: $*"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
warn() { yellow "  WARN: $*"; WARN_COUNT=$((WARN_COUNT + 1)); }
pass() { green "  PASS: $*"; }

echo ""
bold "═══════════════════════════════════════════════════════"
bold " ROME Framework Fidelity Check"
bold " Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
if $QUICK; then
  bold " Mode: --quick (checks 1 and 2 only)"
else
  bold " Mode: full (all 4 checks)"
fi
bold "═══════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────
# CHECK 1: UID Registry Accuracy
# Find all docs with "Document UID" header; verify each is in uid-registry.md
# ─────────────────────────────────────────────────────────
bold "Check 1: UID Registry Accuracy"

if [ ! -f "$UID_REGISTRY" ]; then
  fail "uid-registry.md not found at expected path"
else
  MISSING_FROM_REGISTRY=0
  WRONG_PATH=0

  while IFS= read -r -d '' FILE; do
    # Use extended regex to capture full multi-segment UIDs (e.g. ROME-SPEC-SKILL-FRAMEWORK)
    DOC_UID=$(grep -m1 "Document UID.*ROME-" "$FILE" 2>/dev/null | grep -oE "ROME-[A-Z]+-[A-Z0-9][A-Z0-9-]*" | head -1)
    if [ -z "$DOC_UID" ]; then
      continue
    fi
    # Check UID is in registry
    if ! grep -q "$DOC_UID" "$UID_REGISTRY" 2>/dev/null; then
      fail "$DOC_UID found in $FILE but NOT in uid-registry.md"
      MISSING_FROM_REGISTRY=$((MISSING_FROM_REGISTRY + 1))
    fi
  done < <(find "$DOCS_DIR" -name "*.md" -print0 2>/dev/null)

  # Check registry entries point to existing files
  while IFS= read -r LINE; do
    REG_PATH=$(echo "$LINE" | grep -oE '`/[^`]+`' | tr -d '`' | head -1 || true)
    if [ -z "$REG_PATH" ]; then continue; fi
    FULL_PATH="$ROME_ROOT$REG_PATH"
    if [[ "$REG_PATH" == *"/"* ]] && [ ! -f "$FULL_PATH" ]; then
      # Only warn for non-deprecated entries
      if ! echo "$LINE" | grep -qi "deprecated\|superseded\|reserved"; then
        warn "Registry path does not exist: $REG_PATH"
        WRONG_PATH=$((WRONG_PATH + 1))
      fi
    fi
  done < <(grep "| ROME-" "$UID_REGISTRY" 2>/dev/null || true)

  if [ "$MISSING_FROM_REGISTRY" -eq 0 ] && [ "$WRONG_PATH" -eq 0 ]; then
    pass "All document UIDs registered; checked file paths"
  fi
fi
echo ""

# ─────────────────────────────────────────────────────────
# CHECK 2: Cross-Reference Validity
# Extract all ROME-*-### patterns from docs; verify each is in uid-registry.md
# ─────────────────────────────────────────────────────────
bold "Check 2: Cross-Reference Validity"

if [ ! -f "$UID_REGISTRY" ]; then
  fail "uid-registry.md not found — skipping"
else
  BROKEN_REFS=0
  # Extract all UID references from all docs (excluding registry itself)
  REFS=$(find "$DOCS_DIR" -name "*.md" ! -path "*uid-registry*" -exec grep -ohE "ROME-[A-Z]+-[A-Z0-9][A-Z0-9-]*" {} \; 2>/dev/null | sort -u || true)

  while IFS= read -r REF; do
    if [ -z "$REF" ]; then continue; fi
    # Skip general patterns like ROME-GOV-### (placeholders)
    if [[ "$REF" == *"###"* ]]; then continue; fi
    # Skip sub-document IDs scoped to ROME-ONT-001 (ROME-ENT/REL/AX-##). These
    # deliberately take no UID of their own — standards are meant to cite
    # ROME-AX-### freely (PROP-043 §4), so they must not warn here.
    if [[ "$REF" =~ ^ROME-(ENT|REL|AX)-[0-9]+$ ]]; then continue; fi
    if ! grep -q "$REF" "$UID_REGISTRY" 2>/dev/null; then
      warn "Referenced UID $REF not found in uid-registry.md"
      BROKEN_REFS=$((BROKEN_REFS + 1))
    fi
  done <<< "$REFS"

  if [ "$BROKEN_REFS" -eq 0 ]; then
    pass "All cross-references resolve in uid-registry.md"
  else
    warn "$BROKEN_REFS unregistered UID references found"
  fi
fi
echo ""

if $QUICK; then
  echo ""
  bold "Quick mode: skipping checks 3 and 4. Running check 5."
  echo ""
else

# ─────────────────────────────────────────────────────────
# CHECK 3: Terminology Drift
# Search for deprecated terms from lexicon
# ─────────────────────────────────────────────────────────
bold "Check 3: Terminology Drift"

# Match the deprecated Layer CONCEPT precisely, not the English word "layer".
# Fingerprint = the value syntax `layer:database|backend|frontend`. Bare "Layer"
# is intentionally NOT matched: it is ordinary architectural English ("system
# layers") and appears in every legitimate deprecation note ("formerly Layer").
DEPRECATED_PATTERNS=("layer:database" "layer:backend" "layer:frontend")
DRIFT_FOUND=0

for PAT in "${DEPRECATED_PATTERNS[@]}"; do
  # Search in docs (excluding lexicon, which owns the deprecation record)
  FILES=$(find "$DOCS_DIR" -name "*.md" ! -path "*lexicon*" -exec grep -l "$PAT" {} \; 2>/dev/null | tr '\n' ' ')
  if [ -n "$FILES" ]; then
    warn "Deprecated term '$PAT' still used in: $FILES"
    ((DRIFT_FOUND++)) || true
  fi
done

if [ "$DRIFT_FOUND" -eq 0 ]; then
  pass "No deprecated terminology drift detected in docs"
fi
echo ""

# ─────────────────────────────────────────────────────────
# CHECK 4: PROP-026 Consistency
# Verify PROP-015 is in proposals/, PROP-026 in registry,
# CHANGE_REQUEST type in activity-log-format.md
# ─────────────────────────────────────────────────────────
bold "Check 4: ROME-PROP-026 Consistency"

# 4a: PROP-015 should be in proposals/, NOT implemented-proposals/
PROP015_PROPOSALS="$PROPOSALS_DIR/ROME-PROP-015-change-management.md"
PROP015_IMPL="$IMPL_PROPOSALS_DIR/ROME-PROP-015-change-management.md"

if [ -f "$PROP015_IMPL" ]; then
  fail "ROME-PROP-015 found in implemented-proposals/ — should be in proposals/ (it is not implemented)"
elif [ ! -f "$PROP015_PROPOSALS" ]; then
  warn "ROME-PROP-015 not found in proposals/ — may be missing"
else
  pass "ROME-PROP-015 correctly located in proposals/"
fi

# 4b: ROME-PROP-026 in uid-registry.md
if grep -q "ROME-PROP-026" "$UID_REGISTRY" 2>/dev/null; then
  pass "ROME-PROP-026 registered in uid-registry.md"
else
  fail "ROME-PROP-026 NOT registered in uid-registry.md"
fi

# 4c: CHANGE_REQUEST type in activity-log-format.md
if grep -q "CHANGE_REQUEST" "$ACTIVITY_LOG_FORMAT" 2>/dev/null; then
  pass "CHANGE_REQUEST type defined in activity-log-format.md"
else
  fail "CHANGE_REQUEST type missing from activity-log-format.md"
fi
echo ""

fi  # end of non-quick checks

# ─────────────────────────────────────────────────────────
# CHECK 5: Framework Version File (ROME-PROP-027)
# Runs in both quick and full mode — fast structural check
# ─────────────────────────────────────────────────────────
bold "Check 5: Framework Version File"

if [ ! -f "$VERSION_FILE" ]; then
  fail "rome-core/VERSION not found — framework version undeclared (see ROME-PROP-027)"
else
  # Check required fields present
  for FIELD in ROME_FRAMEWORK_VERSION ROME_FRAMEWORK_DATE ROME_FRAMEWORK_STATUS; do
    if ! grep -q "^${FIELD}=" "$VERSION_FILE" 2>/dev/null; then
      fail "VERSION file missing required field: $FIELD"
    fi
  done

  # Validate SemVer format
  VER=$(grep "^ROME_FRAMEWORK_VERSION=" "$VERSION_FILE" | cut -d= -f2 | tr -d '[:space:]')
  if [[ ! "$VER" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    fail "ROME_FRAMEWORK_VERSION '$VER' is not valid SemVer (expected MAJOR.MINOR.PATCH)"
  else
    pass "Framework version: $VER"
  fi

  # Validate STATUS value
  STATUS=$(grep "^ROME_FRAMEWORK_STATUS=" "$VERSION_FILE" | cut -d= -f2 | tr -d '[:space:]')
  case "$STATUS" in
    stable|rc|dev) pass "Framework status: $STATUS" ;;
    *) fail "ROME_FRAMEWORK_STATUS '$STATUS' must be one of: stable, rc, dev" ;;
  esac
fi
echo ""

# ─────────────────────────────────────────────────────────
# CHECK 6: Axiom Enforcement Provenance (ROME-PROP-043 / ROME-AX-11)
# 6a: every module.js#function cited by an axiom must still exist (catches
#     renames and deletions).
# 6b: every ENFORCED axiom (AX-01..08) must retain a violation test tagged with
#     its ID in tests/axioms.test.cjs (PROP-044 Part A — behavioural provenance:
#     an axiom cannot silently lose its enforcement without a test failing).
# Neither proves the code is correct — but together they close the "exists but
# no longer enforces" gap. Runs in both quick and full mode.
# ─────────────────────────────────────────────────────────
bold "Check 6: Axiom Enforcement Provenance"

if [ ! -f "$ONTOLOGY" ]; then
  fail "ontology.md not found at expected path (ROME-ONT-001)"
else
  BAD_PROV=0
  CITATIONS=$(grep -oE '`[a-z0-9-]+\.js#[A-Za-z_][A-Za-z0-9_]*`' "$ONTOLOGY" 2>/dev/null | tr -d '`' | sort -u || true)

  if [ -z "$CITATIONS" ]; then
    warn "No module#function citations found in ontology.md — provenance unverifiable"
  else
    while IFS= read -r CITE; do
      [ -z "$CITE" ] && continue
      MODULE="${CITE%%#*}"
      FN="${CITE##*#}"

      MODULE_PATH=$(find "$ROME_CORE" -name "$MODULE" -not -path "*/node_modules/*" -print -quit 2>/dev/null)
      if [ -z "$MODULE_PATH" ]; then
        fail "Axiom cites $CITE but module '$MODULE' does not exist"
        BAD_PROV=$((BAD_PROV + 1))
        continue
      fi

      # Accept: function decl, arrow/expression assignment, or object-literal method
      if ! grep -qE "(function[[:space:]]+${FN}[[:space:]]*\()|(${FN}[[:space:]]*[:=][[:space:]]*(async[[:space:]]+)?(function|\())" "$MODULE_PATH" 2>/dev/null; then
        fail "Axiom cites $CITE but function '$FN' not found in $MODULE"
        BAD_PROV=$((BAD_PROV + 1))
      fi
    done <<< "$CITATIONS"

    if [ "$BAD_PROV" -eq 0 ]; then
      CITE_COUNT=$(echo "$CITATIONS" | grep -c . || true)
      pass "6a: all $CITE_COUNT axiom provenance citations resolve"
    fi
  fi

  # 6b: every ENFORCED axiom must retain a tagged violation test somewhere under
  # orchestrator/tests/ (gate-time AX-01..08 in axioms.test.cjs; routing-time
  # AX-17..18 in routing-budget.test.cjs; increment/staging AX-19..24 in
  # increments.test.cjs — AX-20 is CHECKED, its tagged test exists but is not
  # demanded here).
  TESTS_DIR="$ROME_CORE/orchestrator/tests"
  ENFORCED_AXIOMS="AX-01 AX-02 AX-03 AX-04 AX-05 AX-06 AX-07 AX-08 AX-17 AX-18 AX-19 AX-21 AX-22 AX-23 AX-24 AX-26 AX-27 AX-29 AX-30 AX-31 AX-32 AX-34 AX-35 AX-36 AX-37"
  if [ ! -d "$TESTS_DIR" ]; then
    fail "6b: orchestrator/tests not found — ENFORCED axioms have no behavioural provenance"
  else
    MISSING_TEST=0
    for AX in $ENFORCED_AXIOMS; do
      if ! grep -rq "$AX" "$TESTS_DIR" 2>/dev/null; then
        fail "6b: ENFORCED axiom $AX has no tagged violation test under orchestrator/tests/"
        MISSING_TEST=$((MISSING_TEST + 1))
      fi
    done
    if [ "$MISSING_TEST" -eq 0 ]; then
      NAX=$(echo "$ENFORCED_AXIOMS" | wc -w | tr -d ' ')
      pass "6b: all $NAX ENFORCED axioms retain a tagged violation test"
    fi
  fi
fi
echo ""

# ─────────────────────────────────────────────────────────
# Check 7: PROP-054/055 configuration provenance
# 7a: every agent ROBOT.md declares the consolidated MCP set (Seez inheritance
#     — PROP-054 Part C; AX-33 fidelity hook).
# 7b: migration boundary coverage (AX-35): steps under rome-core/migrations/
#     form a contiguous chain from their lowest `from` to the current framework
#     version — no unreachable version.
# ─────────────────────────────────────────────────────────
bold "Check 7: Sub-Agent MCP Set & Migration Coverage"

AGENTS_DIR="$ROME_CORE/../agents"
MISSING_MCP=0
for ROBOT in "$AGENTS_DIR"/*/ROBOT.md; do
  [ -f "$ROBOT" ] || continue
  if ! grep -q "Seez" "$ROBOT"; then
    fail "7a: $(basename "$(dirname "$ROBOT")")/ROBOT.md does not declare the consolidated MCP set (Seez missing — PROP-054 Part C)"
    MISSING_MCP=$((MISSING_MCP + 1))
  fi
done
if [ "$MISSING_MCP" -eq 0 ]; then
  pass "7a: every ROBOT.md declares the consolidated MCP set (Seez inheritance)"
fi

MIG_DIR="$ROME_CORE/migrations"
FW_VERSION=$(grep -E '^ROME_FRAMEWORK_VERSION=' "$ROME_CORE/VERSION" | cut -d= -f2)
if [ ! -d "$MIG_DIR" ]; then
  fail "7b: rome-core/migrations/ missing (AX-35)"
else
  CUR=$(ls "$MIG_DIR" | sort -t. -k1,1n -k2,2n -k3,3n | head -1 | cut -d- -f1)
  HOLE=0
  while [ "$CUR" != "$FW_VERSION" ]; do
    NEXT_DIR=$(ls "$MIG_DIR" | grep "^${CUR}-" | head -1)
    if [ -z "$NEXT_DIR" ]; then
      fail "7b: no migration step for boundary ${CUR} → … up to v${FW_VERSION} (AX-35: unreachable version)"
      HOLE=1; break
    fi
    CUR="${NEXT_DIR#${CUR}-}"
  done
  if [ "$HOLE" -eq 0 ]; then
    pass "7b: migration steps form a contiguous ladder to v${FW_VERSION} (AX-35)"
  fi
fi
echo ""

# ─────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────
bold "═══════════════════════════════════════════════════════"
if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -eq 0 ]; then
  green " RESULT: ALL CHECKS PASSED"
elif [ "$FAIL_COUNT" -eq 0 ]; then
  yellow " RESULT: PASSED WITH $WARN_COUNT WARNING(S)"
else
  red " RESULT: $FAIL_COUNT FAILURE(S), $WARN_COUNT WARNING(S)"
fi
bold "═══════════════════════════════════════════════════════"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
