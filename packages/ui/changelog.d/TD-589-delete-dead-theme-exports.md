---
section: Removed
---

Dead theme exports (TD-589): `getDiscreteRainbowColor`, `getThemeCSSVars`, `gluestackConfig`,
`ThemeConfig`, `postIt`, `isDark`, `elevationPlane` and `PRESSED_ELEVATION_LEVEL`. `discreteRainbow`
stays. `linearGradientStops` is now exported from the theme barrel, as its 0.x changelog entry
already said. Consumer greps, each with `git grep -n -w <symbol>` over this repo (outside the
files that defined or re-exported it, the API reports and tests) and over titan-platform
`origin/main` code files: empty for every symbol removed.
