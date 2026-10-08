---
section: Fixed
---

The `scripts/` CLIs detect direct invocation through one shared `isEntryPoint`, so `check-play-count` and the other gates no longer exit 0 without running from a checkout path holding a space, `%` or non-ASCII. `design-freeze` creates its git tag only after the manifest and outerHTML extraction succeed (TD-553).
