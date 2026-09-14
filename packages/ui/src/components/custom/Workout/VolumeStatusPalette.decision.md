# Unified volume-status palette — decision brief (VW-333 phase 1, TITAN-E-01)

Story: `Lab/Decisions/Volume Status Palette` — `lab-decisions-volume-status-palette--compare`.
Phase 1 is evidence only. No token, component API or baseline changes here; phase 2 lands the
approved palette, retires the heatmap path and adds the ratchet + Layer-1 visual.

## The defect

Two unions, both named `VolumeStatus`, both reachable, overlapping only on `'over'`. The same
muscle renders one hue on the figure and a different hue on the chip.

- Taxonomy B (figure): `muscleTaxonomy.ts:191`, consumed by `BodyMap`, `BodyMapDetailPanel`,
  `TrainingStatusPage`, `VolumeLandmarkBar`.
- Taxonomy A (chip): `MuscleGroupChip.tsx:6`, exported from the root barrel.
- `WorkoutCard.tsx:52` already hand-writes the bridge — `under -> behind`, `maintenance -> ontrack`, `productive -> target` — so A was designed as the alias layer over B and never wired as one.

## Current mapping — figure (taxonomy B)

`getHeatmapColor` (`muscleTaxonomy.ts:213`) resolves through `WORKOUT_TOKENS.heatmap`
(`theme/workout-tokens.ts:28`), which is the `divergingScale` primitive
(`theme/tokens/primitives.ts:321`).

| status                          | token                                | hex       |
| ------------------------------- | ------------------------------------ | --------- |
| no data (`null`/`undefined`)    | `heatmap.none` — a literal, no token | `#E0E0E0` |
| `under`                         | `divergingScale[0]` = `blue-500`     | `#2196F3` |
| `maintenance`                   | `divergingScale[1]` = `cyan-300`     | `#22D3EE` |
| `productive`                    | `divergingScale[2]` = `green-200`    | `#58F69E` |
| `productive`, intensity >= 0.85 | `divergingScale[3]` = `amber-300`    | `#F9B415` |
| `over`                          | `divergingScale[4]` = `red-600`      | `#D14343` |

Theme-independent: these are literal hexes, not `var()` tokens, so the figure renders the same
in light and dark. `VolumeLandmarkBar.tsx:47` reuses the same six values.

## Current mapping — chip (taxonomy A)

`MuscleGroupChip.tsx:15` maps each status to a `PillTone`; `Pill.tsx:109` maps the tone to a
semantic token. These are className tokens, so they do flip with the theme.

| status      | PillTone          | token                          | hex (dark) | hex (light) |
| ----------- | ----------------- | ------------------------------ | ---------- | ----------- |
| `untrained` | `neutral`         | `text-tertiary`                | `#888684`  | `#A29F9D`   |
| `behind`    | `brand-secondary` | `brand-secondary` = `cyan-600` | `#307B9B`  | `#307B9B`   |
| `ontrack`   | `success`         | `status-success` = `green-300` | `#2ED573`  | `#2ED573`   |
| `target`    | `brand`           | `brand-primary` = `orange-400` | `#FF7900`  | `#FF7900`   |
| `over`      | `error`           | `status-error` = `red-600`     | `#D14343`  | `#D14343`   |

Note: FAMILY-E-SPEC.md:95 records the "before" hexes as `#4A90D9/#F5C842/#4CAF50/#FFA502/#FF6B35`
(figure) and `#2C2C2C/#406D87/#14B8A6/#FF7900/#D14343` (chip). Neither matches what the code
renders today — the tables above are measured from the current source, not the spec.

## Is `divergingScale` theme-aware?

**No.** It is a plain array of literal hexes in `primitives.ts:321`, consumed as literals through
`WORKOUT_TOKENS.heatmap`. Nothing about it is `var()`-backed, so the figure paints identically in
light and dark — which is why the light-mode figure has no light-mode answer today.

