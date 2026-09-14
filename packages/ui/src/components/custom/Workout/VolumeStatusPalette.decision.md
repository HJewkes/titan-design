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

## Proposal — one status, existing tokens only

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

1. **Is brand orange the right "Target Met"?** It is the settled operator legend, but orange
   sitting between green and red reads as caution to some viewers. Swapping to green-is-target
   costs 1.1 ΔE and falls under the CVD floor, so the recommendation is to keep the legend order.
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
