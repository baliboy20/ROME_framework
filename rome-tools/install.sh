#!/bin/bash
# ROME v6.1 Tools Installation Script

echo "🚀 Installing ROME v6.1 Tools..."
echo ""

# Install CLI
echo "📦 Installing CLI dependencies..."
cd cli && npm install
if [ $? -eq 0 ]; then
  echo "✅ CLI installed successfully"
else
  echo "❌ CLI installation failed"
  exit 1
fi

# Install Monitor
echo ""
echo "📦 Installing Monitor dependencies..."
cd ../monitor && npm install
if [ $? -eq 0 ]; then
  echo "✅ Monitor installed successfully"
else
  echo "❌ Monitor installation failed"
  exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "  CLI:     ./cli/rome-cli.js --help"
echo "  Monitor: cd monitor && npm start"
echo ""
echo "See README.md for full documentation"
