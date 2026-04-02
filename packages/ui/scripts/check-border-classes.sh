#!/bin/bash
# Detect 'border border-*' class combinations in source components.
#
# The bare 'border' utility sets borderColor to currentColor in NativeWind,
# which can override a subsequent 'border-*' color class and render black
# borders instead of the intended theme color. Use inline styles instead:
#   style={{ borderWidth: 1, borderColor: WORKOUT_TOKENS.border.default }}
#
# Stories and tests are excluded — they may demonstrate patterns intentionally.

ISSUES=$(grep -rn 'className.*border border-' \
  "$(dirname "$0")/../src/components/" \
  --include="*.tsx" \
  --include="*.ts" \
  | grep -v '\.test\.' \
  | grep -v '\.stories\.')

if [ -n "$ISSUES" ]; then
  echo "border class footgun: found 'border border-*' combinations in source components."
  echo "Use inline styles instead of combining the bare 'border' utility with a border color class."
  echo ""
  echo "$ISSUES"
  exit 1
fi

echo "No border class issues found."
