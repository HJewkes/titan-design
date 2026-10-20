# Changelog

All notable changes to `@titan-design/react-ui` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

New entries go in `changelog.d/` as one fragment file per PR (see its README); `pnpm
changelog:compile` folds them into `[Unreleased]` at release.

## [Unreleased]

## [0.23.0] - 2026-10-20

### Added

- `MediaThumb`: a poster frame at a fixed aspect (16:9 by default) with `cover` and `contain-blur` fits, three corner badge slots, a Skeleton while loading and a play-glyph plane when there is no source or the image fails to load. `MediaThumbBadge` is the corner badge (`scrim-strong` ground, `on-scrim` ink, read by its `accessibilityLabel`). `PlayIcon` and `VolumeOffIcon` join the icon set (TD-988).

## [0.22.0] - 2026-10-20

### Added

- `useTable` filters, holds controlled state and serves a window. New options: `columns`, `getRowId`, `mode` (`client` default, or `manual` with `rowCount`, `getRow` and a debounced `onRangeNeeded` that asks once per aligned block), and controlled pairs `filters`/`defaultFilters`/`onFiltersChange`, `selectedIds`/`defaultSelectedIds`/`onSelectedIdsChange` and `sort`/`onSortChange`. New return fields: `filters`, `setFilter`, `toggleFilterValue`, `clearFilters`, `activeFilterCount`, `facetOptions`, `visibleRowCount`, `rowAt`, `windowRange`, `setWindowRange`, `windowRows`, `clearRequestedRanges` and selection helpers. A filter or sort change returns to the first page, the top of the window and forgets requested ranges. With no new option the hook behaves as before. `table-model.ts` gains `facetCounts` (TD-163).
- `surfaceGradient.card`, `.deviationTrack` and `.statusTrack`, and an optional `{ token, alpha }` gradient stop; `MesoStatusCard` and `DeviationBar` paint from them, unchanged on screen (TD-200).
- `pnpm catalog` also writes `docs/component-catalog.md`, a markdown digest of `component-catalog.json` with one row per entry (name, status, family, purpose, composes, first story id), sorted by name and free of global counts so a change to one entry touches only its row. It ships in the package under `docs/`. `src/arch/component-catalog.digest.test.ts` renders the committed JSON and fails when the markdown differs, naming the stale rows (TD-353).
- `MessageList`, `MessageBubble`, `DateSeparator`, `TypingIndicator` and `UnreadBadge` take an optional
  `labels` prop that replaces their built-in strings, so a consumer can localise or reword them. Text that
  depends on names or counts is a function (`typing`, `newMessages`). Defaults are unchanged (TD-371).
- `SearchIcon`, `DatabaseIcon` and `ChartIcon` join the shared icon set (TD-407).
- Five per-theme text tokens, `text-brand`, `text-brand-secondary`, `text-success`, `text-warning` and `text-info` (`text-text-*` classes), each clearing 4.5:1 on the four planes in light and dark. No component reads them yet (TD-410).
- `BarList` takes `referenceMarker`, one labelled line on the value axis (a cutoff, a budget) drawn on each bar. There is no legend: a set marker turns row tips on, and each tip names the limit. The marker is also read out in the list name and row names. `BarListMarker` is exported with it (TD-440).
- `custom/Code` family seams and `StatusMark`: the shared types, `code-status.ts` (change, score-band, budget-band and coupling-class vocabularies), `pluralize`, and `StatusMark`, a Pill that renders the six change kinds with an accessible name in words (TD-442).
- `Scatter`, `Treemap` and `Gauge` take `emptyState`. With no data, `Scatter` keeps its axes and draws it, or a "No data" `EmptyState`, centred inside them over the plot box; `Treemap` (no positive `value`) draws it centred in the chart box in place of a blank box. `Gauge` takes `value: number | null`: `null` or a non-finite value draws the unfilled track with the "No data" `EmptyState` in the centre (TD-473).
- Non-text contrast gate (`theme/nontext-contrast`): declared control-boundary, mark, fill, track and separator pairs are composited over the five planes in light and dark and held to 3:1 or ΔL\* 7 / 12 / 18; a source test fails when a primitive stops painting its declared token class, and a ramp-fidelity test fails on a semantic colour that is neither a ramp step nor allowlisted by mode, token and value. Both baselines are shrink-only (TD-486).
- `RefChip` and `RelatedList` in `custom/ActiveWork` render typed cross-entity refs (task, pull request,
  session, agent, note, file, initiative) as chips with a kind glyph and an optional status, grouped by kind
  with counts. `REF_KIND_META` and `refGraphKinds()` export the kind vocabulary (TD-497).
- `Kbd`, a display-only keyboard shortcut hint that renders one keycap per key and announces the shortcut once by its spoken name, e.g. "Command K" (TD-503).
- `HighlightText` renders a string with matched ranges emphasised by weight (TD-504).
- `Metric` moves to `ui/metric` and takes `align` (`start`, `center` or `end`, default `center`) and `tone` (the value colour from a semantic token). Existing callers render unchanged. The `custom/Metric` path is a `@deprecated` shim, removed in 0.23.0 (migration M9 in `DEPRECATIONS.md`) (TD-53).
- `CardStat` (`ui/card`), the Card stat preset: a `filled` Card one plane up holding a `Metric`, with `label`, `value`, `unit`, `size`, `align`, a `tone` that colours the value from a semantic token, and `metricProps` for the Metric's class and style hooks. `Metric` takes `valueStyle` and `labelPosition` (`above` or `below`, default `below`). `Tile` now renders a `CardStat` with no visual change; a `bg-<token>` class on it still sets its plane, and its `valueColor` is deprecated in favour of `tone` (TD-54).
- `ActiveWorkoutPage` takes `onRecord(set)`, `onSkip` and `onAddTime`, and exports `ActiveWorkoutRecordedSet` for the recorded-set payload; the rest timer's add-time button no longer does nothing (TD-549).
- The token tests gate the `dataviz-categorical-0..5` roles at all-pairs deutan/protan ΔE 8 in
  both modes, against a shrink-only baseline that records the two light pairs that miss today, and
  declare every categorical fill at 2:1 on `surface-base`, `surface-elevated` and `surface-raised`
  (TD-758).
- `ui/motion`, the time-driven motion core: every animated value is a function of clock seconds. Clocks `seekClock`, `rafClock` and `mediaClock`; `MotionProvider`; hooks `useMotionTime`, `useLocalTime`, `useRawLocalTime`, `useWaitUntil` and the pure `localTime`; `Beat`, `BeatFrame` and `useBeatTime`; `cubicBezier`, `linear` and `MOTION` (`duration` in seconds, `ease` as curves). Without a provider the hooks share one requestAnimationFrame loop that stops once a window ends, and start at the end under reduced motion (web and native), on the server and after hydration. The theme gains `motion`, the one source of the `--ease-*` and `--duration-*` values, with `motionCSSVars` and `cubicBezierCss`; the CSS values are unchanged (TD-838).
- `ui/motion` gains an easing vocabulary (`easeIn`, `easeOut`, `easeInOut`, `poly`, `back`, `smoothstep`, `smootherstep`), `springSettleS` and `springEase` (a spring fitted to a 0-to-1 window, exactly 1 at the end), `interpolateScale` (lerps in signed-area space), per-segment easing in `keyframes`, `envelope` and `useBeatEnvelope` (fixed in and out with an elastic hold, compressed in proportion when the window is short), `cropInset` (a `clip-path: inset(...)` string) and `interpolateColor`, which mixes resolved hex colours in Oklab; it bypasses tokens, so prefer cross-fading token-painted layers (TD-839).
- The `motion` tokens gain a video tier for time-driven motion (TD-839). `ease.in` is a new exit curve, also published as `--ease-in` and the Tailwind `ease-in` key. `motion.video` holds the video durations (emphasis 0.5 s, enter 1.0 s, hero and count 1.5 s, exit 0.85 × enter), a 60 ms stagger capped at 0.5 s per cascade, plus `rise` and `scaleFrom`. `MOTION.spring` adds `snappy`, `smooth`, `heavy` and `bouncy` presets, and `motion.dim.context` (35% opacity, fully desaturated) is the weight for de-emphasised context. `MOTION` exposes them in seconds, adds `MOTION.staggerEachS(count)`, and damps every spring critically unless `MOTION.springPreset(name, { allowOvershoot: true })` asks for the payoff overshoot. The existing eases and durations, and their CSS values, are unchanged.
- `ui/motion` gains stateless seeded randomness and noise for render code: `random(seed, ...keys)` hashes its arguments to a repeatable value in [0, 1) that does not depend on call order, `randomRange` maps it onto a range, and `noise2D(seed, x, y)` is 2D simplex noise in [-1, 1] ported from simplex-noise (MIT, Jonas Wagner) with its permutation shuffled by `random`. The stateful fixture generator in `ui/charts/kit/seededRandom` is unchanged (TD-839).
- `ui/motion` gains a pure SVG path toolkit, ported from MIT `@remotion/paths` with attribution (`ui/motion/paths/LICENSE`). `parsePath` reads the full path grammar (relative forms, `H V S T`, arcs with compact flags) into absolute `M L C Q A Z`. `pathLength`, `pointAtLength`, `tangentAtLength` and `cutPath` measure and cut by arc length, and `pathModel(d)` parses a path once for repeated reads. `drawOn(length, progress)` returns `strokeDasharray` and `strokeDashoffset` from a measured length, so a draw-on works without `pathLength={1}`. `interpolatePath` and `pathMorph` morph between two paths with different command counts (TD-839).
- `ui/motion` gains the pure value layer: `interpolate` (eased, clamped by default) and `keyframes`, the closed-form `spring`, `stagger`, and `sequence`, which lays `{ durationS }` items end to end with an optional `overlapS` (default 0, so phases never overlap) and returns each item's `startS` and `endS` plus `totalS` (TD-839).
- `CheckMark`, an SVG check in the icon set, replaces the ✓ text glyph in `Checkbox`, `Alert`, `Toast`, `Select`, `Stepper`, `StatusDot`, `WorkoutPill` and `WeekRow`. No titan font carries ✓, so it rendered in whatever font the host had. The mark is a brush stroke with a flat vertical start cut that swells at the apex and tapers to a hairline; `strokeWidth` sets its weight, and a stroke-dash on its mask spine draws it on, short leg first (TD-840).
- `AnimatedNumber` counts or rolls a number from `from` to `value` as a caller-driven `progress` goes 0 → 1, landing exactly on `format(value)` at 1 and always labelling the final value for assistive tech (`mode: 'count' | 'reel'`, TD-846). `formatGrouped` joins `utils/number-format`.
- `Annotate` and `AnnotationMark` (`@titan-design/react-ui/motion` only), the rough-notation idea: a hand-drawn `highlight`, `underline`, `box`, `circle`, `strike-through` or `crossed-off` mark that draws on as `progress` runs 0..1. `Annotate` measures its children; `AnnotationMark` takes an anchor `box`, so a map layer can feed a node's box after `project`. The same `seed` draws the same wobble on every render, and reduced motion shows the finished mark. The motion core gains `roughLine`, `roughEllipse` and the `thereAndBack` easing for emphasis cues (TD-848).
- `Timeline` (`ui/charts/timeline`), events on one time axis with a `playhead` (a fraction of the domain) and a pan `window` (the visible fractions of the domain, e.g. `[0.5, 1]`), both driven by props, horizontal or vertical, with `isLoading` and `emptyState`. `ChapterCard` (`ui/chapter-card`), a chapter title card (number, kicker, title) that enters and leaves by `progress`, its exit taking 0.85 of its entrance; it holds still under reduced motion (TD-850).
- `ProgressSteps` takes `variant="rail"`, which draws done / active / pending step chips joined by
  connectors, and a fractional `progress` that fills the connector into the active step. The new
  types `ProgressStepsVariant` and `ProgressStepState` are exported. The default `dots` variant
  renders as before (TD-853).
