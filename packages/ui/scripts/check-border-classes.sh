#!/bin/bash
# Detect undefined "DEFAULT-suffix" token classes in source components.
#
# In tailwind.config.js the DEFAULT variant of a color token is emitted as a
# *suffix-less* utility. e.g. `colors.border.DEFAULT` -> class `border-border`,
# `colors.background.DEFAULT` -> `bg-background`. Writing `border-border-default`
# (or `bg-border-default`, `divide-border-default`, ...) references a token that
# Tailwind never generates: the class silently renders nothing and the element
# falls back to the framework default border color (currentColor under
# NativeWind), producing unintended black borders instead of the theme color.
#
# Use the suffix-less DEFAULT class instead:
#   border-border-default -> border-border
#   bg-border-default     -> bg-border
#   divide-border-default -> divide-border
#
# Stories and tests are excluded — they may demonstrate patterns intentionally.

SRC_DIR="$(dirname "$0")/../src/components"

ISSUES=$(grep -rnE '(bg|text|border|divide|ring|fill|stroke|outline|caret|accent|placeholder|decoration|from|via|to)-[a-z]+(-[a-z]+)*-default\b' \
  "$SRC_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  | grep -v '\.test\.' \
  | grep -v '\.stories\.' \
  | grep -v '\.visual\.' \
  | grep -v 'var(--')

if [ -n "$ISSUES" ]; then
  echo "undefined token class: found '*-default' color utilities in source components."
  echo "The DEFAULT variant of a token is the suffix-less class (e.g. 'border-border', not 'border-border-default')."
  echo ""
  echo "$ISSUES"
  exit 1
fi

echo "No undefined DEFAULT-suffix token classes found."
