# VelocityBandScale: Round 0 contract (VW-448, task 7, steps A and B)

Status: for owner confirmation before round 1. New files only; no existing component changes until
#269 merges and 0.21.1 is released (build plan s.3.2).

Sources: `voltras-workspace/sources/design/2026-09-19-vw-448-effort-resolver-design.md` s.2.3, s.3.2,
s.4.3; its amendment s.4 to s.6; `2026-09-20-vw-448-wiring-build-plan.md` s.3 and s.4; the as-built
resolver types in workout-analytics `src/effort/types.ts` (origin/main).

## 1. What the data means

One set, drawn as bars. Bar height is the measured mean concentric velocity of each rep. It is never
moved to a band edge. Bar colour is a band from 0 to 3 that the effort resolver decided upstream.
titan computes no loss and no band when a band scale is present.

The band means one of two things, and the scale says which:

- **`effort` (tier b, a trusted profile).** Absolute effort from the lifter's RIR-velocity line.
  Band 0 is RIR 2.5 or more, band 3 is under RIR 0.5. The green-to-red scale. RPE may be shown.
- **`velocity_loss` (tier a, no trusted profile).** Slowing, in thirds of the set's reference loss.
  It says nothing about effort. **No RPE anywhere** (owner ruling). The palette must not read as
  danger, so it is a separate single-hue palette (section 6).

Markers:

- **Goal.** A rep range is a zone on the rep axis: a tick before `repsLow`, the slots to `repsHigh`
  marked as the target zone, and a full line after `repsHigh`. Unperformed slots up to `repsHigh`
  show as empty places. A rep-count marker is **always neutral ink**: it targets no effort. An effort
  goal or a loss goal is a horizontal line.
- **Guards.** 0 to 2 horizontal lines in the resolver's tie order (effort first, then loss). An
  effort cap is coloured by the band of the effort it targets (RPE 9 is orange). **A loss guard is
  always neutral ink.** In tier a every line is neutral.
- **The cue.** Strictly one ending cue per set. The guard may fire before `repsLow`. The marker whose
  condition fired it is drawn solid and heavier; a condition that became true later is drawn solid
  without the extra weight. Reps after the cue are counted as a `+n` badge (round 2). Nothing ends the set.
- **A mid-set setting change** suspends the bands from that rep to the end of the set. Those bars
  draw neutral and dimmed, behind a labelled mark at the change (round 2); the rep count carries
  on, and an effort line keeps spanning the chart.
- **Low confidence.** A tier b reading outside the fitted RIR span keeps its band, drawn faded
  (round 2: faded fill only, no outline).

Resistance families reach titan only as data: chains and eccentric overload arrive as tier a
(`velocity_loss`, no RPE); damper as `velocity_loss` with a guard only for a typed percent;
isokinetic as `null` bands and no velocity line. titan needs no family field.

## 2. Considered existing

| Nearest                                                                                                                 | Decision                    | Why                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SetBarChart` (`custom/charts`): `computeBarLayout`, `renderReference`, `SetBarGeometry`                                | **Reused**                  | The overlay paints through `renderReference` and places its marks with the chart's own column maths and height scale, so a mark cannot drift off its bar. No bar drawing is duplicated.                                                                         |
| `VelocityLossBands` in `VelocityStrip.tsx` (washes and dashed VL lines from `best × (1 - pct)`)                         | **Extended later (step E)** | It is the hero's reference overlay and the natural home of `bandScale`. It computes loss itself and labels `VL n%` in titan, and #269 is editing the file, so this round builds beside it. Step E generalises its inputs to given velocities and caller labels. |
| `velocityLossBand` / `liveStripModel` / the `LiveBarColour` decision (bars by loss in thirds of a caller-supplied stop) | **Not suitable**            | They classify loss into bands inside titan. The resolver owns every band now, and the build plan forbids a second classifier (`rpeColor` and the resolver cut their edges differently). They stay for the no-`bandScale` path.                                  |

Also read: `GoalTrajectoryChartGeometry.ts` (the pure-geometry-module pattern this follows) and
`REJECTED.md` (Live bar colour v0 to v4: titan takes thresholds as given and never derives them; this
contract goes one step further and takes the bands as given).

## 3. Props sketch

```ts
type VelocityBandIndex = 0 | 1 | 2 | 3
type VelocityBandMeaning = 'effort' | 'velocity_loss'

