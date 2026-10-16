---
section: Changed
---

The filled `Input` and the filled `Select` trigger share the inset elevation: the fill is one plane down from the enclosing plane in dark and the plane's own colour in light (where raised and overlay are both white, so a step down gave two wells for one plane colour), cut in by the inset-well recess on web (native keeps the flat fill); the Input drops the recess while focused so the focus border reads alone. Replaces `surface-input` on the Input and the `scrim-subtle` fill on the Select, which shifted with the plane under them (TD-278).
