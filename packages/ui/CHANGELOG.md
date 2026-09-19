# Changelog

All notable changes to `@titan-design/react-ui` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Loss-coloured bars band on the exact loss from the set's best, not on the loss
  rounded to a whole percent. This applies to `VelocityStrip` (every variant),
  `DualVelocityStrip` and `PinnedLiveStrip`, which share `velocityLossForRep`.
  With thresholds `[6.7, 13.3, 20]`, a rep at 13.33 percent now reads orange, as
  the consumer's unrounded check does; 0.20.0 banded it as 13 and read yellow. A
  loss equal to a threshold takes the higher band. **Bars within half a percent
  of a band edge can change colour against 0.20.0.** `velocityLossForRep` now
  returns the unrounded loss. The rule on every surface: **colour follows the
  exact loss; the number shown is the exact loss rounded down**
  (`shownVelocityLoss`), so a number never reads at or past a threshold the
  colour has not reached. With thresholds `[6.7, 13.3, 20]`, a 19.96 percent
  loss reads "Loss: 19%" beside an orange bar, and 20.0 reads "20%" beside a
  red one. `VelocityStrip`'s "Loss" text and `PinnedLiveStrip`'s accessible
  name can therefore read one percent lower than 0.20.0, which rounded.
  `calculateVelocityLoss` is unchanged and still rounds.
- `PinnedLiveStrip` without `onPress` is no longer a link: it has no link role,
  no "Back to live" button and no chevron, and reads as a labelled status region
  (`accessibilityRole="summary"`, a `region` on the web). Its accessible name
  drops the "Back to live:" prefix. **Pass `onPress` to keep the 0.20.0 look.**
- `GoalTrajectoryChart`, calibrating state: the note fits the chart. It wraps to
  at most two lines and stays inside the hatched weeks, at their lower-right
  corner or else their upper-right one, clear of the readings, the line between
  them, the next-target dot and the dashed ramp. When the hatch has no room for
  the whole block (a late reading, a narrow phone), the note and its explanation
  move to a caption under the plot, and a note longer than two caption lines
  ends in an ellipsis. An empty or blank `calibratingNote` falls back to "No band
  yet". The default note on an early-block goal renders as in 0.20.0.

### Fixed

- `PinnedLiveStrip`: a non-finite `restRemainingMs` (NaN, Infinity or
  undefined) reads "0s" in the numeral and the accessible name instead of
  "NaNs", and a non-finite or non-positive `restDurationMs` draws no time bar.
- `PinnedLiveStrip`: a zero, negative, fractional or non-finite `targetReps` no
  longer gives the bar frame a negative or NaN width. The strip draws the whole
  reps of a fractional target; without a usable target it draws the reps done,
  reads "4" rather than "4/0", and names "4 reps".
- `PinnedLiveStrip`'s accessible name now carries what the strip shows only in
  colour: it opens with the state ("Live set" or "Resting") and ends with the
  last rep's velocity, its loss from the set's best (rounded down), and
  "fatigued" when the strip shows fatigue. The visible text is unchanged.
- `PinnedLiveStrip` without a `layout` prop no longer paints the wall form for
  one frame on a phone. It keeps its measuring frame mounted and draws nothing
  in it until it has measured itself: on the web before the first paint, on
  React Native at the first `onLayout` (so the first frame is empty).
  Server-rendered HTML carries only the empty frame, and the strip appears once
  the client measures it. Passing `layout` draws at once, as before.
- `PinnedLiveStrip` no longer redraws its bar plot on every rest tick. The plot
  redraws only when `reps` (by identity), `targetReps`, the thresholds (by value)
  or the layout change.
- `GoalCard` title: one long unbroken token (pasted garbage, not a real name)
  breaks inside the card instead of pushing past its edge, and a four-line
  safety clamp stops a runaway string growing the card. No real exercise name
  reaches four lines; names still wrap and are not truncated. `GoalLiftCard`
  and `PrimaryGoalCard` inherit it.
- `GoalTrajectoryChart`, calibrating state: the accessible name now carries the
  note, whole even where the drawn note is cut, and says the line is the planned
  ramp from the start lift, not an expected band.
- `GoalTrajectoryChart`: a `calibratingNote` that opens with the status label
  ("Calibrating") logs a development-only console warning, since the card's
  pill already says it. The note still draws as given; production builds skip
  the check.


## 0.21.0

### Added

