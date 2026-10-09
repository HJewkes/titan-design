---
section: Fixed
---

Every `SetBarChart` bar, and so every `VelocityStrip`, `DualVelocityStrip`, `VelocityHero`, `PinnedLiveStrip` and `RomProgressionChart`, draws the short soft shadow on a light plane. `SetBarTreatment.lightPaper` defaults to `soft` (was `raised`, which only `DualPinnedLiveStrip` overrode); dark planes are unchanged and `lightPaper: 'raised'` restores the paper's drop shadow (TD-764).
