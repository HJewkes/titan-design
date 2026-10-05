---
section: Internal
---

Storybook status tags: step 1 of the maturity rule in `MATURITY.md` now also covers stories titled `Lab/…` outside `src/lab`. These stories record design decisions, and the public Storybook build leaves them out. The ten `custom/Workout` `*.decision` stories and `VolumeStatusPalette` keep `status:lab`. Each now also carries `!status:review`, so it no longer inherits the review default as well (TD-649).