- `tokens.css` and its generator now carry depth and material values for plain-HTML
  consumers: `--elevation-1..5-surface` (aliases onto the surface tokens),
  `--lift-1..5`, `--material-paper-grain`, `--material-paper-shadow`,
  `--material-inset-shadow` and `--glow-tight|subtle|medium|strong`. A glow is brand
  primary by default; set `--glow-rgb` on an element to retint it. Each value is
  read from `lift`, `elevation`, and `materials`, so a retune there reaches the CSS.
- New package entries `@titan-design/react-ui/theme/tokens-css` (the
  `generateTokensCss()` function, loadable in plain Node) and
  `@titan-design/react-ui/tokens.css` (the built stylesheet).

### Fixed

- `dist/tokens.css` was missing from every published tarball: `prepublishOnly` re-ran
  `tsup`, which cleans `dist/`, without re-running the CSS codegen. It now runs the
  full build.

## 0.20.0

### Changed

- `GoalTrajectoryChart`, calibrating state (VW-433): readings are plain dots with
  no PR star on the chart, the next target is a hollow dot with no dashed run,
  the programmed ramp is a dashed unlabelled line (only a zero-width ramp is
  dashed; a band with area never is), and the weeks after the latest reading are
  hatched with a short note in their lower-right corner. Every other status
  renders exactly as before. **Consumers will see a visual change** on
  calibrating goals. The rejected treatments are in `REJECTED.md`.
- `GoalCard` at narrow widths (VW-432): when the name does not fit beside the
  priority icon, PR star and status badge, the marks drop to a left-aligned row
  under the name first, and then the name wraps. It is never truncated: the full
  title no longer has a two-line clamp. Wide layouts are pixel-identical.
  `GoalLiftCard` and `PrimaryGoalCard` inherit it.
- `PinnedLiveStrip` now colours bars by loss from the set's best by default
  (`barColor="loss"`), the same as the live hero (VW-429 colour round). The
  0.19.0 behaviour, per-rep zone colour, is `barColor="zone"`. The last-rep
  velocity follows the same colour.
- `PinnedLiveStrip` wall row: the "Reps" / "Rest left" and "Last rep" overlines
  share one line above the numerals and clear the strip's top edge. The bars are
  taller (wall 40 to 48px, phone 26 to 32px) and still stand on the shared
  baseline.
- `VelocityStrip`'s "Loss" text turns orange and red at the same thresholds as
  the bars (it used fixed 20 and 25 percent cut-offs).
- `LiveStripRep.zone` is optional. Under `barColor="zone"` a rep without a zone
  falls back to its loss colour.
- `VelocityLossBands`: when the amber and red decision lines sit closer than a
  label height, only the red (stop) line is labelled.

### Added

- `GoalTrajectoryChart` `calibratingNote`: the first line of the calibrating
  note, supplied by the consumer (default "No band yet"). The chart never
  states a session count of its own and never repeats the status word.
- `lossThresholds` (`[yellow, orange, red]` loss %, default `[10, 20, 30]`) on
  `VelocityStrip`, `VelocityHero`, `LiveFatiguePanel` (`velocity.lossThresholds`)
  and `PinnedLiveStrip`. It moves the bar colour bands and the hero's amber and
  red decision lines. Pass the same thresholds to the strip and the hero and
  their bars match. titan does not derive them; the caller does. Parity holds on
  dark surfaces; in light mode the hero's fixed colours and the strip's theme
  tokens still differ.
- `DualVelocityStrip` takes `lossThresholds` and passes it to both wings in every
  variant.
- `normalizeLossThresholds`: thresholds are taken as three finite numbers,
  clamped to 0..100 and sorted; anything else falls back to 10/20/30 with a
  dev-only warning. Every surface applies it, and a 0 percent loss is always
  green.
- Exported from the barrel: `VelocityLossThresholds`, `VelocityLossBand`,
  `velocityLossBand`, `velocityLossForRep`, `getVelocityLossColor` and
  `normalizeLossThresholds`.

## 0.19.0

### Added

- `PinnedLiveStrip` (`shell/workout`): a one-row strip for every page that is not
  the live page, shown while a set or a rest timer runs (VW-429). `state` is
  `set`, `rest` or `idle` (`idle` renders nothing). The set state shows the rep
  count against the target, the last rep's mean velocity and one bar per rep;
  the rest state shows the seconds left in the same slot, so nothing moves
  between a set and its rest. Bar colour comes from the caller's per-rep zone id
  (`LiveStripRep.zone`), never from the velocity. `isFatigued` turns the edge red
  and adds a wash; it never adds text. The layout is `wall` (72px row) or
  `phone`, measured from the strip's own width (`PINNED_LIVE_STRIP_PHONE_MAX`)
  unless `layout` forces one. Rests of 100 to 999 seconds step the digits down
  once and centre them (`liveStripRestReadout`, `liveStripRestType`); a longer
  rest holds at "999s". Every choice went through titan-review rounds with the
  human; the rejected variants and their measured numbers are in `REJECTED.md`.