- `Beat` takes `cues: { name: atS }`, named moments in seconds from the beat's start, and `useCue(name)` returns a cue's time from the current origin, so `useLocalTime(useCue('vo-2'), 0.5)` works at any depth (TD-862). A name an enclosing Beat already declared throws `Error`, an unknown name throws an `Error` that lists the known ones, and a cue that is not finite or falls outside `[0, durationS]` throws `RangeError`. Sibling Beats may reuse a name. A Beat without `cues` renders as before. New exports from `@titan-design/react-ui/motion`: `useCue`, `BeatCues`.
- Motion timing toolkit (TD-862), from `@titan-design/react-ui/motion`:

  - `lagged(n, { totalS, lagRatio, ease? })` fits `n` overlapping items into `totalS` (Manim's LaggedStart). It returns `itemS`, each item's window and `progress(t, index)`. `ease` eases the group's time, and no window ends past `totalS`.
  - `span(durationS)`, `chain(...spans)`, `all(...spans)` and `delay(s, span)` compose timelines as pure data. Each returns `{ durationS, windows }`.
  - A `keyframes` stop takes an optional third element, `{ holdS?, connectedRight? }`: `holdS` keeps the value that long before easing to the next stop, and `connectedRight: false` keeps it until the next stop, then steps. A hold on the first or the last stop is legal.
  - New types: `KeyframeOptions`, `Lagged`, `LaggedOptions`, `Span`, `TimeWindow`.

  **Changed (motion is unreleased).** `stagger` takes a required `count`, `each` defaults to `MOTION.video.staggerEach`, and the step shrinks so no delay passes `MOTION.video.staggerMax`. An `index` outside `[0, count)` throws `RangeError`. `keyframes` now validates its stops and throws `RangeError` for a non-finite stop, stops that are not strictly increasing in t, a negative hold or a hold that runs past the next stop. Two stops at one t no longer jump; express a jump with `connectedRight: false`.
- `/motion` gains a keyed morph for storytelling transitions, after Manim's TransformMatchingParts (MIT, attributed in `ui/motion/morph/LICENSE-manim`). `matchParts(from, to, keyMap)` pairs two scenes' parts by key (a part's `key`, defaulting to its `id`), lets a `keyMap` claim renamed parts first, and lists the rest as exits and enters. `partsMorph(from, to, options)` turns that into painted layers as a pure function of progress: matched parts move and scale to their target box, optionally along an `arc`; key-mapped parts move while cross-fading; unmatched parts fade out over the first half and in over the second. `<Morph progress>` renders the layers with transform and opacity only and shows the target scene under reduced motion (TD-863).
- `resolveMapState(timeline, layout, t)` is the network-graph map's pure state model: node, edge, card and minimap state at video time `t`, with no clock and no rendering, so a seek and a frame-by-frame sweep agree (TD-875). Internal to `network-graph/map`; not yet exported from the barrel.
- `NetworkGraph` layouts can ask for three more shapes, each additive: `nodeShape: 'box'` with `nodeBoxes` paints each node as its rectangle, with the label centred inside and the press target and tooltip over the whole box; a group `variant: 'box'` with a `box` paints a compound rectangle under its members, outermost first; and `edgeShape: 'routed'` with `routes` draws each edge through every point of its route, or straight from border to border when it has none, with parallel straight edges 18px apart. `GraphBox` is the new rectangle type, and `GraphModel` gains `nodeShape`, `nodeBoxes` and `routes`. A layout that sets none of these paints exactly as before (TD-877).
- `ChipBand` lays one beat's citations on a single line at video scale: the lead `EvidenceChip` with its
  citation, the next chips as kind tabs and the rest as a `+d` count. Entry is a 60 ms stagger capped at
  0.5 s, a pure function of `progress`, so a seeked frame equals a played one. Like `EvidenceChip`, it
  exports from `@titan-design/react-ui/motion` only (TD-883, TD-893).
- `EvidenceChip` cites the source behind an on-screen fact: a tone capsule names one of nine evidence
  kinds, then the citation in mono, elided in the middle so the pin and `path:L` stay whole. It renders at
  an app size or at video scale (`fontPx`). The `elideSource` util carries the elision (TD-883).
- `StateChip` shows whether a requirement is met: a tone capsule, success when met and neutral with a
  dashed border when unmet. Given `from` and `progress` it draws the change as a pure function of
  progress: entering met fills to warning left to right, then turns to success; leaving met cross-fades
  back with no fill. `stateChipLook` exports the same timeline for other renderers (TD-884).
- `stageBox(frame, chrome?)` splits a video or page frame into a header band, a stage, a chip band and an 83% caption keep-out, in frame px, scaled by `height / 1080` from the S96 explainer metrics (`STAGE_METRICS_S96`). The keep-out is on by default; `keepOutFraction: 1` turns it off. `useStageFit(ref, label, measure?)` throws in development when content runs past its stage (`"<label> overflows its stage box by N px (…)"`, 1 px tolerance), with `stageOverflow` and `describeOverflow` as its pure parts (TD-885).
- `MapCard` and `FileCard` (`@titan-design/react-ui/diagram`). `MapCard`
  is a Surface at elevation 3 joined to a screen-space anchor by a leader line, with a content slot: it sits
  right of the anchor, flips left near the right edge, and stays above the 83% caption keep-out. `enter`
  draws the leader and then fades the card in; `exit` fades both out. `FileCard` shows a file's path, change
  status and metric rows in codewatch's panel order (TD-897).
- `motion.tiers` (`video`, `app`) and `motion.presets` (`riseIn`, `countUp`, `payoff`) in the theme
  tokens, and `MOTION.preset(name, tier)` in `/motion`, which evaluates a preset's duration, stagger,
  values and reduced-motion fallback at a tier. ChapterCard takes its rise and exit ratio from
  `riseIn`; its frames are unchanged (TD-909).
- `StatCard`, `StateChip` and `NetworkGraph` emit the `data-qa-*` hooks a render-QA inspector reads (`data-qa-container` and `data-qa-title` on the card, `data-qa-glyph` on the chip label, `data-qa-context` on dimmed graph nodes), through one internal `qaAttrs()` helper. Attributes only; nothing paints differently (TD-911).
- `@titan-design/react-ui/visual-router`: the visual router's patterns, its 45-type catalogue and
  `routeVisual`, as data plus one pure function with no React. `docs/visual-router.md` is its generated
  digest (`pnpm visual-router:digest`), with a routing table, one card per pattern and one row per type.
  A test keeps it fresh and keeps each type's `have` status in step with `component-catalog.json`
  (TD-985).
- Two colour tokens for badges over media, such as a duration badge or a muted icon on a video thumbnail:
  `scrim-strong` (`rgba(0, 0, 0, 0.78)`, `bg-scrim-strong`) is the badge ground and `on-scrim`
  (`#FFFFFF`, `text-on-scrim`) is its ink. Neither changes with the theme. White over `scrim-strong` measures
  11.7:1 over a white frame, 16.8:1 over mid grey and 21:1 over black, so it clears AA wherever the badge
  lands (TD-987).
- `Shelf`: a horizontal row that snaps item by item, with a peek of the next item, gutter bleed, a breakpoint-aware `itemWidth` and a nudge arrow on wide columns (TD-990).
- `ChipGroup` (`ui/chip-group`) is a single-select filter row of chips with optional counts. It is a
  `radiogroup` with `value` / `defaultValue` / `onValueChange`, arrow-key selection and one Tab stop.
  `overflow="scroll"` keeps one row, pins the first chip and scrolls the selected chip into view;
  `wrap` flows onto more rows. A pressable `Chip` inside the group renders as a radio and carries a
  44px hit box that stops at its neighbour (TD-991).
- `NetworkGraph` paints its free-form layouts and exports them: `forceLayout`, `egoLayout` and `clusteredLayout` (with `ForceLayoutOptions`, `EgoLayoutOptions`, `EgoDirection`, `ClusteredLayoutOptions`, `GraphGroup` and `GraphGroupRegion`). A layout that asks for arcs gets quadratic edges with the arrowhead at the target's rim, a clustered layout's regions and an ego layout's hop rings are painted under the edges with their labels (hidden from assistive tech, since each node's name, tooltip and the summary already state its group or hop), and a decluttered layout leaves out labels that would overlap while the selected node, the active node and its neighbours always keep theirs. The story's `layout` control gains `force`, `ego` and `clustered` with `seed`, `iterations`, `hops`, `focusId` and `direction` args; in ego mode pressing a node refocuses the view (TP-1039).
- `BarList` (`ui/charts/bar-list`), a ranked horizontal bar list with a value, an optional secondary value, a top-N cap with an overflow row, a text readout for assistive tech and a `layout` of `inline` or `stacked`. Bars are silver; a flagged row is red, a quieter red for a `warning` flag (near a limit) and the full red for `error` (over it). The flag's label is not printed in the row: it is in the row's accessible name and in a tip that hover, keyboard focus (the list is one tab stop) or a long press opens. `isValueHidden` takes the value out of the row the same way. The value and secondary value sit in aligned columns right of the bar. `formatValue(value, row?)` also formats the hidden total. `ui/charts/kit/silverRed.ts` holds the silver/red tones (moved from `custom/Fatigue/fatigue-tokens.ts`, which re-exports them) and `silverRed(mode)` with `neutral`, `near` and `over` (TP-848).
- `custom/Session`, the agent-transcript family: `ToolBadge`, `GapIndicator`, `ToolCallRow`, the
  session vocabulary (`TOOL_FAMILY_META`, `TOOL_OUTCOME_META`, `TURN_ORIGIN_META`, `turnOriginMeta`)
  and the timeline types copied from titan-platform's session read model. `formatDurationMs` in
  `utils/time-format.ts` (TP-855a).
- `custom/Session` gains `ConversationTurn` and `SessionConversation`, the agent-session conversation reader: gap rows from the read model, search dimming with a polite match count (`searchTurns` is exported for the host's count), tool groups as disclosures keyed by turn index (`expandedTurns`, `defaultExpandedTurns`, `onExpandedTurnsChange`; `expanded`, `defaultExpanded`, `onExpandedChange` on a single turn), loading and empty states, and a mount bound at 500 turns. `TimelineTurn`, `TimelineMessage` and `TimelineTokens` are exported (TP-855b).
- `custom/Agents`, the agent-session family: `AgentCard`, `AgentStateLabel`, the state vocabulary
  (`AGENT_STATE_META`, `AGENT_STATE_ORDER`, `compareAgents`, `partitionAgents`, `uniqueAgents`), the
  metrics helpers (`errorRate`, `isErrorRateFlagged`) and the roster types copied from titan-platform's
  `chat-protocol/agents`. `formatUsd` in `utils/number-format.ts` (TP-858a).
- `custom/Agents` gains `AgentRoster` (a single-select listbox, live above past, with roving keyboard
  focus), `AgentRosterRow`, `AgentHoverCard` and `AgentHoverCardContent` (an agent summary that opens
  on hover or keyboard focus), and the roster helpers `agentRosterFieldText`, `rosterGroups`,
  `AGENT_ROSTER_FIELDS` and `DEFAULT_ROSTER_FIELDS` (TP-858b).
- `VolumeStatus` gains `noverdict`, for a trained muscle whose landmarks are withheld, so its week
  has sets but no verdict. The `BodyMap` figure fills it `result-neutral`, `MuscleGroupChip` draws
  a `result-neutral` ring (the untrained dot stays solid), and the detail badge reads "no verdict"
  in the `default` colour. It ranks above `untrained` and below every verdict when muscles share a
  slug. The `TrainingStatusPage` legend shows it as the same ring (VW-741).
- `StatusGlyph` (`ui/status-glyph`) draws one status condition as a shaped mark: circle-check for
  `success`, alert-triangle for `warning`, octagon-x for `error` and a dashed ring for `neutral`,
  filled with the matching `status-*` token (`text-secondary` for neutral). `label` is its required
  accessible name. The icon set gains `CircleCheckIcon`, `OctagonXIcon` and `CircleDashedIcon`
  (VW-938).
- `VerdictHero` takes `lead="word"`: a `StatusGlyph` and the verdict word at h3 (`scale="card"`)
  or h2 (`scale="wall"`), with a `kicker` slot and a `noVerdict` title whose reason sits in the
  glyph's tip. `FatigueLights` takes `variant="chips"`: neutral `Pill`s led by a `StatusGlyph`.
  `TONE_GLYPH` maps a fatigue tone to its glyph tone. The defaults are unchanged (VW-953).
- `SetLossStrip` (`custom/Workout`, on `/workout`) draws one exercise's sets as velocity-loss bars on a
  fixed scale against the VL lines, with set, reps, load and e1RM rows column-aligned underneath. A null
  loss draws the calibrating hatch, warm-up and other sets draw narrow and grey, unscored sets draw
  hollow, and the marked set gets a ring and a `StatusGlyph` in `markedTone`. `label` replaces the set
  number (`#1 L`), and `columns` pads strips so they align down a page. The icon set gains
  `TriangleUpIcon` and `TriangleDownIcon` (VW-954).

  `StatusGlyph` gains an `xl` size (40px) to sit beside a 48px `h2` word, and exports
  `STATUS_GLYPH_FILL`, its tone-to-token map, so a mark drawn beside the glyph takes the same colour.
- `NetworkGraph` (`ui/charts/network-graph`, `Components/Organisms/NetworkGraph`): a directed node-link graph on a layout the caller passes as a value (`layeredLayout`, `suppliedLayout`, or its own `GraphLayout`). Nodes and edges are pressable, one of them can be selected (`selection`, `defaultSelection`, `onSelectionChange`), the graph is one tab stop whose arrow keys follow the edges, and an edge pulses when its `activityAt` rises, with a still form under reduced motion and no pulse under `animate={false}`. Web and React Native Web only. Exported with the graph types (TP-1041).
- `Scatter` takes `referenceLines` (`{ y }`, `{ x }` or `{ slope, intercept }`, each with optional `id` and `label`), clipped to the plot box and never widening the domain; a `label` joins the canvas accessible name. `diagonal` is a deprecated alias for `[{ slope: -1, intercept: 1 }]` and keeps its `scatter-diagonal` test id, removed in 0.23.0 (TD-472).
- `ui/charts/network-graph` plot model for free-form layouts: `edgePath` gains the `'arc'` shape and a slot so an edge each way between two nodes separates, `placeLabels` declutters labels while always keeping the selected and active nodes' (and neighbours') labels, and node names and `summarizeGraph` state each node's group or hop. `GraphModel` carries `edgeShape`, `labelMode` and `groups`; `GraphNodeContext` takes `groupLabels`. Pure `.ts`, not yet exported (TP-1038).
- `custom/ActiveWork` task-stage vocabulary (`TASK_STAGE_META`, `TASK_STAGE_ORDER`, `toTaskStage`), `TaskStagePill`, and the `task-flow` and `task-pr` modules (`TaskFlowItem`, `compareTaskFlow`, `filterTaskFlow`, `taskKey`, `toTaskPrState`) (TP-860a).
- `Scatter`, `Treemap` and `Gauge` moved to `ui/charts/scatter`, `ui/charts/treemap` and `ui/charts/gauge` (`Components/Atoms/Scatter`, `Components/Atoms/Treemap`, `Components/Atoms/Gauge`); still exported from the package root, with class names and markup unchanged. The `custom/Scatter`, `custom/Treemap` and `custom/Gauge` paths are deprecated shims removed in 0.23.0 (TD-471).
- `ui/charts/network-graph` ego and clustered layouts: `egoLayout({ focusId, hops, direction })` places the nodes within N hops on rings around a focus with no random source, and `clusteredLayout({ seed, iterations, groups, ungroupedLabel })` lays each group out alone and packs non-overlapping regions in rows, ungrouped nodes last. Adds `GraphGroup`, `GraphGroupRegion` and the `groups` hint on `GraphLayoutResult`, and grouped, hub, chain and many-group fixtures. Pure `.ts`, not yet exported (TP-1037).
- `ui/charts/network-graph` force layout: `forceLayout({ seed, iterations })`, a deterministic `d3-force` layout stepped without `forceSimulation` (no timer), plus shared layout geometry, `edgeShape` and `labelMode` hints on `GraphLayoutResult`, and `d3-force` as a dependency. Pure `.ts`, not yet exported (TP-1036).
- `ui/charts/network-graph` model and layouts: `GraphLayout` (`{ key, compute }`), `layeredLayout`, `suppliedLayout`, graph cleaning, traversal and summary, and seeded fixtures at 5, 30 and 150 nodes. Pure `.ts`, not yet exported; the component follows (TP-1040).
- `DateTime` and `formatDateTime` moved to `ui/date-time` (`Components/Molecules/DateTime`); still exported from the package root. The `custom/DateTime` path is a deprecated shim removed in 0.23.0. `DateTime` takes `isLive`; `live` is a deprecated alias for it (TD-428).
- `FilePathLabel` and `splitPath` moved to `ui/file-path-label` (`Components/Atoms/FilePathLabel`); still exported from the package root. The `custom/ActiveWork/FilePathLabel` path is a deprecated shim removed in 0.23.0 (TD-418).
- `Page` and `PageHeader` (`ui/page`), a domain-free page container with a gutter, an optional centred max width, a header slot (optionally pinned in a sticky ruled band whose shadow shows whenever content scrolls under it) and a `main` landmark; the header and gutter tighten on small screens and a trailing action never moves the title (TD-408).
- `Popover` and `Menu` take `defaultIsOpen`; `Tooltip` takes `defaultIsOpen` and `onOpenChange`. All three share the new internal `useControllableState` hook (TD-268).
- `text-error` semantic token (`text-text-error`), error-coloured text that clears 4.5:1 on every
  surface plane in both themes; `status-error` stays for fills and borders (TD-248).
- `src/arch/component-catalog.json`, a generated catalog of every component: name, file, family,
  tier, maturity status, composed components and story ids, with the files it leaves out and why.
  `pnpm catalog` regenerates it; a freshness test fails when it is stale (TD-68).
- A `range` set in `SetBar`/`SetStrip` takes `isActive`; its done reps pulse like an active set's (VW-576).
- `DualPinnedLiveStrip` (`shell/workout`), the pinned live strip for a two-Voltra session, with
  its `LiveStripSlot` type. Exercise, set and rest draw once; each side draws its reps, last-rep
  velocity and bars in a lane (left above right) beside one `DualVelocityStrip`, in the single
  strip's 72px wall row. The wall names each side and its load; below 640px the phone marks the
  sides by position. Rest is one countdown beside the finished set. A fatigued side reddens the
  strip and its name; a dropped side (`isConnected: false`) stays with its wing faded (VW-439).
- `PinnedLiveStrip` takes an optional `targetSource` (`'plan' | 'last-time'`), exported as
  `LiveStripTargetSource`. With `'last-time'` the set line reads "Set 2 of 3 · last time · 140 lb"
  on the wall and "Set 2/3 · last time" on the phone, and the accessible name ends ", targets from
  last time". `'plan'` or omitted renders exactly as before (VW-644).
- `DualVelocityStream` takes `isDimmed`, which fades that side's wing in every dual variant (VW-439).
- A `Chat` family under `custom/`: `MessageList`, `MessageBubble`, `Composer`, `ChatCard`,
  `ConversationIdentity`, `DateSeparator`, `TypingIndicator` and `UnreadBadge`. A thread has a
  direct and a group layout, time rows with a drag reveal, an accent edge for endorsed messages
  and a windowed "Show earlier" page. It depends on the new `@titan-design/chat-protocol` package
  for its message and participant types (VW-393).
- `MarkdownProse` takes a `size` prop (VW-393).
- `StatCard` and `StatCardHeader` in `ui/stat-card`: a card template with header, figure,
  caption (`beside` or `below`), and a body pinned to the bottom. It sets the inset (`md` or
  `lg`), every gap between the slots, `overflow: visible` and the tip paint order in one place,
  and `onContentLayout` reports the content box. `BodyweightGoalCard` and `SessionsGoalCard`
  render through it with no visible change (VW-626).
- `MilestoneHero`, `MilestoneFacts`, `MilestoneWeekStrip` and `useResolvedMilestone` are exported
  from `GoalMilestoneSummary`, so a card can place each part in its own slot and share one copy
  of the gap, surplus and outcome maths. `GoalMilestoneSummary` renders as their composition
  with no visible change (VW-627).
- `pnpm check:package` runs `publint --strict` and `attw --pack --profile node16` on the built
  package. CI runs it on every PR, and the publish workflow runs it before `npm publish`, so an
  export map that regresses to "Masquerading as CJS" fails before a release. Only the two CSS
  subpaths and `tailwind.config.js` are excluded from attw, since none is a TypeScript entry (TD-41).
- `GoalTrajectoryChart` takes `currentWeek` and lights that week's column in the compact
  chart's tint (`text-secondary` at 0.2). Both charts draw it from one `CurrentWeekColumn`
  in the shared plot layer, and `GoalCard` passes its milestone's current week to the full
  chart as it already did to the compact one (VW-423).

### Changed

- `useTable`'s row type parameter is constrained to `object` instead of `Record<string, any>` (type-only). `pnpm lint` fails on any eslint warning (TD-201).
- The theme tests and `color-story-kit` share one colour-check module, `theme/color-checks.ts`, instead of each carrying its own contrast, OKLab and Machado-2009 maths (TD-230).
- The filled `Input` and the filled `Select` trigger share the inset elevation: the fill is one plane down from the enclosing plane in dark and the plane's own colour in light (where raised and overlay are both white, so a step down gave two wells for one plane colour), cut in by the inset-well recess on web (native keeps the flat fill); the Input drops the recess while focused so the focus border reads alone. Replaces `surface-input` on the Input and the `scrim-subtle` fill on the Select, which shifted with the plane under them (TD-278).
- The shell exposes page landmarks. `SideNav` is now a `navigation` landmark (named by a new `accessibilityLabel` prop, default `'Primary'`) instead of a `tablist`, and each `NavItem` is a `button` with `aria-current="page"` when active instead of a `tab` with `aria-selected`; native screen readers still get `accessibilityState.selected`. `TopBar` is a `banner` landmark. `AppShell` takes `isMainLandmark` to render its content region as `main` when the children are not a `Page` (off by default, since `Page` supplies `main`). Tests or automation that query the shell nav by `tab` or `tablist` must query `button` and `navigation` instead (TD-354).
- `DateTime` with `isLive` and a `value` now re-renders that value relative to the current time
  ("5 minutes ago" advances), ticking once per displayed unit (at most hourly) rather than every
  `refreshMs`; without a `value` it is still a clock. An unparseable `value` renders `fallback` ('-'
  by default) instead of the string "Invalid Date", in both `DateTime` and `formatDateTime`.
  `formatDateTime` gains an options overload `{ isUTC, hour12, seconds, locale, fallback, now }`;
  the positional `isUTC` and `fallback` still work. Relative time now rounds the magnitude, so past
  and future agree at half-unit edges: 89.5 minutes reads "1 hour", where it used to read "2 hours".
  `customFormat`, which was never applied, is `@deprecated` (TD-365).
- Breaking: `brand` is now required on `AppShell`, `TopBar` and `BrandLockup`, and no longer defaults to `voltras`. It takes a `BrandKey` or a `BrandPreset` object, so an app with no registry entry passes its own mark, wordmark, accent and subtitle. `resolveBrand` maps either form to the preset. The registry keys and values are unchanged, and `WorkoutShell` passes `voltras` itself. A caller that relied on the default must now pass `brand="voltras"`. This needs a minor bump (TD-373).
- Light mode takes the round-A token values: `border-input` and `border-input-hover` reach 3:1 on
  every content plane, the `hairline-*` alphas rise to 0.10 / 0.15 / 0.22 with `divider` at the
  `hairline-default` value, `status-success`, `status-info` and `status-warning` move to darker ramp
  steps, `text-link` moves to blue 700, and `background-base`, `on-control-idle` and the brand
  `-subtle` / `-muted` fills snap to ramp steps. Under a light surface the `Progress`
  track is the neutral `hairline`. Dark is unchanged apart from `border-input` (TD-674) (TD-488, TD-489, TD-490, TD-491).
- On web, `Link` and `BreadcrumbItem` given an `href` render a real `<a href>`, so middle, ctrl and meta clicks open a new tab and the address can be copied. A plain click still calls `onPress`, which then owns navigation; `isExternal` adds `target="_blank"` and `rel="noopener noreferrer"`; a disabled `Link` renders no `href`. Without `href`, and on native, both are unchanged (TD-493).
- The surface context (`SurfaceContext`, `useSurface`, `useSurfaceMode`) now lives in `src/theme/`, so `ThemeProvider` no longer imports from `components/`; `ui/surface` re-exports it unchanged (TD-511).
- Breaking for code that builds these shapes: `muscleReadModels` is re-synced with voltras-mcp and its mirrored types gain required fields. `MuscleStrengthExerciseRow` (and so `StrengthExerciseRow`) adds `setCount`, `currentLevel`, `relativeIndex`, `daysSinceTrained` and `recency`; `MuscleStrengthSection` adds `relativeIndexBySide` and `daysSinceTrained`; `MusclePlanSection` adds `frequency` (`plannedPerWeek`, `observedThisWeek`). A pinned sha and field-list type test now fail CI when the mirror drifts (TD-530).
- `PrBadge` renders a brand subtle `Pill` instead of `BaseBadge`; its props are unchanged. `WeekRow`'s workout chips, `WorkoutTopBar`'s session state, `TaskRow`'s severity cell and `FileHistoryExplorer`'s co-change pairs render `Pill` instead of `WorkoutPill`, `SessionStatePill`, `SeverityLabel` and `CoChangeChip`, so each takes a Pill capsule (fill, padding, radius). `WeekRowWorkout.status` is spelled out rather than borrowed from `WorkoutPillStatus`, with the same six values (TD-57).
- `SetRow`'s live `liveRepIndex` now picks the rep its spotlight strip grows from the baseline; it was ignored before. Without it the strip still grows the newest rep, as it did (TD-595).
- Dark `border-input` moves from grey 700 `#5A5958` to grey 500 `#888684`, matching light, so input
  borders reach 3:1 on every content plane. Dark `border-input-hover` stays at grey 600 and now sits
  darker than the resting border (TD-674).
- `src/arch/component-catalog.json` now fills each entry's `purpose` (the first JSDoc sentence on the entry export) and `props` (from react-docgen-typescript, inherited `node_modules` props dropped, sorted by name: `name`, `type`, `required`, `default` and `description`), and records `sources.props`. The freshness test regenerates through one docgen program and proves with a source overlay on `Alert.tsx` that a function-body edit passes while a changed purpose sentence or an added prop fails (TD-69).
- The package now declares Node 22 or later in `engines.node`, and CI runs on Node 22 only (TD-724).
- `pnpm audit:stories` retunes four DOM probes from a catch report (TD-740): `proximity-inversion` needs the inner gap to be 1.5 times the outer one and skips painted groups and control rows clearly nearer their content than their items are apart; `gap-outlier` skips `space-between` and auto-margin rows; `alignment-near-miss` reads the baseline a browser aligns a child by (an icon-first child at the icon's bottom). Every kind stays a warning.
- Light `brand-primary-solid` is orange 500 under the white `on-brand-primary` label, and light
  `brand-primary-hover` / `brand-primary-active` step down to orange 600 / 700; `Button` solid primary
  hovers and presses on those two tokens (TD-774). `Button` labels follow the theme: solid labels read
  the per-mode `on-*` token, so the light warning solid reads white on amber 500 (TD-773), and outline,
  ghost and link labels read `text-{tone}` instead of the base tone (TD-415). Decision 0003 records the
  tone recipe and the light solid ladder.
- Captions and helper text that carry content now paint `text-secondary` instead of `text-tertiary`: the `SectionHeader` subtitle, the valid `FormField` and `Autocomplete` helper text, the `Autocomplete` empty text and option descriptions, unreached `Progress` step labels, the Chat captions (`ChatCard`, `ConversationIdentity`, `DateSeparator`, `MessageBubble` writing and delivery, `RevealRow`, `TypingIndicator`) and the `InitiativeHeader` ship and updated captions. `text-tertiary` stays on redundant text: units, separators, placeholders and glyphs. A new test, `src/test/tertiary-role.test.ts`, fails on a new tertiary caption, `body2`, `overline`, `microLabel` or `monoLabel`, or a tertiary `text-xs` / `text-sm` class string, unless `tertiary-role-allowlist.json` names it (TD-785).
- `Scatter` sets its text from the new chart text kit: tick numerals in mono regular tertiary at
  `text-2xs` (10px, was 9px), axis titles in the heading face at `text-xs` (12px, was 10px), and point
  labels in the heading face at `text-2xs`. The kit (`ui/charts/kit/chartText.ts`) also defines the
  category and legend roles for the other charts (TD-787).
- FormField, Input, Autocomplete, Checkbox, CheckboxGroup, Radio, RadioGroup and Switch labels now render in the heading face; weight, size and colour are unchanged (TD-802).
- `font-heading` (Space Grotesk) now renders weights 400-500 as designed: the three `@font-face` rules declare `font-weight: 300 700`, matching the shipped variable files (wght 300-700), so medium and regular heading-face text no longer falls back to 600. Native consumers must register the lighter Space Grotesk weights themselves (TD-804).
- Mono text renders in JetBrains Mono (OFL 1.1), self-hosted in `src/theme/fonts/` like the other families. `fontFamilies.mono` and `--font-family-mono` are one stack, `'JetBrains Mono', monospace`, instead of two system-font lists that differed per host (TD-840). Its ligatures are off: `font-mono` sets `font-variant-ligatures: none`, so `!=` and `=>` show the two characters typed.
- **Breaking (0.x minor).** The Workout family and the motion kit leave the root entry for two new subpaths (decision 323a/c, TD-870). The root `dist/index.mjs` drops from 191.18 kB to 126.33 kB brotli. Nothing is renamed and no prop, type or rendered output changes; only the import path moves.

  - `custom/Workout` and `shell/workout` now import from `@titan-design/react-ui/workout`. This includes the type-only re-exports of the `/bodymap` and `/pages` props that the Workout barrel carried (`BodyMapProps`, `ActiveWorkoutPageProps`, …), and the `MuscleGroup` value.
  - `ui/motion` now imports from `@titan-design/react-ui/motion`.

  ```ts
  // before
  import { ExerciseCard, WorkoutShell, MotionProvider, spring } from '@titan-design/react-ui'
  // after
  import { ExerciseCard, WorkoutShell } from '@titan-design/react-ui/workout'
  import { MotionProvider, spring } from '@titan-design/react-ui/motion'
  ```

  Moved to `@titan-design/react-ui/workout`, values: `AGREEMENT_LABELS`, `bandLabel`, `BaseBadge`, `BodyweightGoalCard`, `calculateMeanVelocity`, `calculateVelocityLoss`, `CapacityBandChart`, `DashboardShell`, `defaultNavItems`, `deriveMilestoneState`, `deriveTrajectoryGeometry`, `DeviationBar`, `DeviceIndicator`, `DeviceMenu`, `DeviceRow`, `DualPinnedLiveStrip`, `DualVelocityStrip`, `ExerciseCard`, `ExerciseCardHeading`, `ExerciseHeading`, `exerciseHeadingLabel`, `ExerciseIndicator`, `exerciseLiveColor`, `exerciseRowStateColor`, `FatigueMeter`, `flattenDeloadWeeks`, `getVelocityLossColor`, `getVelocityZoneColor`, `getVelocityZoneName`, `GOAL_LIFT_CARD_STATUS_COLLAPSE_WIDTH`, `GOAL_MILESTONE_WALL_MIN_WIDTH`, `GOAL_PRIORITY_LABEL`, `GOAL_PRIORITY_MEANING`, `GOAL_TRAJECTORY_WALL_BREAKPOINT`, `GoalCard`, `goalCardMarkSize`, `GoalLiftCard`, `goalLiftStatusLabel`, `GoalMilestoneSummary`, `GoalMilestoneTile`, `GoalMilestoneWeekStrip`, `GoalPriorityIcon`, `GoalPriorityIndex`, `goalStatusBadge`, `GoalTrajectoryChart`, `groupPriorities`, `INDICATOR_PRECEDENCE`, `InputBar`, `IntensityBar`, `isLoadTarget`, `isMilestoneMet`, `LIVE_STRIP_GAP_COLOR`, `LIVE_STRIP_REST_MAX_SECONDS`, `LIVE_STRIP_ZONE_TOKEN`, `liveAuraColor`, `LiveAuraFrame`, `liveStripBars`, `liveStripGap`, `liveStripLastVelocity`, `liveStripMs`, `liveStripRepToken`, `liveStripRestReadout`, `liveStripRestType`, `liveStripTarget`, `MesoCard`, `MesoProgressBar`, `MesoStatusCard`, `MetricTiles`, `milestoneBlock`, `MilestoneFacts`, `milestoneGap`, `MilestoneHero`, `milestoneReach`, `milestoneToneToken`, `MilestoneWeekStrip`, `MuscleGroup`, `MuscleGroupChip`, `MuscleStrip`, `normalizeLossThresholds`, `paceTone`, `paceToneColor`, `PINNED_LIVE_STRIP_PHONE_MAX`, `PinnedLiveStrip`, `PlaceholderStrip`, `PrBadge`, `PrHistoryModal`, `PrimaryGoalCard`, `prRows`, `ReadinessCheck`, `resolveActualWeek`, `resolveIndicator`, `RestTimer`, `sameLiveStripReps`, `sameLossThresholds`, `ScheduleTiles`, `SegmentedBar`, `SegmentedProgressBar`, `SESSION_SEGMENT_LIMIT`, `SessionHeader`, `SessionRail`, `SessionsGoalCard`, `SessionStatePill`, `SET_STRIP_VARIABLE_COLOR`, `SET_STRIP_ZONES`, `SetBar`, `SetRow`, `SetsRepsLoad`, `SetStrip`, `SetTableHeader`, `SimpleMuscleGroup`, `slopeLabel`, `Sparkline`, `StatusDot`, `StatusPill`, `statusPillColor`, `strengthRowTitle`, `StrengthTrendChart`, `SupersetWrapper`, `TempoDisplay`, `trajectoryReach`, `trajectoryWeekScale`, `useResolvedMilestone`, `valueReach`, `velocityLossBand`, `velocityLossForRep`, `VelocityStrip`, `velocityZoneColor`, `VolumeLandmarkBar`, `WEEK_OUTCOME_LABEL`, `WeekRow`, `weekSegments`, `weekStripCells`, `WeightBadge`, `WHOLE_BODY_WALL_MIN_WIDTH`, `WorkoutCard`, `workoutNavItems`, `WorkoutPill`, `WorkoutShell`, `WorkoutTopBar`, `ZoneTrack`.

  Moved to `@titan-design/react-ui/workout`, types: `ActiveExerciseStatus`, `ActiveWorkoutExercise`, `ActiveWorkoutInput`, `ActiveWorkoutPageProps`, `ActiveWorkoutRecordedSet`, `ActiveWorkoutRest`, `ActiveWorkoutSuperset`, `BaseBadgeProps`, `BaseBadgeSize`, `BaseBadgeVariant`, `BodyMapData`, `BodyMapDetailPanelProps`, `BodyMapProps`, `BodyweightGoalCardProps`, `CapacityBandChartProps`, `CapacityBandDataPoint`, `CapacityBandProjection`, `ContributingExercise`, `DashboardShellProps`, `DeviationBarProps`, `Device`, `DeviceConnState`, `DeviceIndicatorProps`, `DeviceMenuProps`, `DeviceRowProps`, `DeviceRowState`, `DualPinnedLiveStripProps`, `DualVelocityStream`, `DualVelocityStripProps`, `E1RMBand`, `E1RMMethod`, `ExerciseCardHeadingProps`, `ExerciseCardProps`, `ExerciseDetailEntry`, `ExerciseDetailHeader`, `ExerciseDetailPageProps`, `ExerciseDetailStats`, `ExerciseDetailTab`, `ExerciseHeadingLayout`, `ExerciseHeadingProps`, `ExerciseIndicatorKind`, `ExerciseIndicatorProps`, `ExerciseRowDensity`, `ExerciseRowState`, `ExerciseTrend`, `ExerciseVbt`, `ExerciseVbtSet`, `ExpectedRepsRange`, `FatigueMeterProps`, `GoalActualPoint`, `GoalCardChart`, `GoalCardMilestone`, `GoalCardProps`, `GoalCardSize`, `GoalCardTrend`, `GoalDirection`, `GoalExpectedPoint`, `GoalLiftActual`, `GoalLiftCardDensity`, `GoalLiftCardProps`, `GoalLiftMilestone`, `GoalLiftStatus`, `GoalLoadMetric`, `GoalLoadTarget`, `GoalMilestoneGap`, `GoalMilestoneReading`, `GoalMilestoneSet`, `GoalMilestoneState`, `GoalMilestoneSummaryProps`, `GoalMilestoneTarget`, `GoalMilestoneTileLayout`, `GoalMilestoneTileProps`, `GoalMilestoneTileScale`, `GoalMilestoneValue`, `GoalMilestoneWeekAxis`, `GoalMilestoneWeekStripProps`, `GoalMuscleCardProps`, `GoalMuscleLift`, `GoalNextTarget`, `GoalPriority`, `GoalPriorityIconProps`, `GoalPriorityIndexEntry`, `GoalPriorityIndexGroup`, `GoalPriorityIndexProps`, `GoalReach`, `GoalTrajectoryChartProps`, `GoalTrajectoryGeometry`, `GoalTrajectoryGeometryInput`, `GoalTrajectoryStatus`, `GoalTrajectoryWeek`, `GoalValueMetric`, `GoalValueTarget`, `GoalWeekCell`, `GoalWeekEntry`, `GoalWeekOutcome`, `GoalWeekPhase`, `InputBarProps`, `IntensityBarProps`, `LiveAuraCategory`, `LiveAuraFrameProps`, `LiveStripBarColor`, `LiveStripGap`, `LiveStripRep`, `LiveStripRestStep`, `LiveStripSlot`, `LiveStripState`, `LiveStripTargetSource`, `LiveStripZone`, `Meso`, `MesoCardProps`, `MesoProgressBarProps`, `MesoStatus`, `MesoStatusBadge`, `MesoStatusBadgeVariant`, `MesoStatusCardProps`, `MesoStatusCoaching`, `MesoStatusGauge`, `MesoStatusMetric`, `MesoStatusNextTarget`, `MesoVolumeHeatmapEntry`, `MetricTileData`, `MetricTilesProps`, `MovementCategory`, `MuscleGlyphProps`, `MuscleGroupChipProps`, `MusclePlanExerciseRow`, `MusclePlanRemainingExercise`, `MusclePlanSection`, `MuscleStrengthAgreement`, `MuscleStrengthBestE1rm`, `MuscleStrengthExerciseRow`, `MuscleStrengthSection`, `MuscleStrengthSide`, `MuscleStripMuscleData`, `MuscleStripProps`, `NextTargetCoord`, `PaceTone`, `PinnedLiveStripLayout`, `PinnedLiveStripProps`, `PlaceholderStripProps`, `PlanMeso`, `PlanWeek`, `PlanWorkout`, `PrBadgeProps`, `PrHistoryModalProps`, `PrimaryGoalCardProps`, `PrimaryGoalChart`, `PrimaryGoalMilestone`, `ProgramBreadcrumb`, `ProgramNavLevel`, `ProgramPlanningPageProps`, `ProgramSelection`, `PrRecord`, `PrRecordType`, `PRType`, `ReadinessCheckProps`, `ReadinessFactor`, `RestTimerProps`, `ScheduleTilesProps`, `SegmentedBarProps`, `SegmentedBarSegment`, `SegmentedProgressBarProps`, `SegmentedProgressBarSegment`, `SessionHeaderPlanEntry`, `SessionHeaderProps`, `SessionRailExercise`, `SessionRailProps`, `SessionsGoalCardProps`, `SessionState`, `SessionStatePillProps`, `SetBarProps`, `SetRowProps`, `SetRowState`, `SetRowUnit`, `SetsRepsLoadProps`, `SetStripProps`, `SetStripSet`, `SetTableHeaderProps`, `SparklineProps`, `StatusDotProps`, `StatusDotVariant`, `StatusPillProps`, `StatusPillStatus`, `StrengthExerciseRow`, `StrengthTrendChartMesoBoundary`, `StrengthTrendChartProps`, `StrengthTrendDataPoint`, `SupersetWrapperProps`, `TempoDisplayProps`, `TempoLivePhase`, `TempoLiveReadout`, `TempoLiveState`, `TrainingStatusMuscle`, `TrainingStatusPageProps`, `TrainingStatusSummary`, `TrajectoryWeekScale`, `UpcomingExercise`, `VbtSummary`, `VelocityLossBand`, `VelocityLossThresholds`, `VelocitySet`, `VelocityStripProps`, `VelocityZoneBandProp`, `VolumeLandmarkBarProps`, `VolumeLandmarks`, `VolumeStatus`, `VolumeZone`, `WarmUpStatus`, `WarmUpValidation`, `WeekRowProps`, `WeekRowWorkout`, `WeightBadgeProps`, `WeightBadgeSize`, `WholeBodyDietPhase`, `WholeBodyDirection`, `WholeBodyRate`, `WholeBodyScale`, `WholeBodySessionsRow`, `WholeBodyWeightRow`, `WorkoutCardProps`, `WorkoutDot`, `WorkoutDotStatus`, `WorkoutGroup`, `WorkoutMuscleGroup`, `WorkoutMuscleVolumeStatus`, `WorkoutPillProps`, `WorkoutPillStatus`, `WorkoutProgress`, `WorkoutShellProps`, `WorkoutStatus`, `WorkoutTopBarProps`, `ZoneTrackBand`, `ZoneTrackMarker`, `ZoneTrackProps`, `ZoneTrackTick`, `ZoneTrackZone`.

  Moved to `@titan-design/react-ui/motion`, values: `back`, `Beat`, `BEAT_MOUNT_MARGIN_S`, `BeatFrame`, `cropInset`, `cubicBezier`, `easeIn`, `easeInOut`, `easeOut`, `envelope`, `interpolate`, `interpolateColor`, `interpolateScale`, `keyframes`, `linear`, `localTime`, `mediaClock`, `MOTION`, `MotionProvider`, `noise2D`, `poly`, `rafClock`, `random`, `randomRange`, `REDUCED_MOTION_END_S`, `seekClock`, `sequence`, `smootherstep`, `smoothstep`, `spring`, `springEase`, `springSettleS`, `stagger`, `useBeatEnvelope`, `useBeatTime`, `useLocalTime`, `useMotionTime`, `useRawLocalTime`, `useWaitUntil`.

  Moved to `@titan-design/react-ui/motion`, types: `BeatFrameProps`, `BeatProps`, `Clock`, `ClockKind`, `CropEdges`, `Easing`, `Envelope`, `EnvelopeOptions`, `EnvelopePhase`, `InterpolateOptions`, `KeyframesOptions`, `LocalTime`, `MotionProviderProps`, `Phase`, `RafClockOptions`, `SeekClock`, `Sequenced`, `SequenceOptions`, `SequenceResult`, `SpringEaseOptions`, `SpringOptions`, `StaggerOptions`.
- `ui/motion` refuses bad input instead of animating NaN: `seekClock().seek(t)` throws a `RangeError` for a non-finite `t` and keeps the previous time, `cubicBezier` throws for a non-finite argument or an x outside [0, 1] (as CSS does), a clock warns when its subscribers re-enter notify 10 deep and throws at 100, and `useBeatTime` (so `BeatFrame` and `useBeatEnvelope`) throws outside a `Beat` instead of reading a zero-length window (TD-873).
- `EvidenceChip` and `elideSource`, with their types `EvidenceChipProps`, `EvidenceChipSize`, `EvidenceKind`,
  `ElidedSource` and `ElisionLevel`, export from `@titan-design/react-ui/motion` instead of the root entry, so
  video work spends the `/motion` budget rather than the root's (TD-893). They are new in this release and
  no published version exported them from the root, so this changes no published import.
- `Alert` solid fills use `bg-status-<tone>-solid` for all four tones, so the dark error label clears 4.5:1 (3.83 to 4.59). The `Avatar` fallback (and the default `AvatarBadge`) uses `bg-avatar-background` and `text-avatar-text` in place of `bg-hairline-strong` and `text-text-inverse`, lifting the label from 1.38-2.88 to 4.88 (light) and 6.99 (dark). On a `solid` Alert the title, description, message, glyph and close mark read the fill's on-colour (`on-status-<tone>` in both themes; in light the white token sits at 3.63:1 and 3.12:1 on warning and info, large-text AA for the glyph only, by owner pick), the default glyph is 20px bold in the first text line's 20px line box so it centres on it, and the fill carries the paper grain (`paperFill`, new in `theme/materials`) (TD-482a).
- `global.css` self-hosts Inter, Nunito Sans and Space Grotesk instead of importing them from
  Google Fonts, so a single-file build opened from disk renders with no network. The woff2
  files are the ones Google Fonts served, with the same subsets and weights, and ship with their
  OFL licences under `src/theme/fonts/`. The package grows by 392 KB; a single-file build that
  inlines its assets grows by about 500 KB (TD-36).
- `PinnedLiveStrip`'s plane, title, state tag, overline, rest bar, "Back to live" link, set line,
  type scales and layout hook move to an internal `pinnedLiveStripParts` module, so a second
  strip form can share them. The strip renders the same, and `liveStripRestType`,
  `PINNED_LIVE_STRIP_PHONE_MAX` and `PinnedLiveStripLayout` are still exported from it (VW-634).
- `WorkoutPill`'s deload wash, rim and label and `WeekRow`'s deload row wash read the
  `status-deload` token for the surface's mode instead of the `WORKOUT_PILL_DELOAD` ramp pin. Both
  modes resolve to the same magenta, so nothing renders differently today (VW-531).
- `Checkbox`'s unchecked box, every unchecked `Radio` circle and the `Switch` off track draw
  their boundary with the `border-input` token instead of a `hairline` separator, so a control
  reads as a control. `border-input` itself still sits under 3:1 on every plane; its value is a
  separate token decision (TD-481).

### Deprecated

- `PrRecordType` is now a deprecated alias of `PRType`; use `PRType`. `FatigueMeter`'s `thresholds` prop
  accepts the readonly `VelocityLossThresholds`, and its default is `VL_LOSS_THRESHOLDS` (TD-584).

### Removed

- `@gluestack-style/react` and `@gluestack-ui/themed` are no longer installed with titan; nothing in the package imported them. A consumer that imports either directly must declare it in its own `package.json` (TD-312).
- `GoalTrajectoryChart` no longer takes `leftShadowSpread`, `baseline`, `bandFade` or `bandCurve`. These were design-exploration settings that have now been decided. The chart always draws the chosen treatment: a 4% left shadow, the `lip` baseline, the `centre-14` band fade and `monotone` band edges. The rendered output is unchanged. This is a breaking change to the props type, so it needs a minor bump. Before removing the props, the consumers were searched with `grep -rn "leftShadowSpread\|bandFade\|bandCurve\|baseline=" ~/projects/voltras-mcp/src ~/projects/titan-platform --include=*.tsx --include=*.ts`. voltras-mcp returned two comment hits and titan-platform returned only installed copies of this package, so nothing uses the props (TD-573).
- Removed unused utility exports (TD-588). Minor release, breaking for 0.x consumers of these names:

  - `utils/form.ts`: `getFieldValidationProps`, `createFieldId`, `getFieldAriaProps`, `isValidEmail`,
    `hasMinLength`, `hasMaxLength`, `isEmpty`, `validationRules`, `composeValidators`, and the types
    `FieldState`, `FieldWrapperProps`, `FormValues`, `FormErrors`, `FormTouched`.
  - `utils/colors.ts`: `getStatusColor`, `getResultColor`, `getLuminance`, `getContrastText`, and the types
    `StatusType`, `ResultType`. `alpha`, `lighten` and `darken` stay.
  - `utils/workout-format.ts`: `formatSignedPct`, `formatPrescription`, and the type `PrescriptionInput`.

  Consumer check, `git grep -n -w <symbol> -- packages/` at origin/main (`src/` has no other root):
  every form.ts and colors.ts symbol above hits only its defining file, `utils/index.ts` and
  `api/index.api.md` (`isEmpty` also matches unrelated local variables and `isEmpty` fields in chart hooks,
  none of which import it). `formatSignedPct` and `formatPrescription` hit only their defining file, the
  barrel, the API report and `workout-format.test.ts`. `StatusType`, `ResultType` and `PrescriptionInput`
  hit no other file in `src/`. `formatRepsRange` keeps its callers: `SetStrip.tsx` and `formatExpectedRange`.
- **Breaking:** `HelpTip` (with `HelpTipProps`, `HelpTipSize`, `HelpTipPlacement`, `HelpTipIcon`) and
  `LabelWithHelp` (with `LabelWithHelpProps`) are removed. Put a `Tooltip` beside your own label; the
  `HelpBesideLabel` story on `Tooltip` shows the pattern (TD-59).
- `ExerciseCard` no longer takes `onNavigateDetail` or `supersetColor`; no card variant read either, so passing them did nothing. The audit's `git grep -E "onNavigateDetail|supersetColor"` found 0 hits in all 5 consumers. Superset colour belongs to `SupersetWrapper`'s `color` (TD-595).
- `MetricCell`, `MetricCellProps` and `METRIC_FONT` are removed from the Workout barrel. `TempoDisplay` and `SetsRepsLoad` render their segments through `Typography` `mono`, so tempo digits and `sets × reps @ load` change from Inter to the mono face. Pre-1.0 removal: minor bump (TD-60).
- The `control-face` and `control-face-active` colour tokens are removed from the theme, the Tailwind config and the CSS. Nothing read them since the ToolbarButton faces moved onto the elevation planes; `control-face-disabled` stays (TD-771).

### Fixed

- `GhostSpark` and `DualGhostSpark` now expose a text alternative: the wrapper is an image with a label such as "Rep 5 of 8, peak 0.62 m/s" (the dual adds left and right peaks), an `accessibilityLabel` prop overrides it, and the `<svg>` is hidden from the accessibility tree so the band labels stop leaking (TD-240).
- Checked and selected state now reach the DOM under react-native-web, which drops `accessibilityState`. `Checkbox` emits `aria-checked` (`"mixed"` when indeterminate), `Radio` emits `aria-checked`, `Tabs` emits `aria-selected` on each `Tab`, and `Switch` drops its duplicate `accessibilityState.checked`. The checkbox and radio `aria-required-attr` stories-axe baseline entries are gone (TD-241).
- Selection, expansion and current-page state now reach the DOM under react-native-web, which drops `accessibilityState`. Table select cells emit `aria-checked` (`"mixed"` on a partially selected select-all), InitiativeBrief section headings emit `aria-expanded`, the active SidebarItem carries `aria-current="page"`, and the lab AwShell nav tabs emit `aria-selected`. The table `aria-required-attr` stories-axe baseline entries are gone (TD-243).
- `Toast` uses `role="status"` for non-error toasts (`alert` stays on errors), pauses its auto-dismiss timer while hovered or focused, hides its glyphs from assistive tech, and gives the close control `role="button"` (TD-260).
- A pressable `ListItem` now has the `button` role, and the `Chip` remove control is named after the chip's text label ("Remove Alpha"), falling back to "Remove" when the label is not text (TD-261).
- `FatigueLights` lights and `VelocityHero` now expose a named `role="img"` text alternative, and `GhostBand` is `aria-hidden` as decorative, so their axe tests can fail on a missing label (TD-350).
- `MessageList` exposes the thread as a named `role="log"` region (`accessibilityLabel`, default "Conversation"), and every message without a visible author line carries a visually hidden speaker ("You" or the author's name) for screen readers (TD-356).
- `Sidebar` is a navigation landmark, titled sections are labelled groups, parent items expose `aria-expanded`, text badges render inside `Text` (a zero badge renders nothing), and transition classes carry `web:` (TD-358).
- `TypingIndicator` holds its dots at full opacity and starts no pulse loop when the user prefers reduced
  motion, and stops a running loop if the preference turns on mid-session (TD-367).
  `usePrefersReducedMotion` no longer throws on unmount on a native platform where react-native-web
  returns no listener subscription.
- `NavItem` now names its live state for screen readers: while a set runs in a category that is not active, the accessible name is "Train, live" (new `liveLabel` prop sets the words). Nothing changes visually (TD-368).
- `CoChangeChip`, `FileHistoryExplorer`, `InitiativeCard`, `PortfolioOverview` and `SessionListItem` merge the caller's `className` through `cn()`, so a conflicting class replaces the root's own instead of sitting beside it; `SessionListItem` gains the `className` prop (TD-376).
- `chartEntrance` styles (`drawStyle`, `fadeStyle`, `popStyle`) are empty off web, so native gets no CSS transition strings or `transformBox`; the kit README names the limit (TD-380).
- `Gauge` paints its unfilled ticks with the `border-prominent` token for the current theme, the track colour `ZoneTrack` uses. They were white at 8% alpha and did not show on light surfaces (TD-473).
- `CardTitle` takes `level` (1 to 6, default 3) and renders that heading on web instead of an `h1` (TD-510).
- Playwright no longer reuses a server already on port 6006 or 5200, so a suite cannot screenshot another worktree's tree; the specimen server starts with `--strictPort` (TD-512).
- The six ESLint baseline updaters share one regen helper (`scripts/lib/regen-eslint-baseline.mjs`) that compares each file's keys, not its total, so swapping a grandfathered violation for a new one of another key is refused instead of absorbed silently (TD-513).
- The README Tailwind setup uses the titan preset, and the docs no longer show a bare-string `Button` child (TD-514, TD-517).
- `Autocomplete` keeps the label of an option clicked just after the input blurs; the 200 ms blur reset no longer overwrites it with the previous selection, and the timer is cleared on unmount (TD-523).
- `GoalTrajectoryChart` and `GoalTrajectoryMini` drop a NaN, null or infinite reading instead of drawing `NaN` into the line, the dots and the summary (TD-527).
- `TableHeaderCell` names its sort button from a new `sortLabel` prop instead of stringifying element children, and a non-sortable header now passes `testID` and `accessibilityLabel` through. `useTable` moves back to the last page with rows when `data` shrinks, and an empty table's range starts at 0 (TD-538).
- `MarkdownProse` now warns in development when a `ProseLinker` pattern carries regex flags such as `i` or `u`, which the combined tokenizer has always dropped; the `ProseLinker` docs state the rule (TD-542).
- `DateSeparator` steps back one local calendar day for "Yesterday" instead of 24 hours, so the day after a
  daylight-saving change no longer labels the day before yesterday "Yesterday" (TD-543).
- `SessionList` no longer reuses a React key for two period groups when sessions arrive unsorted and a month repeats; each group is keyed by position and label, and grouping order is unchanged (TD-544).
- `TempoDisplay` no longer renders an inert button (no role, tabindex or press styles) when neither `onPress` nor `showInfo` is set, and `ZoneTrack` now calls the consumer's `onLayout` as well as its own width handler (TD-548).
- `MesoCard`: the highlighted border now renders the brand-primary colour. An Animated interpolation passed through `style` overrode it with a value a plain `View` cannot use, so the card kept its default border. The unused `useHighlightBorder` hook and the no-op `Animated.View` wrapper are removed (TD-550).
- The custom ESLint ratchet rules now share one baseline helper: a checkout under a directory named `src` no longer lets `titan/no-upward-tier-import` pass everything, and a malformed baseline file now fails the lint run instead of being ignored (TD-552).
- The `scripts/` CLIs detect direct invocation through one shared `isEntryPoint`, so `check-play-count` and the other gates no longer exit 0 without running from a checkout path holding a space, `%` or non-ASCII. `design-freeze` creates its git tag only after the manifest and outerHTML extraction succeed (TD-553).
- `CircularProgress` and `CircularTimer` rings render on the native wall: the arc, track and done-label colours resolve to literal hex through `getSemanticColors` instead of CSS variables (TD-558).
- Every `SetBarChart` bar, and so every `VelocityStrip`, `DualVelocityStrip`, `VelocityHero`, `PinnedLiveStrip` and `RomProgressionChart`, draws the short soft shadow on a light plane. `SetBarTreatment.lightPaper` defaults to `soft` (was `raised`, which only `DualPinnedLiveStrip` overrode); dark planes are unchanged and `lightPaper: 'raised'` restores the paper's drop shadow (TD-764).
- `springSettleS` and `springEase` stay tight just above and below critical damping, where the settle bound used to blow up (TD-864). Both throw a `RangeError` for damping of 0 or less instead of returning Infinity and NaN (TD-865).
- `BodyMapDetailPanel` takes `unit` (`'lb' | 'kg'`, default `'lb'`) and labels its e1RM, band, PR and prior-best figures and the mini `StrengthTrendChart` with it instead of a hardcoded lb; `bandLabel` takes the same optional `unit`. Opening the sheet focuses it with `preventScroll`, so an off-screen sheet mid-slide no longer scrolls a narrow page sideways (VW-950).
- `DualPinnedLiveStrip`: a side's missed rep (an empty column where the other side has a rep) is
  now a hollow stub with a 2px ring in the on-surface secondary tone, 4.75:1 on the light card and
  4.58:1 on the dark card (was 1.27:1 and 1.41:1). On a light card the bars keep only a 1px
  contact shadow instead of the paper's drop shadow; dark bars are unchanged. The strip sets both
  through `SetBarTreatmentContext` (`custom/charts/setBarTones.ts`, internal, not exported), which
  `SetBarChart` reads. A chart outside the provider is unchanged (VW-877).
- `DualPinnedLiveStrip`: a side's missing rep is a filled stub again, no ring. Once the set ends it
  is missed, grey (`greyRamp` 600 light, 400 dark: 4.88:1 and 4.58:1 on the card); mid-set it is
  behind, blue (`blue` 600 light, 400 dark: 4.89:1 and 4.73:1). `liveStripGap` and
  `LIVE_STRIP_GAP_COLOR` in `liveStripModel` decide it from the strip's state. The light bars'
  shadow is `0 2px 5px` at 0.2 alpha, between the paper's drop shadow and the 1px contact shadow.
  `SetBarTreatment`'s `emptyVariant` is replaced by `emptyColor` (VW-879).
- `Drawer`'s overlay and the non-blur `Modal` backdrop use `bg-scrim`, the scrim scale's DEFAULT class. `bg-scrim-default` compiled to no rule, so web painted no scrim. A test now compiles both backdrop class strings, and `lint:borders` runs in `lint` and `verify` (TD-191).
- `VelocityStrip`'s loss and default zone colours resolve through the `dataviz-sequential` tokens
  for the surface's theme, like `PinnedLiveStrip`, so a light surface no longer gets the dark hexes.
  `getVelocityLossColor` takes an optional `mode` (default `'dark'`). Dark output is unchanged (VW-450).
- `VelocityStrip`'s `zones` colours resolve the five zone ids through the same `dataviz-sequential`
  tokens as `PinnedLiveStrip`, so the hero follows the theme in light mode. Dark output is unchanged (VW-749).
- `SegmentedBar`'s pulsing segments hold full opacity, and the `to` colour of a `pulseColor`, when the OS asks for reduced motion, instead of breathing (VW-325).
- `GoalTrajectoryChart` no longer leaves the current week unmarked when it has no reading. If
  `currentWeek` falls after the last reading and before `nextTarget`'s week, a hollow point in the
  status tone sits on the dashed lead at the value the lead passes through that week, and the
  accessible summary says "Current week, no reading yet (week N)". A current week with a reading
  draws as before. `deriveTrajectoryGeometry` takes `currentWeek` and returns `currentWeekPoint`
  (VW-422).
- `DualPinnedLiveStrip` takes an omitted `left` or `right` as a not-yet-bound slot and draws it as
  an empty side under its fallback name, and a slot's `reps` defaults to `[]`; either used to
  throw. A last rep whose velocity is not a finite number shows no velocity, in the numeral and
  the accessible name alike, instead of "NaN m/s". The chart inside the strip is hidden from
  assistive tech, so a screen reader reads the rep counts once (VW-638).
- The export map nests `types` under `import` and `require`, so an ESM consumer resolving with
  `moduleResolution: node16` gets the `.d.mts` declarations instead of the CJS `.d.ts`. All six
  TypeScript subpaths were "Masquerading as CJS" under attw; the `react-native` condition is
  unchanged (TD-40).
- `ZoneTrack` resolves its default track colour from `border-prominent` for the enclosing
  surface, so the track on `BodyweightGoalCard`, `FatigueMeter` and other callers that take the
  default turns light in light mode. Dark mode keeps the same grey, and an explicit `trackColor`
  still overrides it (TD-39).
- `Gauge`, `CapacityBandChart`, `ExerciseDetailPage`, `MesoStatusCard` and `StrengthTrendChart` resolve their colours for the enclosing surface's theme at render time, so `CapacityBandChart`'s dot outline turns dark on a light surface. Dark output is unchanged (VW-316).

### Security

- The ActiveWork fixtures (`session-fixture.ts`, `initiative-fixture.ts`) and the
  `PortfolioOverview` and `InitiativeBrief` tests and stories now use synthetic data. The shipped
  copies in 0.21.2 carried a home-directory path and personal initiative names. The unpublished lab
  data under `src/lab/active-work/data/` is synthetic too.

### Internal

- `titan/no-raw-spacing` now flags negative numeric literals such as `marginLeft: -7` (TD-12).
- `ui/table` API note and fixtures: the Table filtering and virtualization contract restated with amendments A1 to A5, and 11 fixtures including the real 60-finding titan-design list and a 10,000-row synthetic set. Pure `.ts` and `.md`, not yet exported (TD-161).
- `ui/table/table-model.ts`: pure `filterRows`, `toggleSetFilter`, `clearFilters`, `activeFilterCount`, `facetOptions`, `alignRange`, `missingRanges` and `windowSlice` for the Table filtering slice, with unit and property tests. `nextCell` moves from the DependencyMatrix model to `utils/grid-navigation.ts` so the Table grid mode can share it. Not yet exported (TD-162).
- `VelocityStrip.tsx` moves its pure scale code, slot model and loss-band overlay into `velocity-scale.ts`, `velocity-slots.ts` and `VelocityLossBands.tsx`; the public exports are unchanged (TD-174).
- `DualVelocityStrip` moves out of `VelocityStrip.tsx` into `DualVelocityStrip.tsx`, with its charts in `DualVelocityCharts.tsx` and its slot alignment in `dual-velocity-slots.ts`; the hero and dual-expanded charts share one wing builder. The public exports are unchanged (TD-175).
- `VelocityStrip` now builds its slots once with `useVelocitySlots` and renders each variant from `VelocityStripVariants.tsx` and `VelocityStripFramed.tsx`, with its summary math in `velocity-strip-model.ts`. Its props, exports and rendered output are unchanged (TD-176).
- Regenerated `arch-graph.json` so per-component metrics match main, and documented that those metrics are advisory because the freshness test cannot recompute them (TD-178).
- `ui/charts/line-chart` API note and fixtures: the LineChart contract restated with amendments A1 to A8, and 15 fixtures including a real 17-snapshot history with relabelled nodes. Pure `.ts` and `.md`, not yet exported (TD-179).
- `ui/charts/line-chart/`: the LineChart types, `line-chart-model.ts` (`cleanSeries`, `lineDomains`, `projectSeries`, `facetSeries`, `nearestPoint`, `nextPoint`), `summary-model.ts` (the image sentence per chart and per facet) and the `useLineChart` hook with the controlled active point, with unit, property and type tests. Not yet exported (TD-181).
- `ui/charts/line-chart/`: the `LineChart` shell on the TD-181 model. One plot of up to six series painted as a single image named by the generated summary, with gridlines, labelled reference lines and boundary rules, direct end labels or a legend, and a `Skeleton` and an empty placeholder for the loading and empty states. The points are one tab stop: arrow keys, Home and End move the active point, `aria-activedescendant` names it, a `Tooltip` readout follows it, and Enter or Space calls `onPointPress`. Facets beyond six series and the compact size are not drawn yet. Not yet exported (TD-182).
- Lint message contract: `eslint-rules/README.md` states it, and `lint-message-contract.test.ts` enumerates every `titan` and `no-restricted-syntax` message, requiring a fixture per new id and a shrink-only `PENDING` list for older ones. The Tailwind compile helper moves to `src/test/tailwind-compile.ts` (TD-192).
- Colour lint messages now list derived token options (TD-193). `titan/no-raw-color` maps a palette hue to its status role and lists that role's classes, and points a style colour at `useOnSurfaceColor` or `resolveColor`. `titan/no-var-color-opacity` lists the rungs the token publishes, or says it has none and names `alpha()`. The colour `no-restricted-syntax` entries live in `eslint-rules/restricted-syntax.js`. Detection is unchanged.
- Spacing and type lint messages now name the nearest scale steps with their `space.*` keys, the nearest classes for an arbitrary value, and the Typography variants and `text-*` keys, all derived from `fix-options.js`. The restricted-syntax message text moved into `restricted-syntax.js` (TD-194).
- `titan/no-upward-tier-import` names the tier to move the imported code down to (or the path a deprecated shim already moved to), `titan/no-deprecated-import` quotes the first sentence of the `@deprecated` tag and suggests the new name for a pure rename, and `titan/story-title-prefix` reads its roots from `.storybook/preview.tsx` and suggests one from the file's directory (TD-195).
- `titan/no-local-formatter` lists the exports of the formatter modules (now including `utils/time-format`), `titan/no-frozen-theme` lists the on-surface roles, and the device rules say what to render instead; `hyphenatedDataKey` computes the camelCase key. The five chat and three device ids leave the contract's `PENDING` set (TD-196).
- `ActiveWorkoutPage`, `ExerciseDetailPage`, `ProgramPlanningPage`, `ScheduleTiles`, `GoalMilestoneSummary` and `TimerReadout` tests now assert no axe violations; `ExerciseDetailPage` is also checked on its advanced tab and `ProgramPlanningPage` at its workout level. Their `a11y` entries leave the component anatomy baseline (TD-203).
- `CapacityBandChart` is split into smaller functions with unexported geometry, entrance-hook and part modules; rendered output is unchanged (TD-209).
- `ZoneTrack` and `Sparkline` are split into smaller functions with unexported helper modules; rendered output is unchanged (TD-210).
- `GoalTrajectoryChart` is split into a pure model, a hook and two parts, so the component body is 76 lines; props, exports and rendered output are unchanged (TD-212).
- `GhostBand` and `DualGhostSpark` are split into smaller functions with unexported helper modules; rendered output is unchanged (TD-214).
- `ExerciseDetailPage` and `ProgramPlanningPage` are split under 100 lines per function, with two unexported siblings (`ExerciseDetailSectionCard`, `ProgramPlanningBreadcrumbs`). `ProgramNavLevel` and `ProgramBreadcrumb` are now declared in the breadcrumb sibling and re-exported unchanged from `@titan-design/react-ui/pages`. No rendered, prop or className change (TD-215).
- `MesoCard`, `MesoStatusCard` and `WorkoutCard` are split under 100 lines per function. `MesoCard` and `MesoStatusCard` each gain an unexported `.parts.tsx` sibling (highlight animation, accent strip, press region and week list; coaching and next-target callouts), and `MesoStatusCard` and `WorkoutCard` gain in-file parts for the header, muscle chips and press region. No rendered, prop, export or className change (TD-216).
- `InputBar`, `RestTimer` and `TempoDisplay` are split into smaller functions, with unexported `RestTimerBar`, `tempoDisplayModel` and `tempoDisplayParts` siblings; rendered output is unchanged (TD-217).
- New token categories, palettes, ramp steps and primitives are recorded as numbered decisions in `docs/decisions/`, with a template, an index, ADR-0001 and a structure test (`src/test/decisions.test.ts`). `REJECTED.md` and `TOKENS.md` point at it (TD-229, TD-30 S1).
- Contrast is gated over declared foreground/background pairs in both modes, with a shrink-only baseline of the pairs that fail today; `token-contrast.test.ts` replaces `semantic-contrast.test.ts` (TD-231).
- Token tests now gate colour-vision deficiency and near-duplicate colours: `token-cvd.test.ts` holds the categorical all-pairs and `dataviz-diverging-*` / `dataviz-sequential-*` adjacent-step deutan/protan floors in both modes, and `token-near-dupes.test.ts` fails a new semantic colour within ΔE 3 of another, against a shrink-only `near-dupe-baseline.json` (TD-232).
- `tokens-doc-coverage.test.ts` fails when a colour root in `tailwind.config.js` has no backticked
  mention in `TOKENS.md` and no allowlist entry with a reason, and a pull request template carries the
  token-change checklist (TD-233).
- `scripts/export-color-inventory.mjs` writes the built primitive ramps and semantic colours as `ramps.json` and `colors.json` for the colour skill tools, with the commands in `docs/decisions/README.md` (TD-234).
- Drawer and IconBox variant tests now assert the rendered placement, size and colour classes instead of only that text renders (TD-282, slice A).
- CI's "Bundle budget" step runs `size-limit` against the brotli size of each ESM entry and `tokens.css`, with limits in `.size-limit.json` (TD-287).
- API Extractor reports for the six package entries live in `packages/ui/api/`; `pnpm api:check` fails CI when an export changes without `pnpm api:update` (TD-288).
- CI fails a PR or a `v*` tag whose `packages/ui` version bump is smaller than its API report diff requires: in 0.x a breaking diff needs a minor bump and an additive one a patch (TD-289).
- `pnpm docs:check` type-checks the `ts` and `tsx` fences in the markdown docs against the `src` entries and runs in CI. Fences that fail today are listed in a shrink-only baseline; a fence that is not standalone code opts out with the info string `tsx fragment` (TD-290).
- The doc examples in `README.md`, `TOKENS.md`, `DEPRECATIONS.md` and the root README compile against the real exports, and the illustrative snippets are marked `tsx fragment`. The `docs:check` baseline drops from 29 fences to the 4 in `CLAUDE.md` and one stale `README.md` fence (TD-291).
- `api-undocumented.test.ts` ratchets `(undocumented)` exports in the API reports against `api/undocumented-baseline.json`; the baseline only shrinks, and `pnpm api:update` refuses growth without `--allow-increase` (TD-292).
- `pnpm type-check:examples` type-checks the stories and tests, which `tsconfig.json` excludes, and runs in CI. Today's errors are counted per file in a shrink-only baseline: a new error fails, and so does a fixed one until its entry is lowered with `--update` (TD-293).
- Test capture now records each host node's `className` in a WeakMap, so `spacingClassesAt(node)` reads the rendered classes of an element found by text, role or label. `spacingClassesOf` and `spacingClassesAt` throw on an `Animated.*` element carrying a `className`, which NativeWind never applies (TD-294).
- The Menu `DestructiveItem` story now renders open through `defaultIsOpen`, and the Menu and Popover
  stories expose `isOpen` / `defaultIsOpen` controls on `Default` (TD-315).
- Port the story DOM checks and spacing-scale helpers into `scripts/audit-stories/` (TD-318).
- `scripts/audit-stories/targets.mjs` maps a diff to the stories it touches (TD-320, parent TD-316).
- `docs/audit-stories.md` documents `pnpm audit:stories`: its checks and finding kinds, `dom.json`, targeting, exit codes and the port rules; a test fails when a kind is missing from it (TD-322).
- `src/test/fixtures/stress.ts` holds the shared synthetic stress fixtures: label strings S-1 to S-5, number sets N-1 to N-6 and the W-1 matrix widths, with a test pinning each set's invariants (TD-323).
- New `titan/no-truncation` lint for `custom/` and `shell/`: truncation props, properties and classes are blocked outside a shrink-only baseline (24 sites in 18 files) and an owner allowlist. An unspent baseline allowance is reported as stale until `node scripts/update-no-truncation-baseline.mjs` regenerates it (TD-327).
- Fix drifted facts in the test-layer, render-testing, TOKENS and component-implementation prompt docs (TD-338).
- The `Theme Presets` and `PresetShowcase` stories, their visual validation screenshots and `.storybook/preview-head.html` are removed, and the deprecated-import baseline drops from 59 to 52 occurrences. `applyThemePreset` and `audiobookPreset` stay exported until audiobook migrates (TD-346, TD-2 S3).
- The catalog freshness test builds the catalog once and compares it with the committed file per entry, naming each entry that differs. Mutation tests through the generator's `read` injection prove a story status change fails, a story args change passes, and an emptied `storyIds` fails (TD-352).
- Add `custom-families.test.ts` and its shrink-only baseline for the generic and shim directories under `custom/`, and declare `Chat` as a domain family in `custom/README.md` (TD-366).
- Changelog entries are per-PR fragments in `changelog.d/` (`pnpm changelog:compile` folds them into `[Unreleased]` at release), and `component-catalog.json` drops its global `inputsHash`; the freshness test regenerates the catalog and compares it byte for byte. Neither file now conflicts between open PRs (TD-492).
- The framed `VelocityStrip` no longer passes the `bg-surface-raised` class, which NativeWind never applied to its `Animated.View`. Nothing rendered changes, and a test now fails if the strip starts painting a background (TD-509).
- The deprecation ledger now names voltras-mcp as a live consumer of `DashboardShell` and `defaultNavItems`; removal waits on its migration (TD-516).
- The `docs/ARCHITECTURE.md` token section shows verbatim excerpts of the real `greyRamp`,
  `primitiveRamps`, `semanticColorsDark` and `global.css` values, replacing samples that named
  symbols that do not exist and an indigo brand colour (TD-520).
- `milestoneReach` and `resolveTile` now route value targets through `valueReach`, and the surplus and gap share one lead-order helper, so one function decides short, met or beyond (TD-528).
- The specimen comparison suite now compares computed styles for the Sparkline, ExerciseCard, SupersetWrapper, InputBar and RestTimer pairs instead of asserting hard-coded React values (TD-532).
- Two fixtures import `seededRandom` from the chart kit instead of carrying their own copy of the generator (TD-566).
- `VelocityStripProps.hideBaseline` is removed. The prop was destructured and never read, so no variant honoured it and rendering is unchanged; `DualVelocityHero` no longer passes it to its wings (TD-594).
- Delete the unused specimen `htmlGroundTruth.tsx`, its dead velocity-mini CSS rules and three orphan baselines (TD-596).
- Corrected comments in the theme utilities and test helpers that stated false invariants (TD-598).
- The GhostBand hold-versus-idle test now asserts the luminance order (unfilled hold, idle, filled hold) instead of mere inequality (TD-602).
- Workout: the private status pills in `wholeBodyCardParts` and `MesoStatusCard` are renamed `GoalStatusPill` and `MesoStatusPill` so only the exported `StatusPill` keeps that name (TD-604); the `SessionHeader` and `MesoStatusCard` JSDoc now state what the code does (TD-616). No rendered change.
- The table README names `table-model.ts`, `useTableFilters.ts` and `useTableWindow.ts` as the owners of filtering and windowing, and the `carouselMath` comment on `stepIndex` points at `wrapIndex` (TD-606).
- The dataviz light-palette decision record names the test that pins it, `DatavizLightPalette.candidates.test.tsx`, and the `custom/charts` README indexes it as a token decision record (TD-609).
- The ActiveWork README composition trees and dependency map now match the imports, and the `task-stage` comment names its real consumer, `TaskStagePill` (TD-610).
- `GoalTrajectoryChart` docs and dead props: the charts README now describes its empty state, hidden `<svg>` and week-tip interaction as the code has them. Drops the unused `PlotStyle.referenceLabelSide`; `weekSpan` is now on the geometry. Nothing renders differently (TD-612).
- Rewrite stale comments in the Storybook preview, the story visual spec and the vitest config to match the code they describe (TD-618).
- `changelog:compile` takes `--help` and `--dry-run`, and refuses an unknown argument with exit 64 instead of folding the fragments (TD-623).
- MesoCard `StrengthBlock` story now uses its own Push/Pull/Legs week fixture instead of the Upper/Lower one (TD-634).
- The last non-`CLAUDE.md` fence leaves the `docs:check` baseline: the `README.md` Common Pitfalls border example now uses `resolveColor('hairline-default')` instead of a raw hex and the removed `WORKOUT_TOKENS.border`, so the baseline holds only the 4 `CLAUDE.md` fences (TD-635).
- Storybook now pre-bundles `@storybook/addon-themes` at startup, so Vite no longer re-optimizes and reloads the dev server mid-run, which blanked the first DualVelocityStrip visual stories; the 20 s cold-start guard from TD-636 is removed (TD-636).
- The DualVelocityStrip visual stories wait up to 20 s for their first render, so a cold dev server no longer trips the blank-render guard (TD-636).
- A blank Layer 2 story now fails with the page's console errors, failed requests and root markup, and the visual job uploads the failing run's screenshots and traces before the regen step empties them (TD-636).
- `VelocityHero` exposes one image instead of nesting the strip's own image inside it; the GhostSpark docs say what its text alternative carries; a TypingIndicator test turns reduced motion on mid-session (TD-637).
- The `titan/no-raw-composition` messages name backticked options the lint message contract validates, and every lint message id now has a fixture (TD-638).
- `TOKENS.md` documents the `dataviz-*` colour roles and the components that use them, and the
  colour-root coverage test no longer allowlists `dataviz` (TD-639).
- ProgramPlanningPage now has a test that selecting a week clears the open workout (TD-640).
- The `lint message contract: the checker` tests get a 30 s timeout like the spacing block, since the first case cold-imports the whole package barrel and hit vitest's 5 s default on a loaded CI runner (TD-642).
- The `visual` CI job skips its layers and ends green when a pull request changes no rendered UI (TD-645).
- `pnpm verify:changed` runs the checks CI fails on for the files changed against `origin/main`: prettier, eslint, type-check with the examples, catalog freshness, the decomposition ratchet, `arch:check` and the related tests, one process at a time (TD-646).
- `docs/design-freeze-workflow.md` lists the design-freeze steps in the order `design-freeze.mjs` runs them: commit check, both extractions, then the annotated tag (TD-647).
- Three script CLIs (`check-doc-examples`, `check-examples-types`, `check-release-bump`) use the shared `isEntryPoint` guard, so they still run when invoked through a symlink (TD-648).
- Storybook status tags: step 1 of the maturity rule in `MATURITY.md` now also covers stories titled `Lab/…` outside `src/lab`. These stories record design decisions, and the public Storybook build leaves them out. The ten `custom/Workout` `*.decision` stories and `VolumeStatusPalette` keep `status:lab`. Each now also carries `!status:review`, so it no longer inherits the review default as well (TD-649).
- `scripts/audit-stories/layout-collect.mjs` collects per-element layout, text baselines and ink for the
  D-35 DOM probes, with a real-browser fixture suite in `pnpm test:audit-probes` (TD-651).
- `pnpm audit:stories` warns on `stacked-inset`, `edge-clearance` and `inset-asymmetry`, judged from the layout collector (TD-652).
- `pnpm audit:stories` warns on `alignment-near-miss`: flex-row siblings whose top, centre, bottom and baseline all miss by a small amount, a baseline row that misses its baseline, and painted siblings a few pixels apart in height (TD-653).
- `pnpm audit:stories` warns on `gap-outlier` (one gap in a stack at least twice the smallest and 8px larger, unless a `--space-section-*` margin declares it) and `proximity-inversion` (a group whose items sit as far apart as the group sits from its neighbours) (TD-654).
- `pnpm audit:stories` warns on `font-size-near-miss` (two text sizes 2px or less apart on one visual line) and `font-size-drift` (one element's font size changes between widths of a story, reported once at the outermost element) (TD-655).
- Three review nits (TD-657). The three `shell/workout` `*.decision` stories and `DatavizLightPalette` keep `status:lab` and now also carry `!status:review`. `CapacityBandChart` treats a `null` projection as absent, as it already did for the projection pixels, so it no longer draws an empty projection layer. `titan/no-raw-spacing` now covers the 16 `custom/Workout` files that the TD-6 split wave created from enrolled parents.
- New `titan/no-unstyled-text` lint across `src/` (tests exempt): a react-native `Text` with no `className`, no `style`, no spread and no Text ancestor renders black 14px System on web, so it is blocked outside a shrink-only baseline (3 sites in 3 files). An unspent baseline allowance is reported as stale until `node scripts/update-no-unstyled-text-baseline.mjs` regenerates it (TD-659).
- New `titan/no-html-element` lint across `src/components/` (stories and tests exempt): a lowercase JSX element such as `<div>` or `<path>` mounts on web only, so it is blocked outside a shrink-only baseline keyed by file and element name. The message names the react-native primitive for an HTML element and the react-native-svg component for an SVG one. An unspent baseline allowance is reported as stale until `node scripts/update-no-html-element-baseline.mjs` regenerates it, and the script refuses an increase without `--allow-increase` (TD-689).
- New `titan/props-naming` lint across `src/components/` (stories and tests exempt): a `disabled`, `loading`, `selected` or `onClick` member declared on a type alias or interface named `*Props` is blocked outside a shrink-only baseline keyed by file and property name, and the message names the convention prop (`isDisabled`, `isLoading`, `isSelected`, `onPress`). Members inherited through `extends` or a type reference are not inspected, and a `selected` whose annotation is not boolean-shaped is read as a controlled value and left alone. An unspent baseline allowance is reported as stale until `node scripts/update-props-naming-baseline.mjs` regenerates it, and the script refuses an increase without `--allow-increase`. `titan/no-html-element` now names the exported `Link` for a lowercase `<a>` instead of Pressable (TD-690).
- `ui/code-viewer/lineModel.ts`: pure `splitLines`, `normalizeStartLine`, `normalizeRanges`, `rangesByLine`, `gutterDigits`, `rangeEdges`, `scrollIndexFor` and `buildLineModel`, plus the `useLineRange` headless hook (memoized model and the controlled or uncontrolled gutter selection), with unit, property and type-level tests. Not yet exported (TD-75).
- `titan/no-raw-caps` flags `uppercase`, `tracking-*`, `text-[Npx]`, `textTransform` and
  `letterSpacing` outside `Typography` and `Eyebrow`, ratcheted by `no-raw-caps-baseline.json`
  (`scripts/update-no-raw-caps-baseline.mjs` regenerates it). `typography-roles.test.ts` holds
  eyebrow sites to `overline` or `microLabel` on `text-text-secondary` and value sites to
  `font-bold` on `text-text-primary`, with today's misses in a shrink-only baseline (TD-782).
- `arch-graph.json` stores only nodes and whole-library figures; the edge list and counts are derived when read, so two PRs that each add a component no longer conflict in it. The barrel hash and `pnpm arch:barrel-hash` are gone; the freshness test now fails on a missing node or a node whose file was deleted (TD-792).
- Tag the remaining `custom/Workout` stories and the `ui/{menu,popover,modal,select,tooltip}` stories with the status the MATURITY.md rule derives (TD-8).
- `pnpm test:capture` builds a Vite beat page that renders six react-ui components through
  react-native-web and nativewind. It captures the page frame by frame under virtual time and checks
  that runs are identical, that frames do not depend on capture order, and that the seek median is
  under 100 ms (TD-845).
- The `BodyMapDetailPanel` every-section accessibility test gets a 30 s timeout; it takes about 0.25 s alone but hit the 5 s default once on a loaded CI runner (TD-927).
- The `RampAa` decision's accessibility test gets a 30 s timeout; it takes about 0.45 s alone but hit the 5 s default once on a loaded CI runner (TD-927).
- `ui/tree-view` API note and fixtures: the TreeView contract restated with amendments A1 to A5, and 11 fixtures including real titan-platform paths and a generated 5,000-row truncated set. Pure `.ts` and `.md`, not yet exported (TD-95).
- `ui/tree-view/tree-model.ts`: pure `indexNodes`, `visibleRows`, `ancestorsOf`, `nextFocus` and `typeaheadMatch` for the TreeView slice, with unit and property tests. `TreeNode` moves to `tree-view/types.ts`. Not yet exported (TD-96).
- `ui/tree-view/useTreeNavigation.ts`: the headless TreeView hook over the tree model. Expansion and selection each controlled or uncontrolled, a focused row with a roving tab stop, `revealId`, one `onLoadChildren` per unloaded expand, and a 500 ms typeahead buffer; selection never follows focus. `TreeRenderSlot<T>` joins `tree-view/types.ts`, and `TreeView.test-d.ts` checks `T` reaches both render slots. Not yet exported (TD-97).
- The `Lab/North Star/Live Wall Dashboard` story composes `WorkoutShell` instead of the deprecated
  `DashboardShell`; the deprecated-import baseline drops from 60 to 59 (VW-752).
- `titan/no-deprecated-import` follows `export * from` re-exports, so a deprecated export
  imported through a barrel such as `@/components/ui` is flagged (VW-322).
- `TempoDisplay` takes its fill percent, number tone and readout text from
  `custom/Fatigue/tempo-pacing` (`phaseFillPercent`, `pacingNumberTone`, `liveReadoutText`)
  instead of private copies. No visual change (VW-678).

## 0.21.2

### Added

- `Carousel` for multi-card goal sections on a phone: 24 px peek, 40 px arrow glyphs in 44 px hit boxes drawn below the cards but first in the tab order, swipe, looping, and a plain card when a section holds one item (VW-467, #274).
- `BodyweightGoalCard` and `SessionsGoalCard` (custom/Workout): the goals page's two
  non-lift goals, as sibling cards the page grid places. Bodyweight shows the latest
  weight, its rate this week ("Rate: -0.6%/wk", or "Rate: N/A"), a diet-phase tag that
  collapses to its glyph on a narrow card, and the weigh-in against this week's band in
  the goal chart's band colour. Sessions shows training days in the rolling 28-day
  window as one cell per committed day and a darker cell per day past it, with a
  due-by-now marker, and falls back to a plain bar past 20 cells. Each card holds its
  other detail lines in a tip. The pure logic is in `wholeBody.ts` (VW-455). Both
  cards share one track-row template, so two of them in a grid row line their tracks
  up and end level.
- `GoalPriorityIndex` (custom/Workout): every declared priority on one wrapping line,
  grouped by level, naming the ones nothing tracks (VW-455).
- `formatBodyweight` and `formatSignedRate` in `utils/workout-format`.
- `TrendingUpIcon` and `RepeatIcon`, the bulk and recomposition phase glyphs.
- `Metric` takes `valueClassName` and `labelClassName`, merged onto the value and label
  text, and names its label `${testID}-label`.

### Fixed

- `GoalTrajectoryChart`'s calibrating tip runs its two explanation sentences together,
  separated by a period and wrapping naturally, instead of stacking them on two lines
  (VW-559).
- `ZoneTrack` reserved a tick-label row even when no tick carried a label, which pushed
  its track up by the height of an empty row.
- `TipTrigger` closed on the first tap: the tap focused the trigger, which opened the
  tip, and the press then toggled it shut. A press now only opens; Escape, blur, hover
  out and a press outside still close it.
- `TipTrigger` gives its open tip `role="tooltip"`.

## 0.21.1

### Added

- `GoalTrajectoryChart` `yAxisLabels` and `ruleLabelText` (`numeric`, `named`,
  `none`), also reachable through a `GoalCard`'s `goal`, to bring back the 0.21.0
  axis (`yAxisLabels`) and words (`ruleLabelText="named"`).
- `GoalMilestoneSummary` `heroLeading` (`default`; `tight`), reachable through
  `GoalCard`'s `milestone` and `GoalMilestoneTile`. `tight` sets the hero
  numeral's line height to its font size, taking the empty leading above the
  "1 lb". `GoalCard` uses `tight` at both sizes (a `milestone` can still ask for
  `default`); `GoalMilestoneTile` keeps the default.
- `liveStripMs` and `liveStripTarget`, the pinned strip's input guards (a
  non-finite duration reads 0; a rep target is floored, and 0 when unusable),
  are exported beside the other `liveStripModel` helpers.
- `STAR_ICON_PATH` and `STAR_ICON_BOX` (the star glyph's path and its ink box in
  the icon viewBox) and `ICON_VIEWBOX`, so a chart can draw the same star as the
  PR badge, at the same size, from one source.
- `TipTrigger` takes `tabIndex` and `onKeyDown`, so a group of triggers can rove
  focus between them.
- `GoalTrajectoryChart`: every week of the block opens a tip, not only the next
  target. Each says the week's reading (or "No reading yet"), "Personal record"
  on a record, the planned band, "Deload week" on a deload column and the next
  target's label on its week. The tip is laid out, not stacked text: the week
  and badges for a record and a deload week in its upper right, then the reading
  as a figure and the planned band. A tip near an edge of the chart aligns to its
  week's edge instead of centring, so a phone does not cut it. Hover, keyboard focus and press open it; blur, Escape and a
  press outside close it. The week targets are ONE tab stop with a
  roving tabindex (arrows move, Home and End jump), because a goals page shows
  several charts. The separate next-target tip is gone; its label now sits in
  that week's tip.
- `GoalTrajectoryChart` and `GoalTrajectoryMini` draw the PR star from the PR
  icon's own path instead of a hand-rolled polygon, in the badge's own
  `brand-primary` (it was `status-warning`) and at the badge's size: 20px on the
  wall and 14px on a phone, the sizes a card's own PR badge takes there. The
  mini chart keeps its smaller mark scale at 12px.
- `GoalTrajectoryChart` (and every `GoalCard` and `PrimaryGoalCard` chart) drops
  the y-axis value labels by default and takes back their gutter: each gridline
  carries its value inside the plot, in the gridline's own hue (text at 30% where
  the line is 12%). The committed and stretch labels show their values alone
  ("185", not "Committed 185") in the rule's colour. Every in-plot number is placed
  clear of the readings, the tip targets and the other numbers; a gridline number
  at a committed or stretch value, or with no clear spot, is left out. The
  accessible name is unchanged and keeps the words. A `GoalCard`'s week cells
  follow the wider plot. **Consumers will see a visual change** on every goal
  chart.
- Loss-coloured bars band on the exact loss from the set's best, not on the loss
  rounded to a whole percent. This applies to `VelocityStrip` (every variant),
  `DualVelocityStrip` and `PinnedLiveStrip`, which share `velocityLossForRep`.
  With thresholds `[6.7, 13.3, 20]`, a rep at 13.33 percent now reads orange, as
  the consumer's unrounded check does; 0.21.0 banded it as 13 and read yellow. A
  loss equal to a threshold takes the higher band. **Bars within half a percent
  of a band edge can change colour against 0.21.0.** `velocityLossForRep` now
  returns the unrounded loss. The rule on every surface: **colour follows the
  exact loss; the number shown is the exact loss rounded down**
  (`shownVelocityLoss`), so a number never reads at or past a threshold the
  colour has not reached. With thresholds `[6.7, 13.3, 20]`, a 19.96 percent
  loss reads "Loss: 19%" beside an orange bar, and 20.0 reads "20%" beside a red
  one. `VelocityStrip`'s "Loss" text and `PinnedLiveStrip`'s accessible name can
  therefore read one percent lower than 0.21.0, which rounded.
  `calculateVelocityLoss` is unchanged and still rounds.
- `PinnedLiveStrip` without `onPress` is no longer a link: it has no link role,
  no "Back to live" button and no chevron, and reads as a labelled status region
  (`accessibilityRole="summary"`, a `region` on the web). Its accessible name
  drops the "Back to live:" prefix. **Pass `onPress` to keep the 0.21.0 look.**
- `GoalTrajectoryChart`, calibrating state: **the note is no longer written on
  the plane.** An info target sits in the plot's lower-right corner, inside the
  hatch, and its tip carries `calibratingNote` (or "No band yet" when it is
  empty or blank) followed by the two explanation lines at every width, set on a
  normal 18px line height. The target is a button named "Why is there no band?".
  It opens on hover, keyboard focus and press, closes on blur, Escape and a
  press outside, and has a 24px hit area (44px under a touch pointer). It never
  covers a reading, the line between them, the next target or the ramp: when low
  readings fill that corner in the last weeks, it hangs just under the plot. The
  tip opens in flow, right-aligned to the target, so it stays inside the card at
  every width. `calibratingNote` may now be a full sentence: the old in-plot fit
  no longer limits it. **Consumers will see a visual change** on calibrating
  goals.
- `TipTrigger` (and every tip built on it: the goal card's status and priority
  tips, the week strip, the chart's next-target tip) now also closes on Escape
  and on a press outside its trigger on the web, and the open tip is the
  trigger's accessible description (`aria-describedby`).
- `GoalMilestoneSummary` (and so `GoalCard`, full and compact): when week, best
  and goal cannot share a line and stack, they now sit with no gap between them,
  one step tighter than the `stack-sm` that separates them from the hero and the
  chart, and on a normal line height (18px) instead of the caption's loose 24px,
  so the three read as one block. The one-row layout is unchanged.
- `GoalTrajectoryChart`'s next-target tip grows its hit area from 24px to 44px
  under a touch pointer (coarse `pointer` media query, and on native), like the
  calibrating info target, and follows the pointer when it changes. Both boxes
  stay inside the chart, and the info target keeps clear of the next-target
  tip's real box. A calibrating chart whose info target hangs under the plot
  grows by the overhang, so the target stays inside the card. On a fine pointer
  nothing changes.
- `GoalCard size="compact"` (and `GoalLiftCard`): the gap between the name row
  and the hero ("1 lb to goal") is `stack-md` (8px) instead of `stack-lg`
  (16px), so the header reads as one block.
- `GoalCard` (full and compact, and `GoalLiftCard`): the hero numeral ("1 lb")
  sits on a line as tall as its font, taking the empty leading above it.

### Fixed

- `PinnedLiveStrip`: a non-finite `restRemainingMs` (NaN, Infinity or undefined)
  reads "0s" in the numeral and the accessible name instead of "NaNs", and a
  non-finite or non-positive `restDurationMs` draws no time bar.
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
  redraws only when a rep's velocity or zone, `targetReps`, the thresholds or
  the layout change. It compares by value, so a consumer that rebuilds `reps`
  each render still skips the redraw.
- `GoalCard` title: one long unbroken token (pasted garbage, not a real name)
  breaks inside the card instead of pushing past its edge, and a four-line
  safety clamp stops a runaway string growing the card. No real exercise name
  reaches four lines; names still wrap and are not truncated. `GoalLiftCard` and
  `PrimaryGoalCard` inherit it.
- `GoalTrajectoryChart`, calibrating state: the chart's accessible name now
  carries the whole note and says the line is the planned ramp from the start
  lift, not an expected band.
- `GoalTrajectoryChart`: a `calibratingNote` that opens with the status label
  ("Calibrating") logs a development-only console warning, since the card's pill
  already says it. The note still draws as given; production builds skip the
  check.

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

- `status-deload`, the deload magenta as a semantic token in both themes (it was
  a bare ramp pin, `WORKOUT_PILL_DELOAD`, washed by hand in `WorkoutPill` and
  `WeekRow`; those two should adopt the token next, and `ColorPalettes`'s deload
  swatch with them).

### Changed

- `GoalTrajectoryChart` shades a deload week in the product's deload magenta
  (`status-deload` at 0.12, the owner's pick in titan-0201 round 7) instead of a
  grey tint, so a deload week reads the same on the chart as it does on a
  `WorkoutPill` or a `WeekRow`. Measured in dark mode over the column: readings
  7.5:1, the PR star 5.5:1, the goal lines and their numbers 5.5:1, a calibrating
  ramp 3.0:1; the column against the plot 1.09:1.
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