Four of its five entries have an exact SEMANTIC twin, so a ladder can quote the scale and stay
theme-aware: `ds[0]` = `status-info`, `ds[2]` = `status-success-light`, `ds[3]` =
`status-warning`, `ds[4]` = `status-error`. Only `ds[1]` (`cyan-300`) has no fill-role token —
its one semantic use is `on-brand-secondary-subtle`, a text role. Row C of the story prints
`= ds[n]` beside every value that matches, computed at render rather than asserted.

Today every `status-*` token holds the same hex in both themes, so a ladder built from them
resolves identically light and dark. The one rung that really moves is `untrained`
(`text-tertiary`: `#888684` dark, `#A29F9D` light).

## The three candidate ladders

| rung          | B (5)                 | B2 (6)                         | B3 (6)                                  |
| ------------- | --------------------- | ------------------------------ | --------------------------------------- |
| `untrained`   | `text-tertiary`       | `text-tertiary`                | `text-tertiary`                         |
| `behind`      | `status-info`         | `status-warning` = ds[3]       | `cyan-300` = ds[1] **NEW TOKEN NEEDED** |
| `ontrack`     | `status-success`      | `status-info` = ds[0]          | `status-success`                        |
| `target`      | `brand-primary`       | `status-success-light` = ds[2] | `status-success-light` = ds[2]          |
| `approaching` | — folds into `target` | `brand-primary`                | `brand-primary`                         |
| `over`        | `status-error`        | `status-error` = ds[4]         | `status-error` = ds[4]                  |

B2 needs **no new token**: four of its six rungs are `divergingScale` entries quoted through their
semantic twins. B3 needs one, because `cyan-300` has no fill-role token. `brand-primary` (orange)
is not a `divergingScale` entry at all — the scale's warm side is `amber-300`, a gold, which B2
spends on `behind`.

### Measured (the story prints these live, under each row)

| ladder | min adjacent ΔE | min all-pairs ΔE              | vs floor 8           |
| ------ | --------------- | ----------------------------- | -------------------- |
| B      | 8.3             | 8.3 (`ontrack`/`target`)      | pass                 |
| B2     | 15.3            | **8.7** (`untrained`/`over`)  | pass — best of three |
| B3     | 10.0            | 8.3 (`ontrack`/`approaching`) | pass                 |

Adjacent-pair ΔE, dark mode:

- **B** — untrained→behind 16.7 · behind→ontrack 27.9 · ontrack→target 8.3 · target→over 15.3
- **B2** — untrained→behind 22.6 · behind→ontrack 32.0 · ontrack→target 32.4 · target→approaching 16.0 · approaching→over 15.3
- **B3** — untrained→behind 18.6 · behind→ontrack 16.0 · ontrack→target 10.0 · target→approaching 16.0 · approaching→over 15.3

Contrast of each fill against the figure's outline fill (`alpha(white, 0.08)` over the panel
plane, dark = `#3D3B39`):

- **B** — untrained 3.07 · behind 3.57 · ontrack 5.78 · target 4.24 · over 2.44
- **B2** — untrained 3.07 · behind 6.14 · ontrack 3.57 · target 8.01 · approaching 4.24 · over 2.44
- **B3** — untrained 3.07 · behind 6.17 · ontrack 5.78 · target 8.01 · approaching 4.24 · over 2.44

`over` is the weakest fill on the figure in every ladder (2.44:1) — `status-error` is a dark red
on a dark plane. That is true of the palette shipping today too.

### Variants measured and rejected

- **A truer yellow for B2.** `amber-200` (`#FFD352`) instead of `status-warning` drops the ladder
  to 8.4 and `amber-100` to 1.6 — the yellower it gets, the closer it sits to the green. The gold
  is both safer and already a token, so B2 uses `status-warning`.
- **A steel blue for B3.** `brand-secondary` (`cyan-600`) is the genuine steel blue, but it lands
  7.4 against `untrained` grey, under the floor. `blue-700` clears CVD at 8.3 but contrasts
  1.62:1 against the outline fill, so it barely reads as a fill. `cyan-300` is the one cold value
  that clears both, and it is `ds[1]`.
