---
section: Internal
---

The framed `VelocityStrip` no longer passes the `bg-surface-raised` class, which NativeWind never applied to its `Animated.View`. Nothing rendered changes, and a test now fails if the strip starts painting a background (TD-509).
