---
section: Fixed
---

`MesoCard`: the highlighted border now renders the brand-primary colour. An Animated interpolation passed through `style` overrode it with a value a plain `View` cannot use, so the card kept its default border. The unused `useHighlightBorder` hook and the no-op `Animated.View` wrapper are removed (TD-550).