type VelocityBandMarker =
  | {
      axis: 'rep'
      role: 'goal' | 'guard'
      condition: 'reps'
      repsLow: number
      repsHigh: number
      label: string
      reached: boolean
      firedCue?: boolean
    } // no colour field
  | {
      axis: 'velocity'
      role: 'goal' | 'guard'
      condition: 'effort' | 'velocity_loss'
      velocityMps: number | null
      band: VelocityBandIndex | null
      label: string
      reached: boolean
      firedCue?: boolean
    }

interface VelocityBandScale {
  meaning: VelocityBandMeaning // SetEffort.bandMeaning
  repBands: readonly (VelocityBandIndex | null)[] // reps[i].band
  repConfidence?: readonly ('high' | 'low' | null)[] // reps[i].confidence
  edgesMps?: readonly [number | null, number | null, number | null] // bandEdgesMps
  markers: { goal: VelocityBandMarker | null; guards: readonly VelocityBandMarker[] } // 0..2
  cue?: { atRep: number | null; repsPast: number; pastLabel?: string } | null // cue.reachedAtRep, repsPastCue
  settingChangedAtRep?: number | null // pinned-context rep, from voltras-mcp
  settingChangedLabel?: string
}
```

Every `label` is supplied by the caller (the SPA's one copy table). The mapper from `SetEffort` is a
field copy, plus `firedCue = marker.condition === cue.reason` and the labels.

New in this PR, all under `custom/Workout`, none in the barrel yet:

- `VelocityBandScale.ts`: the types above.
- `velocityBandGeometry.ts`: `velocityBandGeometry(scale, layout)`, pure, no colour. Also
  `bandSlotCount`, `barTone`, `lineBand` (the colour rule: tier a all neutral, loss guard neutral).
- `VelocityBandOverlay.tsx`: paints the geometry from `renderReference`, an under layer (zone
  tint) and an over layer (lines, labels, `+n`, marks). `treatment` holds only the options still
  open after round 2 (the zone style).
- `VelocityBandPreview.tsx`: `SetBarChart` plus the overlay, for stories only until step E.

## 4. Fixtures

`velocityBandScale-fixture.ts`, hand-copied from resolver output for one tier b profile (0.30 m/s at
RIR 0, 0.06 m/s per RIR) and ten reps slowing from 0.66 to 0.40 m/s: tier b 8 to 12 with an RPE 9
cap; tier a with a planned VL 30% guard that fired on rep 8, two reps past; tier b with both guards;
tier b two reps past a rep-count cue; tier a `target_rpe` falling back to reps, with the hero
eyebrow `RPE 8 · 8-12 reps` (round 2; the separator is a round 3 question); tier b low
confidence on the last two reps; tier b with a setting change on rep 6; tier a with no loss number;
and the degenerate **no reps yet** set. Geometry tests add: an unmeasured plot, a line above the
plot (clamped), a loss line with no best rep yet (not drawn), three guards (two drawn), an inverted
range, and two crowded labels.

## 5. The four states

| State    | Applies? | What draws                                                                                        |
| -------- | -------- | ------------------------------------------------------------------------------------------------- |
| Loading  | No       | The overlay has no fetch; the chart's owner shows its own skeleton.                               |
| Empty    | Yes      | No reps yet: the zone and the empty places draw, no lines (a loss line has no best rep), no bars. |
| Error    | No       | No I/O. Malformed input degrades: a non-finite line is skipped, guards past two are ignored.      |
| Disabled | No       | Not interactive; the overlay is hidden from screen readers and the chart carries the one label.   |

## 6. Token proposal: the tier a palette

No single-hue sequential token exists. `dataviz-sequential-*` is the effort ramp (green to red), so
it carries the meaning tier a must avoid. Proposed: **`dataviz-slowing-0` to `dataviz-slowing-3`**,
one hue, four steps, band 0 (fastest) to band 3 (at the reference loss), dark and light columns. The
round shows two candidate hues built from existing `primitiveRamps` steps in a Lab story, beside the
tier b palette and the traffic-light alternative the design did not recommend. The owner picks; the
four-file token chain lands in the integration PR, not here.

## 7. What waits

Wiring `bandScale` into `VelocityStrip`, `VelocityHero`, `LiveFatiguePanelVelocity`,
`PinnedLiveStrip` and each `DualVelocityStream` wing; the RPE readout colour from `set.band`; the
`rpeColor` edge move; the token chain; the 0.22.0 release. All after #269 and 0.21.1 (step E).