- `ChevronRightIcon`.
- `SetBarChart`: `colorFor` receives the rep index as a second argument, so a
  caller can colour a bar from data it holds per rep. Existing one-argument
  callbacks are unaffected.
- `Progress`: `accessibilityLabel` names the `progressbar` role.

## 0.18.1

### Fixed

- A `className` that overrides a `Typography` variant (size, weight, leading,
  family) now wins in consumers of the published build, as it always has in
  Storybook. The dist is compiled with titan's own JSX runtime
  (`src/web-jsx/`), which turned `className` into a react-native-web `$$css`
  style object at every call site, titan's own composites included. `Typography`
  therefore never saw the caller's classes, its `cn()` could not drop the
  variant's, both sets reached the DOM, and the consumer's stylesheet order
  picked the winner. The runtime now merges a `className` with the `$$css`
  classes it already built, caller last (VW-420). Found on the Voltras wall,
  where the goal hero rendered 16px/400 instead of 40px/700.

  **Consumers will see a visual change.** 72 existing overrides in 31 files
  start applying, and the same defect affected non-Typography components that
  take a sizing `className` (a `Divider` given `h-4` rendered 0px tall). Nothing
  was redesigned: these are the styles the components were written with.

## 0.18.0

### Added

- `GoalCard` (`status:candidate`) — one goal at card scale in two sizes. `full`
  is the lead card at the top of the `#/goals` wall: the lift, its priority mark, its verdict and a PR
  badge in the title row, the meso target folded in above the chart, and the
  block's weeks as cells standing on the chart's own week columns. It deletes the
  old header block rather than restyling it (VW-385 unit 1, human calls
  2026-09-17): the week reads off the chart axis and the summary's facts line,
  committed and stretch off the chart's rules, next week off the new hollow
  marker, the status basis and its RP citation off the status pill's tip, and the
  priority word off `GoalPriorityIcon`. The milestone tile's own inset plane went
  with the fold — the chart's plane is the only inset the card has. The card
  measures its container, so it follows whatever width it is given. `compact` is
  a cell in the per-lift grid: the same title row and the same summary over a
  sparkline. One title row serves both — the lift on the left, then the priority
  mark, the PR star and the status badge furthest right.
- `GoalPriorityIcon` (`status:candidate`) — specialize / maintain / deprioritize
  as a mark beside the status pill, with the level's meaning on hover, focus or
  press. Priority is not pace, so it never borrows a `status-*` tone: the accent
  goes to the level worth the attention and the others step back through the text
  ramp. Three new shared icons: `TargetIcon`, `EqualIcon`, `ChevronsDownIcon`.
- `GoalTrajectoryChart` takes `nextTarget` — a hollow dot at the week and value
  the plan asks for next, joined to the latest reading by a dashed run, carrying
  its label as a tip rather than as type on the plane. The y-domain and the week
  axis both account for the marker, so a target above every reading still lands
  inside the plane.
- `GoalMilestoneSummary` — the meso target's content (hero, facts row, week
  cells) with no plane or frame of its own. `GoalMilestoneTile` is that summary in
  its inset plane, `PrimaryGoalCard` folds it onto the card, and `GoalLiftCard`
  leads with it, so the gap, surplus and outcome maths has exactly one home.
- `GoalMilestoneWeekStrip` takes an `axis`, which pins each week cell to a chart
  column instead of sharing the width evenly. The axis insets by half a column
  plus half a gap, so every cell is whole and the air at both ends matches the
  gap between cells (the human read the earlier half-column inset as clipping).
- `trajectoryWeekScale` — the chart's week axis as a pure function, so anything
  lining up with the columns from outside the SVG shares them rather than
  re-deriving them.
- `TipTrigger` (`ui/tooltip`) — one tip opened by hover, focus and press off a
  single state, with a `usePortal` escape for tips that need `-start` / `-end`
  placement. `GoalMilestoneWeekStrip` now composes it instead of its own copy.
- `PrBadge` takes `iconSize` for its compact star, so a wall-density header can
  carry a 20px mark and a phone the original 14px.
- `valueReach` / `milestoneReach` (`goalMilestone.ts`) — one definition of where
  a reading landed against its target.
