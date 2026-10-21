---
section: Fixed
---

The publish job checks out full history, so `prepublishOnly`'s ratchet-baseline test finds `origin/main` on a tag push. 0.22.0 and 0.23.0 were tagged but never reached npm because that test failed there.
