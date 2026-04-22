#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/web/modules/custom/media_hub/app"

echo "→ Installing dependencies..."
npm ci --prefix "$APP_DIR"

echo "→ Running tests..."
npm test --prefix "$APP_DIR"

echo "→ Building..."
npm run build --prefix "$APP_DIR"

echo "→ Clearing Drupal cache..."
"$SCRIPT_DIR/vendor/bin/drush" cr

echo "✓ Media Hub built and cache cleared."
