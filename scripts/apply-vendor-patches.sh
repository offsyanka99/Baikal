#!/bin/sh
# Apply sabre/dav (and other) vendor patches after composer install/update.
# Safe to re-run: already-applied hunks are skipped (-N / --forward).
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

PATCH_DIR="$ROOT/patches"
DAV_DIR="$ROOT/vendor/sabre/dav"
PATCH_FILE="$PATCH_DIR/sabre-dav-calendar-timezone.patch"

if [ ! -f "$PATCH_FILE" ]; then
  echo "apply-vendor-patches: no patches found at $PATCH_FILE (skip)"
  exit 0
fi

if [ ! -d "$DAV_DIR/lib/CalDAV" ]; then
  echo "apply-vendor-patches: error: $DAV_DIR missing; run composer install first" >&2
  exit 1
fi

# Already applied?
if grep -q 'function resolveCalendarTimeZone' "$DAV_DIR/lib/CalDAV/Plugin.php" 2>/dev/null; then
  echo "apply-vendor-patches: sabre-dav calendar-timezone patch already applied"
  exit 0
fi

if ! command -v patch >/dev/null 2>&1; then
  echo "apply-vendor-patches: error: 'patch' command not found" >&2
  exit 1
fi

echo "apply-vendor-patches: applying sabre-dav calendar-timezone (dual-format) patch"
# -p1 strips a/ b/ prefix; apply inside vendor/sabre/dav
if ! patch -p1 -d "$DAV_DIR" --forward --batch < "$PATCH_FILE"; then
  echo "apply-vendor-patches: error: patch failed (sabre/dav version mismatch?)" >&2
  echo "  Expected a sabre/dav tree compatible with patches/sabre-dav-calendar-timezone.patch" >&2
  exit 1
fi

if ! grep -q 'function resolveCalendarTimeZone' "$DAV_DIR/lib/CalDAV/Plugin.php"; then
  echo "apply-vendor-patches: error: patch applied but marker not found" >&2
  exit 1
fi

echo "apply-vendor-patches: done"
