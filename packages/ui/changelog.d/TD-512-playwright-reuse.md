---
section: Fixed
---

Playwright no longer reuses a server already on port 6006 or 5200, so a suite cannot screenshot another worktree's tree; the specimen server starts with `--strictPort` (TD-512).
