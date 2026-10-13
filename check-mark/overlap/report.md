# Check mark overlap, apex loop and optimisation: 2026-10-13

Owner request 317c. The base is design B (Brush taper plus a vertical left cut, decisions 309a and 308d), as td#838
implements it at 67f5594e. Branch `agent-chat/tpo-checkmark-overlap` is stacked on #838.

## 1. The comparison test

`packages/ui/src/test/svg-overlap.ts` holds the comparison helper.

- `rasterize(shape, size, viewBox)` fills path data (M L H V Q C Z, absolute and relative) or point polygons into a
  1-bit raster with the nonzero rule. A pixel counts as filled when its centre is inside. There is no antialiasing,
  and the arithmetic is plain JS with no canvas, so it gives the same bits on every machine and runs under jsdom in
  CI. Curves are flattened into 256 chords.
- `compareSvgPaths(a, b, size = 2048)` returns `{ iou, both, onlyA, onlyB }`.
- `selfCrossings(polygon)` lists non-adjacent edge pairs that cross, with the crossing point.
- `SAME_SHAPE_MIN_IOU = 0.99`.

### The bar

These numbers are measured at 2048 px on B (`scripts/bar.ts`). Each node was moved along the normal of its
neighbours' chord.

| move | weight 2: min / median IoU | weight 3: min / median IoU |
| --- | --- | --- |
| identical | 1 | 1 |
| 0.01 unit | 0.99964 / 0.99981 | 0.99931 / 0.99986 |
| 0.1 unit | 0.99607 / 0.99806 | 0.99554 / 0.99865 |
| 0.25 unit | 0.98956 / 0.99518 | 0.98920 / 0.99665 |
| 1 unit | 0.95694 / 0.98074 | 0.95746 / 0.98658 |
| whole mark +0.25 x | 0.793 | 0.850 |

0.99 lets every rounding-level change through with a 10× margin, and fails the median single-node 1-unit nudge at
both weights. The example of 0.985 would let the median 1-unit nudge at weight 3 pass (0.987).

IoU is very sensitive to small shifts spread along a long edge. Moving a cubic's handles by 0.03 unit costs about 0.8%
IoU, and 0.03 unit is 0.03 px at 24 px.

The tests cover these cases: identical paths score 1 with zero pixels on either side; two half-overlapping squares
score exactly 1/3; relative commands equal absolute ones; a cubic circle fills its area to 0.1%; a mark moved by half
a hundredth passes. The mutation case pushes the apex node out by 1 unit, which **fails** at IoU 0.957 with `onlyA = 0`.

## 2. The apex self-intersection is real

`selfCrossings` finds exactly one crossing at every weight, on the inner side at the apex:

| weight | crossing at | loop edges |
| --- | --- | --- |
| 1 | (9.15, 16.61) | 54 × 56 |
| 2 | (9.05, 15.65) | 52 × 56 |
| 3 | (8.95, 14.76) | 50 × 56 |
| 4 | (8.88, 13.91) | 48 × 56 |

On the inner side, the leg's samples run past the tail's and the tail's run back past the leg's before the side turns,
so it winds a small triangle. That triangle has the same orientation as the outline, so it has **winding 2**. Nonzero
fill (the `<polygon>` default) paints it, which is why nobody has seen it. An even-odd fill, a stroked outline, a
boolean op or react-native-svg with `fillRule="evenodd"` would punch a hole there.

See `apex-zoom-b-w3.png`. The red triangle is the loop, the orange square is the crossing, and the blue dots are the
polygon's nodes. `apex-zoom-bprime-w3.png` shows the same region after the fix.

**B′** keeps the samples and replaces the loop with its crossing point, snapped to hundredths. It fills the same
pixels as B: IoU is 0.99998 at 2048 px, with 4 px only in B and 1 px only in B′ at weight 2, and 9 px and 0 px at
weight 3. The vertical left cut is unchanged.

## 3. Optimisation

**B″ outline.** The cut, the straight leg and the apex corner stay the same: three line nodes, as in B. Each side of
the tail becomes one cubic, fitted by least squares on chord length to B′'s 24 tail samples. One pass is enough; more
Newton reparametrisation moves IoU by under 0.0005. The largest deviation from the samples is 0.013 unit. The path
drops from about 700 B to about 140 B.

Dead ends, kept in `scripts/` for the record:

- A tangent-plus-midpoint closed-form offset (`analytic.ts`) scored IoU 0.98.
- End-chord-constrained handles (`bpp2.ts`) scored 0.94–0.97.
- A node table linear in weight (`linear.ts`) scored 0.970 at weight 1.

**B″ draw-on spine.** I simulated the `pathLength=1` dash mask: butt caps, miter joins with limit 4, 200 frames, at
512 px (`sim.ts`). It showed that B's sharp spine corner makes the dash's butt edge swing 108° in one frame. That
frame reveals the whole inner corner: 4.77% of the mark at weight 3, about 9× the mean step. Round or miter joins make
no difference; the cause is the cap rotation.