- `GoalTrajectoryMini` and `GoalWeekColumnsChart` — the compact goal chart, and
  the body of `GoalCard size="compact"`. The block's week cells stand on the
  chart's plane, on its own week columns, so a cell heads the column its point
  sits in; the current week's column is lit, and the line is recessed so the
  points lead. It runs through the big chart's own `deriveTrajectoryGeometry`, so
  the curve, the value floor, the week columns and the marks come from one place.
  Folded in from #255.

### Changed

- `GoalTrajectoryStatus` and `GoalLiftStatus` accept two OUTCOME statuses beside
  the seven pace ones: `goal_met` (success green, "Goal met") and `beyond_goal`
  (the `ahead` blue, "Beyond goal"), which voltras-mcp's goal read model now
  sends instead of leaving the UI to compare the best reading with the committed
  value (VW-400). Where a card or the chart derived that verdict itself, an
  incoming outcome status wins and the derivation stays as the fallback for
  callers still sending pace. The derived "met" verdict now prints "Goal met"
  too, so one state has one word whoever decided it — it read "Hit" before.
- `PrimaryGoalCard` and `GoalLiftCard` are now presets of `GoalCard` (`full` and
  `compact`). **Renamed, not removed**: both names still export and take the props
  they took, so voltras-mcp's `#/goals` needs no change; `GoalLiftCard` can retire
  once the SPA moves to `GoalCard size="compact"`. Their test hooks moved onto the
  merged card: `goal-card-title`, `goal-card-status`, `goal-card-status-light`,
  `goal-card-trend`, `goal-card-content`, `goal-card-fold`.
- The compact card draws the goal chart instead of a `Sparkline`, and the
  summary above it no longer draws its own week cells — the chart's row is the
  card's row. A second chart vocabulary on the same page as
  `GoalTrajectoryChart`, and two rows of the same weeks, both went (VW-385
  ideation round 2, D1 chosen; A, D2, D3 and the `Sparkline` path are deleted and
  recorded in `REJECTED.md`).
- `GoalTrajectoryChart` takes `showWeekLabels` (default on). The full goal card
  passes it off: its week cells stand on those very columns, so the axis was
  printing every week a second time a row lower.
