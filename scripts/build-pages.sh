#!/bin/bash
# Build 3D desk scene + bundle Win95 portfolio for GitHub Pages.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/portfolio-3d/public"

echo "→ Building 3D scene (webpack)…"
cd "$ROOT/portfolio-3d"
if [ -n "${CI:-}" ] || [ ! -d node_modules ]; then
  npm ci
else
  npm install
fi
npm run build

echo "→ Copying notepad portfolio into public/…"
cp "$ROOT/about.html" "$OUT/about.html"
cp -R "$ROOT/css" "$OUT/css"
cp -R "$ROOT/js" "$OUT/js"
cp -R "$ROOT/assets" "$OUT/assets"

if [ -f "$ROOT/cover.html" ]; then
  cp "$ROOT/cover.html" "$OUT/cover.html"
fi

echo "✓ Site ready in portfolio-3d/public/"
echo "  Entry: index.html (3D desk) + about.html (notepad UI)"
