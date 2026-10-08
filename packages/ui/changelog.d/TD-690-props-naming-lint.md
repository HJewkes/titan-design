---
section: Internal
---

New `titan/props-naming` lint across `src/components/` (stories and tests exempt): a `disabled`, `loading`, `selected` or `onClick` member declared on a type alias or interface named `*Props` is blocked outside a shrink-only baseline keyed by file and property name, and the message names the convention prop (`isDisabled`, `isLoading`, `isSelected`, `onPress`). Members inherited through `extends` or a type reference are not inspected, and a `selected` whose annotation is not boolean-shaped is read as a controlled value and left alone. An unspent baseline allowance is reported as stale until `node scripts/update-props-naming-baseline.mjs` regenerates it, and the script refuses an increase without `--allow-increase`. `titan/no-html-element` now names the exported `Link` for a lowercase `<a>` instead of Pressable (TD-690).