- The committed and stretch rule labels anchor to the LEFT edge by default
  (`referenceLabelSide`, folded in from #255). A goal that is going well ends its
  line at the right edge, under the labels that used to anchor there.
- The week axis insets by half a column plus half a gap, so the outer cells stand
  the same distance off the plane's edges as they do off each other. Round 5's
  half-column inset left them with half that air, which read as clipping —
  measured in the browser, nothing was ever clipped.
- `GoalTrajectoryChart` draws no legend at all (human: "way too chunky and I think
  unnecessary"). Every rule already labels itself on the plane, and the status is
  said once, in the card's title row. The pill, the swatches and their density
  knobs are deleted rather than hidden behind a prop.
- Cells are their full column again, less the shared gap: 60% was tried and
  rejected. Every week's COLUMN — not just its dot — now sits whole inside the
  plot, which also un-halves a week-one deload column.
- The card's status badge reads the MILESTONE's verdict, the same one the summary's
  hero shows. A band's committed edge and the block's target are different numbers,
  so judging the badge by the band could print "Hit" over "2.5 lb to goal".
- The goal verdict outranks the pace once a reading reaches the committed target.
  Exactly at the goal is success green with the hit label, past it is the `ahead`
  blue labelled `Beyond goal`. The chart's line and pill, the milestone summary's
  hero, the tile's hit mark and the card's header pill all derive it from the
  shared helper, so they cannot disagree.
- `GoalLiftCard` leads with the meso target block instead of its own
  `reps x load` hero and `in week 8` line, which said less in more space and said
  it in a second vocabulary. Its PR star moves into the title row beside the
  status affordance, where it no longer has to be taken out of flow. New optional
  `weeks`, `currentWeek` and `latest` props feed the block; without them it reads
  the target and the best set off the props the card already had.
- `GoalMilestoneTile`'s hit mark takes the hero's own colour rather than a second
  mapping of the same verdict, so a target that was beaten reads `Hit` in the
  `ahead` blue instead of green over a blue hero.

## 0.17.1

### Fixed

- `GoalTrajectoryChart` rendered an empty plane for a goal whose committed and
  stretch targets are the same number (VW-414). A calibrating goal arrives with
  `low === high` at every expected week, which collapsed the band to a
  zero-height fill, and with `committed === stretch`, which printed both rule
  labels on one baseline as a single unreadable word. Now a band with no
  drawable thickness anywhere draws its centre line as a 1.5 px stroke in the
  band hue at full alpha, so the plan's ramp stays visible across a room; a
  minimum fill thickness was rejected because a 2 px slice of the centre-to-edge
  gradient shows only its 14 % edge stops. Coincident rule labels merge into one
  right-anchored `Committed = Stretch 128`, and rules closer than a label height
  push the lower label under its own rule. A single actual no longer emits a
  zero-length closed line path. Bands that merely pinch at week one are
  unchanged. New story `Calibrating (real wall data)` carries the captured
  payload.

## 0.17.0

### Added

- `GoalTrajectoryChart` restyled as a d3-backed SVG on an inset plane (#248,
  VW-385): monotone-cubic actual line and band (`bandCurve`), a centre-to-edge
  band fade painted as one continuous gradient (`bandFade`), neutral committed
  and stretch rules, horizontal gridlines with y labels, a y-domain padded from
  the label metrics so rule labels always clear the plane, a line drop shadow,
  a lowered plane with a lip highlight (`baseline`, `leftShadowSpread`), and a
  1 s line-draw entrance that honours reduced motion (`animate`). Dot centres
  now sit exactly on the line (the old View renderer anchored the stroke's top
  edge at the data point). The rejected explorations stay as `explore-*`
  stories marked NOT CHOSEN. New runtime dependencies: `d3-shape`, `d3-scale`.
- Light-mode values for the three `dataviz-*` palettes (#245, VW-371):
  diverging, sequential and categorical light tokens are tuned for light
  surfaces after four human-reviewed turns; dark values are unchanged. The
  decision story `Lab/Decisions/Dataviz Light Palettes` shows every candidate
  with live OKLCH, CVD and contrast measurements and marks the chosen sets;
  `DatavizLightPalette.candidates.test` pins the light tokens to them.
- Layer-2 Storybook visual gate (#244, VW-319): the shell and icon stories now
  have committed pinned-container baselines and any pixel drift fails CI; a
  refresh step uploads regenerated PNGs on every run.
- `titan/no-raw-device-data-in-chat` lint rule, scoped to
  `src/components/custom/Chat/**` (empty today, ahead of the VW-393 chat
  component family). Flags `Buffer.*`/`Uint8Array`/`ArrayBuffer` usage in a
  component or render function, hex-literal and raw-byte-sequence string
  shapes, raw-frame field names (`raw`, `frame`, `bytes`, `payloadHex`,
  `register`, `opcode`) accessed on a data-_ part, and a `data-_`part key
with a hyphen after the prefix (silently dropped by the Claude Code channel
meta). Mirrors voltras-mcp's`no-protocol-detail` (NF-07) (VW-394).

### Fixed

- `VolumeLandmarkBar`'s percentage label reads `text-primary` instead of the
  zone fill, in both themes, so it stays legible on light surfaces (#245,
  VW-371).
- Two `RuleTester` suites (`no-frozen-theme`, `no-device-internals`) wrapped
  `run()` inside `it()` and passed with zero assertions; unwrapped, and
  `no-device-internals` now also checks numeric hex literals (#242, VW-396;
  #243 for the five remaining suites).
- The Visual Regression workflow uploaded a `playwright-report/` directory that
  never exists; it now uploads the real `-actual`/`-diff`/`-expected` PNGs so a
  failed gate can be diagnosed from CI (#246).
- Token-pure `no-restricted-syntax` lint rule now permits the render-time
  `getSemanticColors(useSurfaceMode())` form its own message recommends,
  instead of banning every `getSemanticColors()` call outright (VW-381).
- Root barrel re-exported `MuscleGroup` as `export type`, so `dist/index.d.ts`
  declared it while `dist/index.mjs` never actually exported it —
  `import { MuscleGroup } from '@titan-design/react-ui'` typechecked and then
  crashed at runtime. `MuscleGroup` is now a real value export at root,
  matching what its `.d.ts` entry already promised (VW-388).

### Changed

- `CHANGELOG.md` now ships in the published tarball (`package.json` `files`)
  (VW-388).

### Documentation

- README documents the `@titan-design/react-ui/bodymap` and `/pages` subpaths,
  the `react-native-body-highlighter` peer dependency, and the Vite plugin
  pattern (`vite-rn-svg-plugins.ts`) a web consumer needs to build `/bodymap`;
  adds `GoalLiftCard` and `GoalMuscleCard` to the component list (VW-388).

## 0.16.0

### Added

- `GoalLiftCard` organism (root barrel): one lift's goal state, with the next
  milestone as the hero, status pill and progress against the committed/stretch
  band (#237, VW-386).
- `GoalMuscleCard` and `MuscleGlyph` (`bodymap` subpath): a muscle priority's
  rollup card and the card-scale figure it composes, promoted out of the lab
  (#237, VW-386).
- `Sparkline` gains `domain` (x and y), a two-reference `band`,
  `referenceLabelPlacement`, and `xValues` — all optional and defaulting to the
  prior behavior, so the 17 pre-existing tests are unchanged (#237, VW-386).
- `placement?: 'bottom' | 'right'` on `BodyMapDetailPanel`, default `'bottom'`;
  `'right'` docks the sheet as a right side-sheet at wall size without moving
  the figure (#228, VW-335).
- `strength?: MuscleStrengthSection` and `plan?: MusclePlanSection` on
  `BodyMapDetailPanel`, rendering per-exercise strength trend rows, a PR badge
  row, and done/upcoming plan rows (#233, VW-336).
- `linearGradientStops` in `theme/gradients.ts`, the n-stop form `surfaceGradient`
  now composes from; `linearGradient`'s output is byte-identical (#228, VW-335).

### Changed

- Shell (`TopBar`, `SideNav`, `DeviceMenu`, `DeviceRow`) and `DataRow` moved off
  arbitrary bracket spacing classes onto the semantic ramp; three values move —
  `DeviceMenu` panel padding 7 → 8px, `DeviceRow` row height 34 → 32px (9 → 8px
  vertical), `DataRow` gains a 12px horizontal gutter and 8px gap it previously
  had neither of (#229, AW-142 wave three).
- Workout cards and rows (`BaseBadge`, `SetRow`, `MesoStatusCard`,
  `ExerciseCardHeading`, `WorkoutCard`) onto the semantic spacing ramp; six
  off-grain values move onto the nearest rung — `BaseBadge` icon gap 3 → 4px,
  `SetRow` type chip 5 → 4px horizontal, `MesoStatusCard` status badge 3 → 2px
  vertical (gap 5 → 4px), `ExerciseCardHeading` rail 9 → 8px vertical,
  `WorkoutCard` muscle chip gap 5 → 4px, `ExerciseCardHeading` strip offset
  7 → 8px (#230, AW-142 wave three).
- Workout molecules and organisms (`SessionHeader`, `InputBar`, `RestTimer`,
  `ReadinessCheck`, `PrHistoryModal`, `SupersetWrapper`, `SetTableHeader`,
  `ExerciseHeading`, `WorkoutPill`, `TempoDisplay`, `WeightBadge`,
  `IntensityBar`, `MesoProgressBar`, `StatusDot`, `PlaceholderStrip`) onto the
  semantic spacing ramp; two values move — `SessionHeader`'s header inset
  normalizes to 12px on all sides (was 11/12/12/12) and its label row moves
  5 → 4px, `InputBar`'s numeric inputs move 5 → 6px vertical (#232, AW-142 wave
  three).
- Workout pages (`ActiveWorkoutPage`, `TrainingStatusPage`,
  `ProgramPlanningPage`, `ExerciseDetailPage`) and charts (`GoalTrajectoryChart`,
  `StrengthTrendChart`, `VelocityStrip`) onto the semantic spacing ramp; both
  charts' legend swatch gaps move 5 → 4px and their status/trend pills move
  3 → 2px vertical (#234, AW-142 wave three).
- Fatigue family (`LiveFatiguePanel`, `LiveFatigueCard`, `VerdictHero`,
  `FatigueLights`, `GhostSpark`, `DualGhostSpark`, and the panel layout tiers)
  onto the semantic spacing ramp; `FatigueLights`' dot-to-label gap moves
  5 → 4px, and three internal tier constants move onto the ramp (`TIER_GAP_SM`
  14 → 16px, `TIER_GAP_MD` 18 → 16px, `TIER_PADDING_SM` 20 → 16px) (#231,
  AW-142 wave three).

All five spacing waves above read the same `space`/semantic tokens 0.15.0
(#220) put on `px` for native, so no further native-specific behavior changes.

### Fixed

- `Indicator` used with `accessibilityLabel` and no role emitted a bare
  `aria-label` on a `div`, which axe rejects as `aria-prohibited-attr`; it now
  sets `accessibilityRole="image"` (#237, VW-386).
- `react-native-body-highlighter`'s `aria-label` on bare `<path>` elements is
  now hidden behind an `aria-hidden` subtree with the name on the wrapper,
  matching `BodyMap`'s existing treatment of the same drawing (#237, VW-386).

### Internal

- Added slug-collision regression coverage for `BodyMap`'s severity ranking
  (`STATUS_SEVERITY` / `isMoreSevere`), pinning that the more severe status
  wins when multiple muscles share an SVG slug (#235, VW-382).
- `BodyMapDetailPanel`'s "spacing tokens" test block now resolves each pinned
  element's className from an actual render, via a new per-`testID` capture
  helper (`classname-capture.ts`, `spacingClassesOf`), instead of a hardcoded
  literal array disconnected from the component (#236, VW-383).

## 0.15.0

> **Native consumers:** spacing values now emit in `px` instead of `rem` (#220, AW-142
> wave one). On web nothing moves. On native, NativeWind resolves `rem` at a 14px base,
> so every Tailwind spacing step (`m-4`, `p-2`, …) was already rendering at 14/16 of its
> web size — this bump corrects that divergence, and every native spacing value grows to
> match web on your next titan bump. Review spacing on-device when you take this release.

### Breaking Changes

See `DEPRECATIONS.md` for migration detail on each entry below.

- **`getHeatmapColor` signature, twice in one release.** #219 (VW-371) made the palette
  mode a required third parameter (`getHeatmapColor(status, intensity, mode)`); #216
  (VW-333) then dropped `intensity` entirely (`getHeatmapColor(status, mode)`). Only the
  final two-argument form ships in 0.15.0. See `DEPRECATIONS.md` §"BodyMap heatmap —
  `getHeatmapColor` takes a mode (VW-371)" and §"VW-333 — one `VolumeStatus`".
- **`WORKOUT_TOKENS.heatmap` removed** (#219, VW-371), replaced by `heatmapColors(mode)`
  in `theme/workout-tokens.ts`. Never on the package barrel, so internal-only impact.
- **`TONE_COLOR` replaced by `TONE_TOKEN`** (#213, VW-316). `TONE_COLOR` resolved colours
  at import time, which the new `titan/no-frozen-theme` lint rule bans; no alias was
  possible. See `DEPRECATIONS.md` §"Fatigue tokens — `TONE_COLOR` replaced by
  `TONE_TOKEN` (VW-316)".
- **`paceToneColor(tone)` → `paceToneColor(tone, mode)`** (#214, VW-316), mode required
  rather than defaulted so no caller silently stays frozen. See `DEPRECATIONS.md`
  §"Workout pace tone — `paceToneColor` takes a mode (VW-316)".
- **`liveAuraColor(category)` → `liveAuraColor(category, mode)`** (#218, VW-316), same
  shape and reasoning as `paceToneColor`. See `DEPRECATIONS.md` §"Live aura flood —
  `liveAuraColor` takes a mode (VW-316)".
- **One `VolumeStatus`, replacing two overlapping unions** (#216, VW-333). The former
  figure taxonomy (`under | maintenance | productive | over`) is renamed
  `VolumeLandmarkZone`; the chip's five-value union becomes the shared six-value
  `VolumeStatus` (a pure widening, adding `approaching`). No public prop is renamed —
  `MuscleGroupChip.volumeStatus` still accepts every value it did before — but its
  rendered colour moves from the `status-*` family onto `dataviz-diverging-0..4`. See
  `DEPRECATIONS.md` §"VW-333 — one `VolumeStatus`, shared by the figure and the chip".

### Added

- `GoalTrajectoryChart` organism: the goal-progress chart with expected band, committed
  and stretch rules, actual line with PR markers, meso boundary rules and deload shading
  (#223, VW-353).
- `size?: 'phone' | 'wall'` on `BodyMap` and `TrainingStatusPage`, scaling the figure to
  480×960px with a matching 2x type ramp for wall display; phone geometry is unchanged
  (#217, VW-334).
- Stats-derived `expectedRange` text trailer on `SetStripSet`'s `active`/`todo` variants,
  distinct from the plan's prescribed rep range (#206, VW-311).
- `statusBadge` gains an `info` variant and an optional `basis` line on `MesoStatusCard`
  (#215, VW-354).
- Eighteen new `dataviz-*` semantic tokens — `dataviz-diverging-0..4`,
  `dataviz-sequential-0..5`, `dataviz-categorical-0..6` — promoting the diverging,
  sequential and categorical chart palettes to theme-aware roles. Phase 1 is plumbing
  only: light and dark carry identical values, so nothing changes on screen yet (#219,
  VW-371 phase 1).
- Spacing and sizing token foundation — `inset`, `squish`, `stack`, `inline`, `control`,
  `section`, `gutter` situations plus the Tailwind wiring, `Foundations/Spacing` story
  and lint rule. No component pixel moves on web (#220, AW-142 wave one).
- New semantic spacing classes: `p-inset-*`, `gap-stack-*`, `gap-inline-*`,
  `px-squish-x-*` (paired with `py-squish-y-*`), `px-control-x-*` (paired with
  `py-control-y-*`), `py-section-*`, `px-gutter-*` (#220, AW-142 wave one).
- `titan/no-raw-spacing` eslint rule, flagging inline `paddingVertical`/`margin`-style
  numeric literals outside an `// optical: <why>` escape hatch (#220, AW-142 wave one).

### Changed

- `Pill`, `Badge` and `Chip` unified onto the `squish` spacing ramp; several size rungs
  move (Pill `md`/`lg`, all three `Badge` rungs) to land on the ramp (#222, AW-142 wave
  two part A). Exact deltas (px, `padding-x / padding-y`):
  - Pill `md`: 10/4 → 12/4. Pill `lg`: 12/6 → 16/6.
  - Badge `sm`: 6/2 → 8/2. Badge `md`: 8/2 → 12/4. Badge `lg`: 10/4 → 16/6.
  - Chip is unchanged at every rung — it already sat on the ramp.
- `Card`, `ListItem`, `Popover`, `Menu`, `Tooltip`, `HelpTip`, `Modal`, `Drawer`, `Alert`,
  `Toast`, `Section`, `Input`/`FormField`, `Progress` and `Tile` onto the `inset-*` /
  `gap-stack-*` tokens; `Drawer`'s header/footer/body band grows from 16/12 to 24/16 to
  match `Modal` (#225, AW-142 wave two part B).
- Solid-fill components (`Pill`, `Button`) now resolve their label colour against a
  dedicated `*-solid` token per tone instead of a single shared white/dark label, fixing
  WCAG AA contrast failures that alternated between the two components depending on tone
  (#204). `Button`'s solid label moves from white to the dark `on-*` token on **every**
  tone — primary buttons flip from white to near-black text. `brand-secondary` and
  `status-error` solid fills lift one ramp rung (dark mode: `cyan[600]`→`cyan[500]`,
  `red[600]`→`red[500]`) so the shared dark label clears AA on all six tones.
- `TimerReadout`, `Treemap`, `Indicator` and `Spinner` colours now resolve at render time
  from the current surface mode instead of a frozen `getSemanticColors('dark')` module
  read (#221, VW-316 part 5).
- Ten Workout components' colours resolved at render time instead of frozen at import
  time (#218, VW-316 part 4).
- `BodyMap` and `TrainingStatusPage` heatmap fills now resolve from the `dataviz-*`
  semantic roles at render time instead of a frozen primitive map (#219, VW-371 phase 1).
- Six Workout components' colours resolved at render time (#214, VW-316 part 3).
- All seven frozen-theme call sites in the Fatigue family resolved at render time (#213,
  VW-316 part 2).
- Seven of the approved VW-82 tokens shipped, plus six grey-snap corrections (#203).
- `LiveFatigueCard`'s section gap is now capped and content-driven instead of an
  unbounded flex spacer; the row dimension converges on one token (#205, VW-276).

### Deprecated

- `Pill`'s `size="xl"` is deprecated and renders as `lg` — the `squish` ramp tops out at
  `lg` because nothing in the library or its consumers ships a capsule above 16/6 (#222,
  AW-142 wave two part A).

### Fixed

- `WorkoutPill`'s active-status pulse now holds still under `prefers-reduced-motion`,
  removing a source of flaky Layer-1 screenshot-baseline diffs and doubling as an
  accessibility improvement (#211, VW-312).

### Internal

- Added `titan/no-frozen-theme`, ratcheted across every component family, banning the
  module-scope `getSemanticColors('dark')` pattern that produces the breaking changes
  above (#210, VW-316 part 1).
- Added `titan/no-upward-tier-import`, enforcing the `theme -> icons -> ui -> custom ->
shell -> pages` dependency direction (#207, VW-315).
- Added `titan/no-deprecated-import`, ratcheted, flagging new imports of an
  `@deprecated`-tagged export (#209, VW-318).
- Added `titan/no-local-formatter`, ratcheted, and deduplicated six local numeric
  formatters onto the shared formatter module (#212, VW-317).
- Ignored three untracked root files from a different agent harness that duplicated
  already-committed `CLAUDE.md`/`.claude/skills/` content (#208).
