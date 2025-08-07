#!/bin/bash

# Contract Integrity Verification Script
# Ensures contract tests haven't been weakened to make them pass

set -e

echo "🔒 ROME Contract Integrity Check"
echo "==============================="

# Check if contract tests were modified in recent commits
echo "🔍 Checking for contract test modifications..."

RECENT_COMMITS=10
MODIFIED_CONTRACTS=$(git log --name-only -n $RECENT_COMMITS --pretty=format: | grep -E 'contracts.*test\.js' | sort -u || true)

if [ ! -z "$MODIFIED_CONTRACTS" ]; then
    echo "⚠️  Contract tests modified in recent commits:"
    echo "$MODIFIED_CONTRACTS"
    echo ""
    
    # Check if modifications weakened tests
    for contract in $MODIFIED_CONTRACTS; do
        if [ -f "$contract" ]; then
            echo "📋 Analyzing $contract..."
            
            # Check for common signs of test weakening
            if git log -n $RECENT_COMMITS --oneline -- "$contract" | grep -i -E "(fix|skip|disable|todo|remove)"; then
                echo "🚨 Potential contract weakening detected in: $contract"
                echo "   Recent commits suggest test modifications to make them pass"
            fi
            
            # Check current test quality
            ASSERTION_COUNT=$(grep -c -E "(expect|assert|should)" "$contract" || echo "0")
            if [ "$ASSERTION_COUNT" -lt 3 ]; then
                echo "⚠️  Low assertion count ($ASSERTION_COUNT) in: $contract"
                echo "   Contract tests should have comprehensive assertions"
            fi
            
            # Check for test skipping
            if grep -q -E "(skip|xit|xdescribe)" "$contract"; then
                echo "🚨 Skipped tests found in: $contract"
                echo "   Contract tests should not be skipped"
            fi
        fi
    done
else
    echo "✅ No contract test modifications in recent commits"
fi

echo ""
echo "🧪 Verifying contract test execution..."

# Ensure contract tests can still run and fail when they should
if [ -d "SOURCE/tests/contracts" ]; then
    cd SOURCE/backend 2>/dev/null || cd SOURCE || {
        echo "❌ Cannot find project root"
        exit 1
    }
    
    # Run contract tests to ensure they're executable
    echo "▶️  Running contract tests..."
    if command -v npm >/dev/null 2>&1; then
        if npm run test:contracts >/dev/null 2>&1; then
            echo "✅ Contract tests are executable and passing"
        else
            echo "⚠️  Contract tests failed - this could be expected during development"
        fi
    else
        echo "⚠️  npm not available, skipping contract test execution"
    fi
fi

echo ""
echo "📊 Contract Statistics:"

if [ -d "SOURCE/tests/contracts" ]; then
    TOTAL_CONTRACTS=$(find SOURCE/tests/contracts -name "*.test.js" | wc -l)
    TOTAL_ASSERTIONS=$(grep -r -c -E "(expect|assert|should)" SOURCE/tests/contracts/ 2>/dev/null | awk -F: '{sum += $2} END {print sum}' || echo "0")
    AVG_ASSERTIONS=$((TOTAL_ASSERTIONS / (TOTAL_CONTRACTS > 0 ? TOTAL_CONTRACTS : 1)))
    
    echo "- Total contract files: $TOTAL_CONTRACTS"
    echo "- Total assertions: $TOTAL_ASSERTIONS"
    echo "- Average assertions per contract: $AVG_ASSERTIONS"
    
    if [ "$AVG_ASSERTIONS" -lt 5 ]; then
        echo "⚠️  Low average assertions per contract"
        echo "   Consider adding more comprehensive test cases"
    fi
else
    echo "❌ No contracts directory found"
    exit 1
fi

echo ""
echo "🔐 Contract Quality Gates:"

# Quality gate checks
QUALITY_ISSUES=0

# 1. Minimum number of contracts
if [ "$TOTAL_CONTRACTS" -lt 3 ]; then
    echo "❌ Too few contract tests ($TOTAL_CONTRACTS < 3)"
    QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
else
    echo "✅ Sufficient contract tests ($TOTAL_CONTRACTS)"
fi

# 2. Assertion density
if [ "$AVG_ASSERTIONS" -lt 3 ]; then
    echo "❌ Low assertion density ($AVG_ASSERTIONS < 3 per contract)"
    QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
else
    echo "✅ Good assertion density ($AVG_ASSERTIONS per contract)"
fi

# 3. No skipped tests
SKIPPED_TESTS=$(grep -r -c -E "(skip|xit|xdescribe)" SOURCE/tests/contracts/ 2>/dev/null | awk -F: '{sum += $2} END {print sum}' || echo "0")
if [ "$SKIPPED_TESTS" -gt 0 ]; then
    echo "❌ Skipped contract tests found ($SKIPPED_TESTS)"
    QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
else
    echo "✅ No skipped contract tests"
fi

echo ""
if [ "$QUALITY_ISSUES" -eq 0 ]; then
    echo "✅ Contract integrity verified - all quality gates passed"
else
    echo "❌ Contract integrity issues found ($QUALITY_ISSUES)"
    echo "🚨 Contract quality must be maintained for TDD-ROME"
    exit 1
fi