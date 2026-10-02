# ConfidenceBadge: Round 0 contract (VW-786, VW-161 S1)

Status: **awaiting Gate 1.** The owner records the invest decision and confirms this contract,
including the five owner questions at the end, before any styling round (S2, VW-787). Every answer
below the questions is written on their recommended defaults.

Fixtures: [`confidenceFixtures.ts`](./confidenceFixtures.ts).

## 1. What the data means

A value whose trustworthiness varies travels with one or more confidence readings in the same
response (voltras-mcp VW-124, VW-151). Each reading grades **one named axis** at one of three
levels (`high`, `medium`, `low`) and carries two lifter-facing sentences: why confidence is what it
is right now (`userMessage`), and what would raise it (`improvementPath`). Both are populated at
every level, so "why you can trust this" is as available as "why you can't". `reasoning` is
internal and is never rendered.

The first consumer is `vbt.rir`, which grades one RIR estimate on three independent axes:

| Wire key           | Axis                | Moves when                                                           | Changes per |
| ------------------ | ------------------- | -------------------------------------------------------------------- | ----------- |
| `modelCalibration` | `model-calibration` | the shipped model is calibrated, or the lifter's own curve is fitted | model       |
| `inputDomain`      | `input-domain`      | the rep sits inside the range the model was fitted over              | rep         |
| `baselineMaturity` | B57 gate verdict    | the lifter logs more qualifying sets on this exercise                | lifter      |

The axes have different causes and different fixes, so they are **never collapsed** into one score.
A badge row shows three readings side by side even when they disagree, and it computes no overall
level.

`baselineMaturity` is not a `ConfidenceIndicator`. It is B57's `FeatureGateVerdict`, which has an
`activation` (`full`, `degraded`, `withheld`) instead of a `level`, no `improvementPath`, and an
`evaluable` flag. `evaluable: false` means "we never looked" (no baseline row exists) and must never
read the same as `COLD` ("we looked, not enough yet"), although both are `withheld`.

## 2. Considered existing (Gate 1 overlap survey)

| Component                                 | Decision           | Why                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TipTrigger` (`ui/tooltip`)               | **Compose**        | Already owns one open state for hover (web), focus (keyboard) and press (native), dismissal on Escape, blur, hover-out and outside press, and `aria-describedby` while open. `PinnedTipContext` pins tips open for captures. A tip fix belongs there. |
| `Pill` (`ui/pill`), `Badge` as its preset | **Compose `Pill`** | `leading="dot"` with `dotTone` is the "neutral label, only the dot carries status" pattern. `Badge` tints the label by `color`, and the light-mode subtle tints fail AA (section 5). `ui/README.md` forbids drawing a second capsule.                 |
| `FatigueLights` (`custom/Fatigue`)        | **Do not reuse**   | The nearest "three readings side by side, never one score" row, so it is the visual precedent. It is fatigue-domain, its tips carry one string rather than two, and it uses plain `Tooltip`, which has no keyboard open.                              |

Also considered:

- `HelpTip` (`ui/help-tip`): deprecated in favour of `Tooltip`. Ruled out.
- `custom/Workout/GoalCard`: already wraps a `Pill` in a `TipTrigger`, the same composition. It is
  the precedent, not a reuse target.
- The effort-bands lab (`Lab/Decisions/Effort Bands`, VW-448 round 2) decided that a low-confidence
  **chart mark** is only faded; the dashed outline was rejected (`REJECTED.md`, 2026-09-21). That
  decision covers marks inside a chart. A badge is a separate surface, so the two do not conflict and
  should not be merged.
- `REJECTED.md` has no entry for a confidence badge, tooltip or pill direction.

Outcome: one new `ui/` molecule and two `custom/Workout/` adapters. No new primitive, no new token,
no change to an existing component.

## 3. Props sketch (names and types only)

The props match the voltras-mcp `ConfidenceIndicator` wire shape exactly, so a consumer spreads the
wire object with no remapping.

```ts
// ui/confidence-badge/ConfidenceBadge.tsx
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ConfidenceBadgeProps {
  axis: string // wire: always named, never implied
  level: ConfidenceLevel // wire
  userMessage: string // wire: tip body
  improvementPath?: string // wire: tip second paragraph; optional only for the B57 adapter
  reasoning?: string // wire: accepted so the object spreads in; never rendered
  axisLabel?: string // default: `axis` humanised ("model-calibration" -> "Model calibration")
  levelLabel?: string // default: High / Medium / Low
  size?: 'sm' | 'md'
  placement?: TooltipPlacement
  className?: string
  testID?: string
}

// usage, verbatim wire object
<ConfidenceBadge {...result.confidence.modelCalibration} axisLabel="Model" />

// custom/Workout/BaselineMaturityBadge.tsx: structural subset of FeatureGateVerdict
export interface BaselineMaturityVerdict {
  evaluable: boolean
  activation: 'full' | 'degraded' | 'withheld'
  userMessage: string
  reasoning?: string
}
export interface BaselineMaturityBadgeProps {
  verdict: BaselineMaturityVerdict
  axisLabel?: string
}

