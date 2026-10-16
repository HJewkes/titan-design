---
section: Added
---

`ProgressSteps` takes `variant="rail"`, which draws done / active / pending step chips joined by
connectors, and a fractional `progress` that fills the connector into the active step. The new
types `ProgressStepsVariant` and `ProgressStepState` are exported. The default `dots` variant
renders as before (TD-853).
