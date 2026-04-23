#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Configuration ────────────────────────────────────────────────────────────
REMOTE="origin"
BRANCH="master"
DRUSH="$SCRIPT_DIR/vendor/bin/drush"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[deploy]${NC} $*"; }
warning() { echo -e "${YELLOW}[deploy]${NC} $*"; }
abort()   { echo -e "${RED}[deploy] ERROR:${NC} $*" >&2; exit 1; }

# ── Preflight ────────────────────────────────────────────────────────────────
[[ -d "$SCRIPT_DIR/.git" ]] || abort "Not a git repository. Run from the project root."

# ── 1. Build media_hub ───────────────────────────────────────────────────────
APP_DIR="$SCRIPT_DIR/web/modules/custom/media_hub/app"

info "Installing media_hub dependencies..."
npm ci --prefix "$APP_DIR"

info "Running media_hub tests..."
npm test --prefix "$APP_DIR"

info "Building media_hub..."
npm run build --prefix "$APP_DIR"

# ── 2. Export config & translations ──────────────────────────────────────────
info "Exporting Drupal configuration..."
"$DRUSH" cex -y

# ── 3. Commit & push ─────────────────────────────────────────────────────────
info "Staging all changes..."
git -C "$SCRIPT_DIR" add --all

if git -C "$SCRIPT_DIR" diff --cached --quiet; then
  warning "Nothing to commit — working tree clean."
else
  COMMIT_MSG="${1:-"Deploy $(date '+%Y-%m-%d %H:%M')"}"
  info "Committing: $COMMIT_MSG"
  git -C "$SCRIPT_DIR" commit -m "$COMMIT_MSG"
fi

info "Pushing $BRANCH → $REMOTE..."
git -C "$SCRIPT_DIR" push "$REMOTE" "$BRANCH"

info "Done."
