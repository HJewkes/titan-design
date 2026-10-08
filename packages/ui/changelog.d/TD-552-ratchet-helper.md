---
section: Fixed
---

The custom ESLint ratchet rules now share one baseline helper: a checkout under a directory named `src` no longer lets `titan/no-upward-tier-import` pass everything, and a malformed baseline file now fails the lint run instead of being ignored (TD-552).
