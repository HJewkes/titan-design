---
section: Internal
---

New `titan/no-html-element` lint across `src/components/` (stories and tests exempt): a lowercase JSX element such as `<div>` or `<path>` mounts on web only, so it is blocked outside a shrink-only baseline keyed by file and element name. The message names the react-native primitive for an HTML element and the react-native-svg component for an SVG one. An unspent baseline allowance is reported as stale until `node scripts/update-no-html-element-baseline.mjs` regenerates it, and the script refuses an increase without `--allow-increase` (TD-689).