A quadratic fillet from 1 unit before the apex to 1 unit along the tail fixes it. I tried radii of 0.5, 1, 1.5, 2
and 2.5 units; 1 unit gave most of the gain with the least retiming. The fully drawn mask still covers the mark at
weights 1–4: the existing coverage test now runs on both the polygon and the flattened path.

Animation measures, over the frames where something changes:

- **peak frame step**: the largest share of the mark revealed in one 1/200 step.
- **spike ratio**: the largest step divided by the median of its ±5 neighbours. A value of 1 means no jump.
- **roughness**: Σ|Δstep| / Σstep, the total variation of the reveal rate.

Every candidate is monotonic and fully drawn at p = 1. The taper's falling rate toward the tip is part of the design,
not a defect.

### Comparison

The bytes column is the `points` attribute for B and B′ and the `d` attribute for B″.

| weight | candidate | IoU vs B @2048 | px only B | px only cand. | nodes | bytes | self-crossings | peak frame step | spike ratio | roughness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | B | 1.00000 | 0 | 0 | 64 | 710 | 1 | 3.17% | 2.59 | 0.082 |
| 2 | B′ | 0.99998 | 4 | 1 | 61 | 677 | 0 | 3.17% | 2.59 | 0.082 |
| 2 | B″ | 0.99611 | 647 | 464 | 8 + 4 handles | 141 | 0 | 1.29% | 1.58 | 0.052 |
| 3 | B | 1.00000 | 0 | 0 | 63 | 700 | 1 | 4.77% | 3.78 | 0.112 |
| 3 | B′ | 0.99998 | 9 | 0 | 58 | 647 | 0 | 4.77% | 3.78 | 0.112 |
| 3 | B″ | 0.99764 | 731 | 240 | 8 + 4 handles | 144 | 0 | 1.49% | 1.61 | 0.052 |

B″ at other weights, compared with its own sampled outline: 0.990 at weight 1, and at least 0.99 at weights 1.5, 2.5
and 4. These cases are tested.

The animation gain comes from the spine alone. B′ with the filleted spine would get the same animation numbers.

**Costs.** Brotli size of the geometry module on its own: B 620 B, B′ 763 B, B″ 1169 B. In the bundle, `bodymap`
(which carries CheckMark) grows from 33.94 kB to 34.67 kB, over its 34 kB limit. The branch raises that limit to 37 kB
in its own commit. `index` grows from 186.66 kB to 187.26 kB and `pages` from 59.1 kB to 59.8 kB; both are within
their limits.

## Renders

- `small-sizes-light.png` and `small-sizes-dark.png`: rows B, B′, B″; columns weight 2 at 24 px, weight 3 at 24 px,
  weight 2 at 32 px, weight 3 at 32 px. Supersampled 16× and magnified 8×.
- `{b,bprime,bpp}-w{2,3}-{24,32,2048}.png`: each candidate on its own.
- `diff-b-vs-bpp-w{2,3}-2048.png`: grey is both, red is only B, blue is only B″. The difference is a hairline along
  the tail sides.
- `apex-zoom-{b,bprime}-w{2,3}.png`: the loop, and its removal.
- `drawon-filmstrip-w3.png`: the top row is B's spine, the bottom row is B″'s, at p = 0.24, 0.27, 0.29, 0.30, 0.31,
  0.33, 0.36, 0.5 and 1.
- `drawon-steps-w{2,3}.png`: the reveal per frame, with B in red and B″ in blue. The step full height represents 5% of
  the mark.

## Recommendation

Take B″, which is all four commits.

- It removes the hidden loop.
- It keeps B's look: IoU 0.996 and 0.998 at 2048 px, and the 24 and 32 px renders are indistinguishable by eye.
- It cuts the path data per rendered check mark by 5×.
- It removes the apex pop from the draw-on: the spike drops from 3.8× to 1.6× at weight 3.

**Weaknesses.**

- B″ is a fitted approximation. It differs from B by up to 0.013 unit along the tail sides, and at weight 1 it sits
  right on the bar (0.990).
- It adds about 0.7 kB of brotli JS to every entry that carries CheckMark, which is why `bodymap`'s limit has to rise.
- The animation numbers come from my model of SVG stroking, not from a browser trace.
- The animation still has one uneven stretch. Just after the apex, the reveal rate dips to about 0.3% per frame, then
  steps back up near p = 0.42, because the wide mask has already uncovered the start of the tail. The fillet softens
  this but does not remove it (`drawon-steps-w3.png`).

If the JS cost matters more than DOM size, B′ plus the spine fillet keeps most of the benefit for about 0.15 kB:
drop commit 3 and its snapshot update.
