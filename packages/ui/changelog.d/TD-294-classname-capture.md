---
section: Internal
---

Test capture now records each host node's `className` in a WeakMap, so `spacingClassesAt(node)` reads the rendered classes of an element found by text, role or label. `spacingClassesOf` and `spacingClassesAt` throw on an `Animated.*` element carrying a `className`, which NativeWind never applies (TD-294).
