---
section: Internal
---

`VelocityStripProps.hideBaseline` is removed. The prop was destructured and never read, so no variant honoured it and rendering is unchanged; `DualVelocityHero` no longer passes it to its wings (TD-594).
