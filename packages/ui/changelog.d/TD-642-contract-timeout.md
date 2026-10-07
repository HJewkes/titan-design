---
section: Internal
---

The `lint message contract: the checker` tests get a 30 s timeout like the spacing block, since the first case cold-imports the whole package barrel and hit vitest's 5 s default on a loaded CI runner (TD-642).
