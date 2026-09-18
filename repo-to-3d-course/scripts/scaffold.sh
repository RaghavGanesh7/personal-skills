#!/usr/bin/env bash
# Scaffold a course-site project from this skill's templates.
#
#   scaffold.sh <project-dir> [content-source-dir]
#
# Copies build/, src/, tools/ and the project files into <project-dir>, then
# (optionally) copies the upstream markdown tree into <project-dir>/content/.
# Never overwrites an existing build/catalog.mjs — that file is yours.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="${1:?usage: scaffold.sh <project-dir> [content-source-dir]}"
CONTENT_SRC="${2:-}"

mkdir -p "$PROJECT"/{build,src/assets,tools,content}

copy() { # copy unless the destination already exists
  if [ -e "$2" ]; then echo "keep    $2"; else cp "$1" "$2"; echo "create  $2"; fi
}

for f in build.mjs render.mjs pages.mjs catalog.mjs; do
  copy "$SKILL_DIR/templates/build/$f" "$PROJECT/build/$f"
done
for f in styles.css app.js hero.js; do
  copy "$SKILL_DIR/templates/src/assets/$f" "$PROJECT/src/assets/$f"
done
copy "$SKILL_DIR/scripts/check_site.mjs" "$PROJECT/tools/check_site.mjs"
copy "$SKILL_DIR/scripts/check_diagrams.mjs" "$PROJECT/tools/check_diagrams.mjs"
copy "$SKILL_DIR/scripts/shots.mjs" "$PROJECT/tools/shots.mjs"
copy "$SKILL_DIR/templates/package.json" "$PROJECT/package.json"
copy "$SKILL_DIR/templates/gitignore" "$PROJECT/.gitignore"
mkdir -p "$PROJECT/.github/workflows"
copy "$SKILL_DIR/templates/ci-build.yml" "$PROJECT/.github/workflows/build.yml"

if [ -n "$CONTENT_SRC" ]; then
  echo "copying content from $CONTENT_SRC"
  rsync -a --exclude '.git' "$CONTENT_SRC"/ "$PROJECT/content"/
fi

cat <<'NEXT'

next:
  1. cd <project-dir> && npm install
  2. edit build/catalog.mjs — SITE identity, credit, hero lines, then MODULES
  3. npm run build && npm run check
  4. npm run serve   (and, in another shell) npm run shots
     npm run diagrams  — if the source uses mermaid
NEXT
