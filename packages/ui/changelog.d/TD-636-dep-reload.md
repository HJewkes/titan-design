---
section: Internal
---

Storybook now pre-bundles `@storybook/addon-themes` at startup, so Vite no longer re-optimizes and reloads the dev server mid-run, which blanked the first DualVelocityStrip visual stories; the 20 s cold-start guard from TD-636 is removed (TD-636).
