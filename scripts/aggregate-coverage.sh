#!/bin/bash

# Coverage Aggregation Script for Roma's Reporting
# Combines coverage from all robots into a single report

set -e

echo "📊 ROME Coverage Aggregation"
echo "============================"

# Initialize coverage data
BACKEND_COVERAGE=0
FRONTEND_COVERAGE=0
DATABASE_COVERAGE=0
INFRASTRUCTURE_COVERAGE=0
CONTRACT_COVERAGE=0

# Backend coverage (Reena)
if [ -f "SOURCE/backend/coverage/coverage-summary.json" ]; then
    BACKEND_COVERAGE=$(node -e "
        const coverage = require('./SOURCE/backend/coverage/coverage-summary.json');
        console.log(Math.round(coverage.total.lines.pct));
    " 2>/dev/null || echo "0")
    echo "🔧 Backend Coverage (Reena): $BACKEND_COVERAGE%"
else
    echo "⚠️  No backend coverage found"
fi

# Frontend coverage (Charlie)
if [ -f "SOURCE/frontend/coverage/lcov.info" ]; then
    # Basic Flutter coverage calculation
    LINES_FOUND=$(grep -c "LF:" SOURCE/frontend/coverage/lcov.info 2>/dev/null || echo "0")
    LINES_HIT=$(grep -c "LH:" SOURCE/frontend/coverage/lcov.info 2>/dev/null || echo "0")
    
    if [ "$LINES_FOUND" -gt 0 ]; then
        FRONTEND_COVERAGE=$(( (LINES_HIT * 100) / LINES_FOUND ))
    fi
    echo "🎨 Frontend Coverage (Charlie): $FRONTEND_COVERAGE%"
else
    echo "⚠️  No frontend coverage found"
fi

# Database coverage (Ashok) - usually included in backend
if [ -f "SOURCE/database/coverage/coverage-summary.json" ]; then
    DATABASE_COVERAGE=$(node -e "
        const coverage = require('./SOURCE/database/coverage/coverage-summary.json');
        console.log(Math.round(coverage.total.lines.pct));
    " 2>/dev/null || echo "0")
    echo "🗄️ Database Coverage (Ashok): $DATABASE_COVERAGE%"
else
    # Database tests often run with backend tests
    DATABASE_COVERAGE=$BACKEND_COVERAGE
    echo "🗄️ Database Coverage (Ashok): $DATABASE_COVERAGE% (via backend)"
fi

# Infrastructure coverage (Luc)
if [ -f "SOURCE/infrastructure/coverage/coverage-summary.json" ]; then
    INFRASTRUCTURE_COVERAGE=$(node -e "
        const coverage = require('./SOURCE/infrastructure/coverage/coverage-summary.json');
        console.log(Math.round(coverage.total.lines.pct));
    " 2>/dev/null || echo "0")
    echo "⚙️ Infrastructure Coverage (Luc): $INFRASTRUCTURE_COVERAGE%"
else
    echo "⚠️  No infrastructure coverage found"
fi

# Contract test coverage
CONTRACT_API_COUNT=$(find SOURCE/tests/contracts -name "*api*.test.js" 2>/dev/null | wc -l)
CONTRACT_DB_COUNT=$(find SOURCE/tests/contracts -name "*database*.test.js" 2>/dev/null | wc -l)
CONTRACT_UI_COUNT=$(find SOURCE/tests/contracts -name "*ui*.test.js" 2>/dev/null | wc -l)
TOTAL_CONTRACTS=$((CONTRACT_API_COUNT + CONTRACT_DB_COUNT + CONTRACT_UI_COUNT))

# Calculate contract coverage based on implementation files
CONTROLLER_COUNT=$(find SOURCE/backend/src/controllers -name "*.js" 2>/dev/null | wc -l || echo "1")
MODEL_COUNT=$(find SOURCE/backend/src/models -name "*.js" 2>/dev/null | wc -l || echo "1")
COMPONENT_COUNT=$(find SOURCE/frontend/lib -name "*.dart" 2>/dev/null | wc -l || echo "1")
TOTAL_IMPL=$((CONTROLLER_COUNT + MODEL_COUNT + (COMPONENT_COUNT / 10)))  # Rough component estimate

if [ "$TOTAL_IMPL" -gt 0 ]; then
    CONTRACT_COVERAGE=$(( (TOTAL_CONTRACTS * 100) / TOTAL_IMPL ))
    # Cap at 100%
    if [ "$CONTRACT_COVERAGE" -gt 100 ]; then
        CONTRACT_COVERAGE=100
    fi
fi

echo "📋 Contract Coverage: $CONTRACT_COVERAGE% ($TOTAL_CONTRACTS contracts for ~$TOTAL_IMPL implementations)"

# Calculate overall coverage
OVERALL_COVERAGE=$(( (BACKEND_COVERAGE + FRONTEND_COVERAGE + DATABASE_COVERAGE + INFRASTRUCTURE_COVERAGE + CONTRACT_COVERAGE) / 5 ))

echo ""
echo "📊 Roma's Coverage Summary:"
echo "=========================="
echo "Overall Coverage: $OVERALL_COVERAGE%"

# Generate JSON output for CI
cat > coverage.json << EOF
{
  "overall": $OVERALL_COVERAGE,
  "luc": $INFRASTRUCTURE_COVERAGE,
  "ashok": $DATABASE_COVERAGE,
  "reena": $BACKEND_COVERAGE,
  "charlie": $FRONTEND_COVERAGE,
  "contracts": $CONTRACT_COVERAGE,
  "apiContracts": $CONTRACT_API_COUNT,
  "dbContracts": $CONTRACT_DB_COUNT,
  "uiContracts": $CONTRACT_UI_COUNT,
  "totalContracts": $TOTAL_CONTRACTS,
  "timestamp": "$(date -Iseconds)"
}
EOF

echo ""
echo "✅ Coverage aggregation complete"
echo "📄 Results saved to coverage.json"

# Exit with error if overall coverage is below threshold
if [ "$OVERALL_COVERAGE" -lt 80 ]; then
    echo ""
    echo "❌ Overall coverage $OVERALL_COVERAGE% below 80% threshold"
    echo "🚨 Roma blocks deployment until coverage improves"
    exit 1
fi

echo "✅ Coverage meets 80% threshold"