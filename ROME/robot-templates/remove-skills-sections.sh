#!/bin/bash

# Script to remove "Skills Auto-Discovery System" sections from robot CLAUDE.md files

ROBOTS=("reena" "roma" "pma" "lucien" "ashok" "bootstrap")

for robot in "${ROBOTS[@]}"; do
  FILE="/Users/will/flutterProjects/Exercises/dec/R2D-Rome-001/ROME_AORDL_V2/ROME/robot-templates/$robot/CLAUDE.md"

  echo "Processing $robot..."

  # Use awk to remove the Skills section (from "## Skills" to the next "---")
  awk '
    /## Skills Auto-Discovery System/ { skip=1; next }
    skip && /^---$/ { skip=0; print; next }
    !skip
  ' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

  echo "  ✓ Removed Skills section from $robot"
done

echo ""
echo "✅ Completed! Skills sections removed from all remaining robots."
echo "Backups are available as CLAUDE.md.bak in each robot directory."
