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

DEPRECATED_TERMS=("Layer (Deprecated)" "layer:database" "layer:backend" "layer:frontend")
DRIFT_FOUND=0

for TERM in "${DEPRECATED_TERMS[@]}"; do
  SEARCH_TERM=$(echo "$TERM" | sed 's/ (Deprecated)//')
  # Search in docs (excluding lexicon itself)
  MATCHES=$(find "$DOCS_DIR" -name "*.md" ! -path "*lexicon*" -exec grep -l "$SEARCH_TERM" {} \; 2>/dev/null | wc -l | tr -d ' ')
  if [ "$MATCHES" -gt 0 ]; then
    FILES=$(find "$DOCS_DIR" -name "*.md" ! -path "*lexicon*" -exec grep -l "$SEARCH_TERM" {} \; 2>/dev/null | tr '\n' ' ')
    warn "Deprecated term '$SEARCH_TERM' still used in: $FILES"
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
