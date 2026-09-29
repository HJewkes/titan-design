#!/usr/bin/env bash
# Checks the built package shape: publint, then attw on the packed tarball. Run after `pnpm build`.
set -euo pipefail
cd "$(dirname "$0")/.."

publint --strict

# These three subpaths are CSS or a CommonJS Tailwind config, not TypeScript entry points.
attw --pack . --profile node16 \
  --exclude-entrypoints ./theme/global.css ./tokens.css ./tailwind.config.js