- **Two greens split by lightness.** `status-success-dark` as the second green collides with
  `status-error` under deuteranopia (ΔE 4.9) — a dark green and a mid red are the classic
  confusion. B3's two greens are therefore the light pair (`green-300` / `green-200`, ΔE 10.0).

## Ladder B in detail — one status, existing tokens only

Keep taxonomy A's five members (they match the settled operator legend verbatim), rename B to
`VolumeLandmarkZone`, and key every surface off this table.

| status      | landmark zone | token            | primitive    | hex                              |
| ----------- | ------------- | ---------------- | ------------ | -------------------------------- |
| `untrained` | 0 sets logged | `text-tertiary`  | grey ramp    | `#888684` dark / `#A29F9D` light |
| `behind`    | below MEV     | `status-info`    | `blue-500`   | `#2196F3`                        |
| `ontrack`   | MEV - MAV     | `status-success` | `green-300`  | `#2ED573`                        |
| `target`    | MAV - MRV     | `brand-primary`  | `orange-400` | `#FF7900`                        |
| `over`      | above MRV     | `status-error`   | `red-600`    | `#D14343`                        |

Every value is an existing semantic token and an existing `PillTone`, so no new hex and no new
token is needed — the "minimum token addition as a labelled OPTION" clause in the brief does not
apply.

**Cost of landing it.** The chip moves by exactly one tone: `behind` from `brand-secondary` to
`status-info`. Everything else is the figure adopting the chip's palette.

### Why this set

Worst-case deuteranopia/protanopia ΔE across the five, using the same Machado-2009 + OKLab metric
as `primitives.test.ts:44`:

| palette                                                   | min CVD ΔE | binding pair          |
| --------------------------------------------------------- | ---------- | --------------------- |
| proposed                                                  | **8.3**    | `ontrack`/`target`    |
| figure today (`divergingScale` + `none`)                  | 7.5        | `none`/`productive`   |
| chip today (dark)                                         | 7.4        | `untrained`/`behind`  |
| alternative: green-is-target (`warning`/`info`/`success`) | 7.2        | `behind`/`target`     |
| alternative: keep `brand-secondary` for `ontrack`         | 7.4        | `untrained`/`ontrack` |

The proposal is the only token-only candidate that clears the repo's categorical CVD floor of 8
(`primitives.test.ts:110`), and it beats both palettes it replaces.

## Open questions

1. **B, B2 or B3?** B2 measures best (8.7) and matches the stated preference — blue for on track,
   green for met, yellow for behind, orange for approaching, red for over — and needs no new
   token. B3 keeps a cold `behind` but needs one new fill-role token for `cyan-300`. B is the
   five-value ladder and has no home for `approaching`.
2. **Where does `approaching` go?** `getHeatmapColor` swaps `productive` for `amber-300` above
   intensity 0.85 — a sixth rendered colour the five-value status cannot name. Fold it into
   `target` and lose the near-MRV warning, or move it to a non-hue channel (glow radius, dashed
   edge, pattern)?
3. **How should the figure paint `untrained`?** Today a muscle with no data is simply absent from
   `BodyMap`'s `data` and takes the outline fill. DECOMPOSITION.md:136 proposes a grey fill
   instead. Keep the outline, or paint `text-tertiary`?

## Notes found while building the story

- `BodyMap`'s outline fill and border are `alpha(white, 0.08)` / `alpha(white, 0.12)`
  (`BodyMap.tsx:34`), so the figure is dark-only. In light mode the untrained silhouette renders
  near-black. Out of scope for VW-333, but it lands on the same surfaces.
- `BodyMap` takes no fill override, so row B renders a story-local clone of the
  `react-native-body-highlighter` SVG with the same scale, default fill and border. The proposed
  chips need no clone — they are the same `Pill` primitive with a different `dotTone`.
- `heatmap.none` is a raw literal, not a token. Whatever `untrained` resolves to in phase 2
  should retire it.
