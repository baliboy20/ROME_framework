#!/usr/bin/env bash
# bootstrap.sh — automate GETTING-STARTED.md steps 0.2, 0.3, 1, and 2.
#
# Step 0.2: install the AORDL validator dependency (ROME/rome-core/lib).
# Step 0.3: run the sanity check test suite (skippable with --skip-check).
# Step 1:   scaffold the project (rome-start.cjs).
# Step 2:   stage the given PRD/BRD files into _user_input/raw-requirements/.
#
# Also prunes dev-only folders NOT needed by an end user building an app
# (ROME_architect/, ROME_framework_maintenance/, testapps/,
# test-project-to-validate-framework-v1/) — but ONLY when this checkout looks
# like a pristine, untouched clone (clean working tree, HEAD == upstream, no
# local commits ahead). On a maintainer's working copy — where those folders
# hold in-progress proposals, the architect role docs, or uncommitted work —
# pruning is skipped automatically. Use --skip-prune to opt out explicitly,
# or --force-prune to prune regardless of the fresh-clone check (dangerous).
#
# Step 0.4 (open a Claude Code session on Opus 4.8 here) and Step 3 (tell that
# session to run Roma) are not automatable — they're actions in the chat, not
# the shell. This script prints the exact Step 3 line to paste when it's done.
#
# Usage:
#   bootstrap.sh [--skip-check] [--skip-prune|--force-prune] <projectDir> [rome-start.cjs flags...] -- <prd-file>...
#
# Example:
#   ./bootstrap.sh my-app --intent greenfield --prototype -- docs/my-prd.md
#
# Must be run from the ROME_framework/ root.

set -euo pipefail

if [[ ! -f "ROME/rome-core/orchestrator/rome-start.cjs" ]]; then
  echo "error: run this from the ROME_framework/ root (ROME/rome-core/orchestrator/rome-start.cjs not found here)" >&2
  exit 2
fi

skip_check=0
skip_prune=0
force_prune=0
while [[ "${1:-}" == --* && "${1:-}" != "--" ]]; do
  case "$1" in
    --skip-check) skip_check=1; shift ;;
    --skip-prune) skip_prune=1; shift ;;
    --force-prune) force_prune=1; shift ;;
    --help|-h) break ;;
    *) break ;;
  esac
done

if [[ $# -lt 1 || "$1" == "--help" || "$1" == "-h" ]]; then
  echo "usage: $0 [--skip-check] [--skip-prune|--force-prune] <projectDir> [rome-start.cjs flags...] -- <prd-file>..." >&2
  echo "  (run from the ROME_framework/ root)" >&2
  exit 2
fi

DEV_ONLY_DIRS=(ROME_architect ROME_framework_maintenance testapps test-project-to-validate-framework-v1)

is_fresh_clone() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1
  [[ -z "$(git status --porcelain 2>/dev/null)" ]] || return 1
  local upstream
  upstream="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)" || return 1
  local ahead
  ahead="$(git rev-list --count "@{u}..HEAD" 2>/dev/null)" || return 1
  [[ "$ahead" == "0" ]]
}

echo "== Step 0.1b: prune dev-only folders =="
if [[ $skip_prune -eq 1 ]]; then
  echo "skipped via --skip-prune"
elif [[ $force_prune -eq 1 ]] || is_fresh_clone; then
  for d in "${DEV_ONLY_DIRS[@]}"; do
    if [[ -e "$d" ]]; then
      rm -rf -- "$d"
      echo "removed $d/"
    fi
  done
else
  echo "skipped — this checkout has local commits ahead of upstream and/or uncommitted changes"
  echo "(looks like a maintainer's working copy, not a fresh clone; pass --force-prune to override)"
fi

echo ""
echo "== Step 0.2: install AORDL validator dependency =="
if [[ -d "ROME/rome-core/lib/node_modules" ]]; then
  echo "already installed, skipping (ROME/rome-core/lib/node_modules exists)"
else
  (cd ROME/rome-core/lib && npm install)
fi

if [[ $skip_check -eq 1 ]]; then
  echo ""
  echo "== Step 0.3: sanity check == (skipped via --skip-check)"
else
  echo ""
  echo "== Step 0.3: sanity check =="
  node ROME/rome-core/orchestrator/tests/run.cjs
fi

project_dir="$1"; shift

start_flags=()
prd_files=()
seen_sep=0
for a in "$@"; do
  if [[ "$a" == "--" ]]; then
    seen_sep=1
    continue
  fi
  if [[ $seen_sep -eq 0 ]]; then
    start_flags+=("$a")
  else
    prd_files+=("$a")
  fi
done

if [[ ${#prd_files[@]} -eq 0 ]]; then
  echo "warning: no PRD/BRD files given after '--' — skipping Step 2 (stage them manually later)" >&2
fi

ts="$(date -u +%FT%TZ)"

echo ""
echo "== Step 1: scaffold project =="
node ROME/rome-core/orchestrator/rome-start.cjs "$project_dir" --ts "$ts" ${start_flags[@]+"${start_flags[@]}"}

dest="$project_dir/_user_input/raw-requirements"

if [[ ${#prd_files[@]} -gt 0 ]]; then
  echo ""
  echo "== Step 2: stage inputs into $dest/ =="
  for f in "${prd_files[@]}"; do
    if [[ ! -f "$f" ]]; then
      echo "error: input file not found: $f" >&2
      exit 1
    fi
    cp -v "$f" "$dest/"
  done
fi

echo ""
echo "== Step 0.4 + Step 3: manual — do these in your Claude Code session =="
echo "1. Open a Claude Code session on Opus 4.8 with this directory ($(pwd)) as its working directory."
echo "2. Paste:"
echo "   You are Roma, the ROME orchestrator. Run the project at \`$project_dir/\` following \`ROME/agents/roma/modes/orchestrator.md\`. Begin."
