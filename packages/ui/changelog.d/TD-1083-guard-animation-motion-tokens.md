---
section: Changed
---

The `animate-scale-in` utility runs 150 ms (the fast duration token) instead of 200 ms, and a test
now requires every Tailwind animation shorthand, except the infinite `shimmer` loop, to use a
`--duration-*` and `--ease-*` value (TD-1083).
