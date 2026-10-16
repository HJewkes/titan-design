---
section: Internal
---

Colour lint messages now list derived token options (TD-193). `titan/no-raw-color` maps a palette hue to its status role and lists that role's classes, and points a style colour at `useOnSurfaceColor` or `resolveColor`. `titan/no-var-color-opacity` lists the rungs the token publishes, or says it has none and names `alpha()`. The colour `no-restricted-syntax` entries live in `eslint-rules/restricted-syntax.js`. Detection is unchanged.
