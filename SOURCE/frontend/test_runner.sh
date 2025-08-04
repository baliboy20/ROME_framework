#!/bin/bash

# Flutter Test Runner with Coverage
# This script runs all tests and generates coverage reports

echo "🧪 Running Flutter Tests with Coverage..."
echo "========================================"

# Change to frontend directory
cd "$(dirname "$0")"

# Clean previous coverage data
echo "🧹 Cleaning previous coverage data..."
rm -rf coverage/
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Run code generation if needed
echo "⚙️ Running code generation..."
flutter packages pub run build_runner build --delete-conflicting-outputs

# Run tests with coverage
echo "🔍 Running tests with coverage..."
flutter test --coverage

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    
    # Generate HTML coverage report if lcov is available
    if command -v genhtml &> /dev/null; then
        echo "📊 Generating HTML coverage report..."
        genhtml coverage/lcov.info -o coverage/html
        echo "📂 Coverage report generated at: coverage/html/index.html"
    else
        echo "⚠️  genhtml not found. Install lcov to generate HTML reports:"
        echo "   macOS: brew install lcov"
        echo "   Ubuntu: sudo apt-get install lcov"
    fi
    
    # Show coverage summary
    if command -v lcov &> /dev/null; then
        echo ""
        echo "📈 Coverage Summary:"
        echo "==================="
        lcov --summary coverage/lcov.info
    fi
    
else
    echo "❌ Tests failed!"
    exit 1
fi

echo ""
echo "🎉 Test run complete!"