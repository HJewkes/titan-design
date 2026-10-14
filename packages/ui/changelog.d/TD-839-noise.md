---
section: Added
---

`ui/motion` gains stateless seeded randomness and noise for render code: `random(seed, ...keys)` hashes its arguments to a repeatable value in [0, 1) that does not depend on call order, `randomRange` maps it onto a range, and `noise2D(seed, x, y)` is 2D simplex noise in [-1, 1] ported from simplex-noise (MIT, Jonas Wagner) with its permutation shuffled by `random`. The stateful fixture generator in `ui/charts/kit/seededRandom` is unchanged (TD-839).
