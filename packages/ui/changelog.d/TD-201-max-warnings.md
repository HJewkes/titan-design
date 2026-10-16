---
section: Changed
---

`useTable`'s row type parameter is constrained to `object` instead of `Record<string, any>` (type-only). `pnpm lint` fails on any eslint warning (TD-201).