// custom/Workout/RirConfidenceRow.tsx: vbt.rir's `confidence` object as sent
export interface RirConfidence {
  modelCalibration: ConfidenceBadgeProps
  inputDomain: ConfidenceBadgeProps
  baselineMaturity: BaselineMaturityVerdict
}
export interface RirConfidenceRowProps {
  confidence: RirConfidence
  className?: string
}
```

`BaselineMaturityBadge` maps `activation` to a visual level only (full is high, degraded is medium,
withheld is low); the types stay separate. `evaluable: false` keeps the low tone, shows the level
word "Not assessed", and its tip carries the verdict's own no-baseline message.

## 4. Fixtures

`confidenceFixtures.ts` mirrors the wire types field for field and copies the user-facing strings
verbatim from voltras-mcp (`src/store/confidence-indicator.ts`, `src/store/baseline-gate.ts`).

| Group              | Fixtures                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Model calibration  | `modelCalibrationLow` (placeholder profile), `modelCalibrationMedium` (fitted, error over 1.5 reps), `modelCalibrationHigh` (fitted, trusted)          |
| Input domain       | `inputDomainHigh`, `inputDomainMedium`, `inputDomainLow`                                                                                               |
| Baseline maturity  | `baselineCalibrated` (full), `baselineProvisional` (degraded), `baselineShapeOnly`, `baselineStale`, `baselineCold` (withheld), `baselineNotEvaluable` |
| Three-axis results | `rirConfidenceDisagreeing` (low, high, medium: the canonical row), `rirConfidenceAllHigh`, `rirConfidenceNotAssessed`                                  |
| Degenerate         | `longMessageIndicator` (300-character `userMessage`), `emptyImprovementPathIndicator`, `unknownAxisIndicator` (`foo-bar`), `narrowRowWidthPx` (320)    |
| Owner defaults     | `rirAxisLabels`, `improvementHeading`, `levelLabels`, `notAssessedLabel`                                                                               |

Correction to the VW-161 plan: the plan lists SHAPE_ONLY and STALE as `degraded`. For the
`rir-estimate` feature, which is the one `vbt.rir` grades, degraded needs PROVISIONAL (rank 2), so
SHAPE_ONLY and STALE (rank 1) are **withheld**. They are degraded only for `readiness-score`. The
fixtures follow the server's derivation, so the degraded baseline fixture is PROVISIONAL.

## 5. Colour per level and printed contrast

The level is carried three ways: the level **word** in the label, the dot's hue, and the tip text.
Colour is never the only carrier (WCAG 1.4.1).

| Level  | Dot (`Pill dotTone`)            | Label text                              | Capsule fill                                 |
| ------ | ------------------------------- | --------------------------------------- | -------------------------------------------- |
| high   | `success` (`bg-status-success`) | `text-text-primary` via `textClassName` | `Pill` subtle neutral (`bg-hairline-subtle`) |
| medium | `warning` (`bg-status-warning`) | same                                    | same                                         |
| low    | `error` (`bg-status-error`)     | same                                    | same                                         |

Measured WCAG 2.1 contrast from `theme/global.css` at `16766f24`, with the alpha capsule fill
composited over each plane. Bold marks a failure (4.5:1 for text, 3:1 for a graphic).

**Label (`text-primary`) on the capsule: passes AA on every plane.**

| Plane              | Dark  | Light |
| ------------------ | ----- | ----- |
| `background-base`  | 12.19 | 13.01 |
| `surface-base`     | 10.68 | 15.48 |
| `surface-elevated` | 9.70  | 14.39 |
| `surface-raised`   | 8.93  | 12.95 |
| `surface-overlay`  | 8.20  | 15.48 |

**Why not Pill's own neutral label (`text-secondary`):** 3.36 to 4.99 dark and 3.47 to 4.15 light,
so it fails 4.5:1 on most planes at `text-2xs` and `text-xs`. The badge overrides the label to
`text-primary`.

**Why not the tinted subtle Pill:** `on-status-*-subtle` on `status-*-subtle`.

| Tone    | Dark (by plane)  | Light (every plane) |
| ------- | ---------------- | ------------------- |
| success | 5.00 to 7.29     | **1.82**            |
| warning | 5.20 to 7.58     | **1.69**            |
| error   | **3.90** to 5.65 | **4.24**            |

**Dot (a non-text graphic) against the capsule fill it sits on:**

| Plane              | Dark success | Dark warning | Dark error | Light success | Light warning | Light error |
| ------------------ | ------------ | ------------ | ---------- | ------------- | ------------- | ----------- |
| `background-base`  | 6.80         | 7.23         | **2.87**   | **1.42**      | **1.34**      | 3.36        |
| `surface-base`     | 5.96         | 6.34         | **2.52**   | **1.69**      | **1.59**      | 4.00        |
| `surface-elevated` | 5.41         | 5.75         | **2.28**   | **1.57**      | **1.48**      | 3.72        |
| `surface-raised`   | 4.98         | 5.30         | **2.10**   | **1.41**      | **1.33**      | 3.34        |
| `surface-overlay`  | 4.58         | 4.86         | **1.93**   | **1.69**      | **1.59**      | 4.00        |

Against the bare plane (no capsule fill) the dot reads 6.25 to 9.64 (success, warning) and 2.64 to
3.83 (error) in dark, and 1.51 to 1.93 (success, warning) and 3.81 to 4.57 (error) in light.

Correction to the VW-161 plan: it reports the dot against the bare plane and says all three tones
pass 3:1 in dark mode. Against the capsule fill, which is the adjacent colour, the dark error dot
fails on every plane (1.93 to 2.87), and it fails on the bare `surface-raised` and
`surface-overlay` planes as well (2.88, 2.64).

The dot is redundant with the level word, so WCAG 1.4.11 does not bind it. This follows the owner's
standing preference for vivid chroma over contrast floors when the failure is printed: these tables
are that printing, and the S2 story docs repeat them. The low dot in dark mode is the weakest signal
in the set; Q1 is where the owner can change it.

Out of scope (a titan defect to file separately, not part of VW-161): the light-mode subtle Pill
tones above and the light-mode solid success and warning labels fail AA, and
`theme/solid-label.test.ts` checks `semanticColorsDark` only.

## 6. The four states (`docs/component-states.md`)

| State    | Applies?                                                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading  | No. The indicator travels in the same response as the value (VW-124), so there is never a badge without data.                                                              |
| Empty    | No for `ConfidenceBadge`: its props are required, and a consumer with no reading renders nothing. `RirConfidenceRow` requires all three axes, as the wire sends all three. |
| Error    | No. Nothing is fetched.                                                                                                                                                    |
| Disabled | No. The badge is informational; its only interaction reveals the tip.                                                                                                      |

Baseline "Not assessed" (`evaluable: false`) is a distinct visual state with its own story and test.

## 7. API design note (generic `ui/` component)

- **Placement.** `ui/confidence-badge/`. The props are a free-string axis, a level and two messages;
  none names a domain concept, so the placement table lands it in `ui/`. The two adapters name RIR
  and B57's gate vocabulary, so they go in `custom/Workout/`.
- **Props.** Section 3. The wire object spreads in unchanged; `axisLabel` and `levelLabel` are the
  consumer's wording slots. Structural types accept the wire object's extra fields, because a
  consumer passes a variable, not a literal. When a voltras consumer lands, it adds a one-line
  type-conformance assertion against `ConfidenceIndicator` and `FeatureGateVerdict` in voltras-mcp.
- **State.** Uncontrolled. The only state is the tip's open flag, which `TipTrigger` owns. No
  `open` / `defaultOpen` / `onOpenChange` until a consumer needs it.
- **Composition slots.** None beyond the two label strings. The tip layout is fixed anatomy:
  `userMessage` as body (`text-text-primary`), then, when `improvementPath` is non-empty, an overline
  (Q5) and the path in `text-text-secondary`.
- **Accessibility pattern.** WAI-ARIA **Tooltip** pattern on a button trigger. One Tab stop per
  badge. Focus or hover opens the tip; Escape, blur or hover-out closes it. Accessible name
  `"{axisLabel} confidence: {levelLabel}"` (for example "Model confidence: Low"). `aria-describedby`
  points at the open tip, so a screen reader announces both messages on web. On native, the name
  carries axis and level and the messages are one press away. Native press opens the tip and does not
  toggle it shut; the functional gate checks close-on-native, and any fix goes to `TipTrigger`.
- **Row.** `RirConfidenceRow` is `role="group"` named "RIR confidence" (not `role="list"`, which axe
  flags under RNW without list items). Three Tab stops in wire order; no roving focus at three stops.
  It wraps (`flex-row flex-wrap`) rather than truncating a badge, down to 320 px.
- **Virtualization.** None. At most three badges per row.
- **Where the logic lives.** Two pure exported functions, tested directly: `confidenceTone(level)`
  (level to dot tone) and the axis humaniser. The B57 adapter's `activation` to level map is a third.
  No className assertions, because NativeWind compiles them away.
- **Composes.** `Pill`, `TipTrigger`, `Typography`.

## Owner questions (Gate 1), with the defaults this contract is written on

1. **Tone for `low`.** Default: **an error-red dot on the neutral capsule.** Model calibration reads
   low on every profile-estimate set, so the low dot will be common. The alternative, a warning dot
   for both medium and low, loses the distinction between them.
2. **Visible text.** Default: **axis plus level ("Model · Low").** Three level-only badges would be
   indistinguishable without a hover, which breaks "axis always named, never implied".
3. **Axis names in the RIR row.** Default: **"Model", "This rep" and "Your baseline".** The wire names
   are engineering words.
4. **`improvementPath` copy that names MCP tools in backticks** (for example "Re-run
   `rir_velocity.fit`"). Default: **titan renders it verbatim**, with no remapping. The wall consumer
   task asks voltras-mcp for lifter-facing copy before it ships.
5. **Tip second-paragraph heading.** Default: **the overline "How this improves".**
