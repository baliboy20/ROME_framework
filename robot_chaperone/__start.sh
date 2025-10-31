#!/bin/bash
# Claude Chaperone - Specification Review & Technical Augmentation
# Startup script to launch chaperone assistant

echo "Launching Claude Chaperone - Specification Review Assistant"
echo "Reading CLAUDE.md instructions..."
echo ""

cat CLAUDE.md | claude "$@"
