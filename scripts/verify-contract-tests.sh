#!/bin/bash

# Contract Test Verification Script
# Used by GitHub Actions to enforce TDD-ROME contract compliance

set -e

echo "🔍 ROME Contract Test Verification"
echo "================================="

# Check if contracts directory exists
if [ ! -d "SOURCE/tests/contracts" ]; then
    echo "❌ Missing SOURCE/tests/contracts directory"
    echo "📝 Create contract tests for all interfaces before implementation"
    exit 1
fi

# Check for contract test files
CONTRACT_API_COUNT=$(find SOURCE/tests/contracts -name "*api*.test.js" 2>/dev/null | wc -l)
CONTRACT_DB_COUNT=$(find SOURCE/tests/contracts -name "*database*.test.js" 2>/dev/null | wc -l)
CONTRACT_UI_COUNT=$(find SOURCE/tests/contracts -name "*ui*.test.js" 2>/dev/null | wc -l)

echo "Contract Test Summary:"
echo "- API Contracts: $CONTRACT_API_COUNT"
echo "- Database Contracts: $CONTRACT_DB_COUNT"
echo "- UI Contracts: $CONTRACT_UI_COUNT"

# Check implementation vs contract coverage
CONTROLLER_COUNT=$(find SOURCE/backend/src/controllers -name "*.js" 2>/dev/null | wc -l || echo "0")
MODEL_COUNT=$(find SOURCE/backend/src/models -name "*.js" 2>/dev/null | wc -l || echo "0")

echo ""
echo "Implementation Coverage:"
echo "- Controllers: $CONTROLLER_COUNT (need $CONTROLLER_COUNT API contracts)"
echo "- Models: $MODEL_COUNT (need $MODEL_COUNT database contracts)"

# Warn if implementation exceeds contracts
if [ "$CONTROLLER_COUNT" -gt "$CONTRACT_API_COUNT" ]; then
    echo "⚠️  More controllers than API contracts!"
    echo "🚨 TDD Violation: Contract tests should exist before implementation"
fi

if [ "$MODEL_COUNT" -gt "$CONTRACT_DB_COUNT" ]; then
    echo "⚠️  More models than database contracts!"
    echo "🚨 TDD Violation: Schema contracts should exist before models"
fi

# Check that contract tests have meaningful assertions
echo ""
echo "🧪 Verifying contract test quality..."

for contract_file in $(find SOURCE/tests/contracts -name "*.test.js" 2>/dev/null); do
    if ! grep -q -E "(expect|assert|should)" "$contract_file"; then
        echo "⚠️  Contract test may lack assertions: $contract_file"
    fi
    
    if ! grep -q -E "(describe|it|test)" "$contract_file"; then
        echo "⚠️  Contract test may lack test structure: $contract_file"
    fi
done

# Minimum contract requirements
TOTAL_CONTRACTS=$((CONTRACT_API_COUNT + CONTRACT_DB_COUNT + CONTRACT_UI_COUNT))
if [ "$TOTAL_CONTRACTS" -eq 0 ]; then
    echo "❌ No contract tests found!"
    echo "🚨 ROME requires contract tests before any implementation"
    exit 1
fi

if [ "$TOTAL_CONTRACTS" -lt 3 ]; then
    echo "⚠️  Very few contract tests ($TOTAL_CONTRACTS)"
    echo "💡 Consider if all interfaces are covered"
fi

echo ""
echo "✅ Contract test verification completed"
echo "📊 Total contracts: $TOTAL_CONTRACTS"