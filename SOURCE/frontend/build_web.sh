#!/bin/bash

echo "Building Flutter Web production bundle..."
flutter build web --release

echo ""
echo "Build complete! Production files in build/web/"
echo ""
echo "To serve the production build locally:"
echo "  cd build/web && python3 -m http.server 8080"
echo ""
echo "Or deploy to your web server by copying the build/web directory."