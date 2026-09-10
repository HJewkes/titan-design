# Rejected directions

Explorations that were tried and **deliberately not adopted**, with the reason.

## Why this file exists

A rejected exploration that stays in the repo stops looking rejected. The code
compiles, has stories and tests, and appears in the barrel — so the next person
(or the next session, after the conversation that rejected it has been
compacted) reasonably reads it as a working component and builds on it.

That is not hypothetical. `DualSessionRail` was rejected in the session that
produced it, then merged to `main` and shipped in the public barrel a few weeks
later by someone who saw a tested component with an open PR and concluded it was
finished work. Nothing in the repo said otherwise.

So: when a direction is rejected, **delete the code and add an entry here**. The
entry is the point — deletion alone loses the reasoning, and the same idea gets
re-proposed. If the code must stay for reference, it belongs in `src/lab/` with
a `status:` tag, never in the barrel.

An entry should say what was tried, what was chosen instead, and _why_ — enough
that someone can tell whether a future change invalidates the reasoning.

---

## Dual at the session-rail level — rejected 2026-07-25

**Tried:** `DualSessionRail` — a rail that split into left/right slot columns,
carrying the dual-Voltra distinction at the level of the _exercise list_.

**Chosen instead:** one consistent session rail over the exercises, with the
dual distinction surfaced at the **per-set / per-rep** level of detail. That
decision is what produced `DualVelocityStrip`.

**Why:** bilateral asymmetry is a property of how a _set_ was performed, not of
the session's structure. Splitting the rail made every exercise pay layout cost
for a distinction that only matters inside the active set, and it doubled the
rail's width budget — the rail is the persistent frame, so it is the wrong place
to spend space on a detail that is only occasionally relevant. Reading the
asymmetry where it happens (the rep columns) keeps the rail stable and puts the
comparison next to the data it describes.

**Status:** component, stories and tests deleted 2026-07-26; barrel export
removed. It had zero consumers in titan and zero in the voltras-mcp SPA — it had
become published API that nothing used.

**What survives it:** `DualVelocityStrip`, which is the direction this rejection
pointed at, and `SessionRail`'s `expandedIndex` (the current exercise expands in
place) — the rail stays single and consistent, and detail is revealed by depth
rather than by splitting the frame.

---

## Per-phase progress fill on the ghost band (2026-07-27)

**What it was:** the phase band doubling as a progress bar by filling each phase
run dark→bright across its own duration, so the leading edge of every phase read
brightest.

**Rejected because it re-opens the seam.** A per-phase ramp restarts dark at
every boundary, which butts a dark leading edge against the previous run's bright
tail. That reads as a visible step between sections — the exact "gap between
sections" failure `GhostBand` was built to close and that VW-85 row 5 exists to
catch. It also duplicates a signal the band already carries: the strip GROWS
left-to-right as the rep runs, so extent is already the progress encoding.

**Also learned, and worth not relearning:** the band is inherently a LAGGING
readout. A phase only becomes visible once it has accumulated width, so a 400 ms
bottom hold is still invisible while it is being held and a 280 ms top hold is
~18 px arriving at the very end of the rep. The band is a record of the rep, not
a live cue a lifter can act on mid-rep — do not spend effort trying to make it
one.

**Chosen instead:** ONE ramp across the whole band (`GhostBand progressRamp`),
dark at the rep's start → full tone at the leading edge. Contiguity survives
because there are no interior gradient restarts, and it still reads as "this rep
has been building". Holds became their own `hold` phase in amber, which is what
actually made a hold legible — not the fill.

---

## The whole-band progress ramp, and amber holds (2026-07-27, superseded same day)

Both of these shipped in `fc46330` and were replaced hours later by phase pacing.
Recording them because the _reasons_ they lost are the useful part.

### The gradient ramp

**What it was:** one dark→full gradient across the whole band, so the rep's start
sat back and the leading edge read at full tone.

**Why it lost:** it encoded progress as _shading over the extent already drawn_,
which is a second encoding of something the band's WIDTH already says. It also
could not answer "how am I doing against the prescription", because it had no
notion of a target — it only ever showed how far the rep had got, not whether
that was fast or slow.

**Chosen instead:** per-phase pacing. Each run paints a muted base with a fill
earned against its own prescribed duration (`elapsed / target`, capped), and the
label takes the pacing tone. Same "fills left to right" instinct, but measured
against something.

### Amber holds

**What it was:** `hold` as its own phase hue, amber, to separate a deliberate hold
from idle dead time.

**Why it lost — a genuine conflict, not a taste call.** The pacing tone uses
warning-**amber** for "ahead of target". A phase painted amber therefore collides
with the semantic signal drawn on top of it. `TempoDisplay` had already written the
governing rule down: phase hues are "deliberately NON-semantic ... so the phase hue
never collides with the semantic pacing tones". Amber holds violated it; we just
hadn't added the pacing tones yet, so nothing collided until they arrived.

**Chosen instead:** hold returns to the grey family, separated from idle by VALUE
(unfilled `charcoal[300]` < idle `charcoal[200]` < filled `charcoal[100]`), by the
`HOLD` label, and by the fact that a hold PACES while idle never fills. Grey also
reads more like a hold: a held position is an absence of movement, not an event.

**What survives both:** the `hold` SamplePhase split itself, which is still
load-bearing — it is what lets a hold carry a label, a target and a fill at all.

### Raised paper fill on the band (2026-07-27)

**What it was:** the pacing fill carrying the system's paper material — matte
`feTurbulence` grain, a top rim-light, and a contact shadow cast past its leading
edge into the well — so the fill read as a physical block that had travelled.

**Why it lost — the payoff is scale-dependent and the two lockups disagreed.**
Rendered in the real `LiveFatigueCard`, at `BAND_H` 16 px in a ~280 px band, it was
indistinguishable from flat: the well's falloff and the rim-light each had about two
pixels to work in, on a strip at the bottom of a tall card. In the mirrored dual, at
720 px wide, it read clearly — but that is exactly where the band sits BETWEEN the
two wings, so making it tactile set it competing with the traces it exists to
support. A treatment that is invisible where it is cheap and risky where it is
visible is not worth the code.

**Chosen instead:** the inset WELL alone, unconditionally. It costs one gradient,
survives at 16 px, and delivers the part that actually mattered — the unearned
remainder reading as empty channel rather than a darker shade of the phase. No prop:
where nothing is prescribed the fill covers the run and the recess is hidden anyway.

**Worth keeping in mind:** `barPaper` (`theme/bar-paper.ts`) is CSS
`boxShadow`/`backgroundImage` for RN Views and does NOT apply to the band, which is
pure SVG. Any future material work there has to be re-expressed as SVG defs — that
translation cost is real and was part of why this did not pay for itself.

---

## The five ActiveWork lab specimens, once the family was hardened (2026-09-08)

**What they were:** `Lab/ActiveWork/{Portfolio Overview, Task List, Session
Reader, Initiative Reader, File History Explorer}` — the pre-hardening design
specimens in `src/lab/active-work/`. Each hand-rolled its own `DotLabel`,
`Eyebrow`, `MiniBars`, `shortDate` and severity maps out of `shared.tsx`, and
composed them inside an `AwShell` frame.

**Superseded by** the hardened family, which is what those specimens were drawn
to produce:

| Deleted specimen                         | Hardened story                          | Landed in |
| ---------------------------------------- | --------------------------------------- | --------- |
| `Lab/ActiveWork/Portfolio Overview`      | `Custom/ActiveWork/PortfolioOverview`   | #156      |
| `Lab/ActiveWork/File History Explorer`   | `Custom/ActiveWork/FileHistoryExplorer` | #157      |
| `Lab/ActiveWork/Task List`               | `Custom/ActiveWork/TaskTable`           | #161      |
| `Lab/ActiveWork/Session Reader`          | `Custom/ActiveWork/SessionReader`       | #164      |
| `Lab/ActiveWork/Initiative Reader`       | `Custom/ActiveWork/InitiativeReader`    | #165      |

**Why:** a specimen that outlives its hardening stops reading as a specimen. It
is a second, older rendering of the same screen sitting one sidebar group away
from the real one, and its hand-rolled parts are exactly the reuse failures the
family's README records as *deleted* (`DotLabel` → `StatusDot`, `MiniBars` →
`SparkBars`, inline `shortDate` → `DateTime`). Keeping them invites the next
session to copy the wrong one, and it makes the ActiveWork family read as split
across two groups in a tree whose whole point is one place per thing.

**What survives:** `Lab/ActiveWork/File Biography` — never hardened, so it is
still a live proposal rather than a stale copy — plus `AwShell`, `shared.tsx`
and the `data/` fixtures it depends on.

---

## The three relocated fatigue variant references (2026-09-08)

**What they were:** `Lab/Components/{Ghost Spark, Velocity Hero, Verdict Hero}`
— variant studies lifted out of the fatigue-card exploration in #163 "so a
variant reference survives for hardening". They rendered the lab-local
`fatigue-lab-shared` forks (`SparkCombinedChart`, `HeroWithVlBands`,
`FatigueCard`), not the components.

**Superseded by** the hardened components, all landed in #128 and reviewed in
#147: `Custom/Fatigue/Ghost Spark` (`GhostSpark.tsx`), `Custom/Fatigue/Velocity
Hero` (`VelocityHero.tsx`), `Custom/Fatigue/Verdict Hero` (`VerdictHero.tsx`).

**Why:** the hardening they were kept for has happened, so the reference has
been consumed. What remains is a fork — a second implementation of each mark in
`fatigue-lab-shared`, with its own colour math — presented in the sidebar under
a `Lab/Components` group that the six-group tree does not have. The variants
that were considered and lost are recorded in the exploration
(`Lab/North Star/4 - Fatigue System`) and in this file, which is where that
reasoning belongs; a running copy of the loser is not the record.

---

## `Lab/Archive/Surface` — the surface option-comparison stories (2026-09-08)

**What it was:** twelve option-comparison stories (Ramps, SeparationTreatments,
TextureOptions, NeutralVsWarm, WarmthCurves, AtScaleComparison, AlphaLayering,
SkeuomorphicCard, WarmthCurvesAtScale, PaperModels, TopBarTreatments,
FrameRecess) split out of the surface exploration when the direction locked.

**Superseded by** `Lab/North Star/1 - Surface System`, which carries the three
locked stories and, in its file header, the decision list the comparisons were
run to produce (derived warm-tapered ramp, alpha-white hairline separation,
static dither + grain, paper on hero surfaces only).

**Why:** the archive is a snapshot of a decision that has since been re-made.
The ramp it compares is the pre-#166 warm one; elevation now resolves to the
grey ramp, so every "which warmth curve" story argues about an axis the system
no longer has. `surface-lab-shared.tsx` stays — the North Star file imports it,
and `surface.contract.test.ts` carries a verbatim copy of its `lstar()`.

---

# Backfill — the ten archived directions and three retired token sets (2026-09-10)

Everything below was already superseded when this file was written; the entries
are recorded late, under E5. Each names what it was, what replaced it, and why.

These differ from the entries above in one way that matters: **the code was not
deleted.** All ten directions survive as stories under `src/lab`, which this
file's own rule allows ("if the code must stay for reference, it belongs in
`src/lab/` with a `status:` tag, never in the barrel"). They carry `status:lab`
and `src/lab` is excluded from publish builds, so none of them is reachable API.
Read them for the reasoning; do not build on them.

---

## `Lab/Design Archive/Fable Directions` — the four drill-down directions (2026-09-10)

**What it was:** frozen HTML captures of the four parallel drill-down directions
from the fable pass — A stage-rail, B expand-canvas, C miller-columns, D
glance-overlay — plus the R2 synthesis that converged them and a body-part
navigation pass. Landed as an archive in #99.

**Superseded by** `Shell/SessionRail` and its specimen, both from
[S3 Session Rail (#92)](https://github.com/HJewkes/titan-design/pull/92). The R2
rail is the direction that won, and it exists as a real React component.

**Why:** three of the four directions lost, and the winner has since been built,
tokenised and tested. What is left is pre-titan HTML carrying its own inline CSS
variables — not titan tokens, not the v0.10.0 surface ramp — so every value in it
is wrong even where the layout is right. The comparison it supports (which
drill-down shape) was settled; keeping it live invites a reader to treat a losing
direction as an available option.

---

## `Lab/Design Archive/Feature Explorations` — the round-1 feature galleries (2026-09-10)

**What it was:** round-1 galleries for live fatigue autoreg, live tempo feedback,
load-velocity profile, rep quality / RPE, session debrief and session velocity
timeline, plus the round-2 load-velocity follow-up. Frozen HTML, archived in #99.

**Superseded by** the `Custom/Fatigue` family from
[Phase C (#128)](https://github.com/HJewkes/titan-design/pull/128), reviewed in
[#147](https://github.com/HJewkes/titan-design/pull/147) — `LiveFatigueCard`,
`FatigueLights`, `GhostSpark`, `VerdictHero`, `RomProgressionChart` — which is
the shipped answer to "live fatigue autoreg" and "rep quality / RPE".

**Why:** these were feature *questions*, and the ones worth answering have been
answered in components with a data contract (`LiveFatigueModel`), tests and
stories. The captures cannot show what the shipped answer looks like because they
predate the token system. The one gallery with no shipped counterpart — the
across-session load-velocity profile — is recorded in `Lab/Archive/Curves/Set
Level` (below), which at least renders in titan.

---

## `Lab/Design Archive/Foundations (superseded)` — the colour-system R&D captures (2026-09-10)

**What it was:** three captures from the colour-system R&D pass. Each is titled
"final" in its own markup, and each was overtaken by a later pass. Archived in #99.

**Superseded by** `categoricalPalette` in `theme/tokens/primitives.ts`, landed in
[TD-05.09 (#85)](https://github.com/HJewkes/titan-design/pull/85) and consumed
from [#86](https://github.com/HJewkes/titan-design/pull/86); the `Foundations/Color`
stories were rebuilt around it in
[#141](https://github.com/HJewkes/titan-design/pull/141).

**Why:** the captures disagree with what shipped on every axis. They show 9 hues,
a main/light/dark variant split, and a hue order with a CVD floor of 8; the
shipped palette is 7 ordered hues in two variants (`default`, `dark`), ordered
blue → magenta → red → orange → green → cyan → amber, with
`CATEGORICAL_CVD_SAFE_MAX = 6`. A specimen that calls itself final and is not is
the most expensive kind of stale doc — the file header says so, which is the only
reason these are still readable safely.

---

## `Lab/Design Archive/Screen Prototypes` — the full-screen prototype captures (2026-09-10)

**What it was:** the latest capture of each full-screen prototype from
`voltras/docs/prototypes`, plus the built R2 dashboard SPA iframed as its static
bundle. Archived in #99.

**Superseded by** `Lab/North Star/Live Wall Dashboard`
([#109](https://github.com/HJewkes/titan-design/pull/109)) for the wall, and the
`Pages/*` story group ([#82](https://github.com/HJewkes/titan-design/pull/82)
moved pages off the root barrel) for the screen-level compositions.

**Why:** a whole-screen prototype is the single artefact most likely to be read
as "the design", and these are the least current thing in the repo — a static
bundle of an SPA that was rebuilt in React, against a palette that no longer
exists. The screens that mattered are now compositions of real components, which
means they move when the system moves. These do not.

---

## `Lab/Design Archive/Shell Specimens` — the S1 and S2 HTML specimens (2026-09-10)

**What it was:** the S1 top-bar and S2 side-nav specimens from the dashboard
shell wave, as frozen HTML. Archived in #99.

**Superseded by** the React shell family:
[S1 · Top bar (#84)](https://github.com/HJewkes/titan-design/pull/84) and
[S2 · Side nav (#89)](https://github.com/HJewkes/titan-design/pull/89). S3 never
had an HTML specimen — it went React-first.

**Why:** the specimens did their job; both units shipped, with the decisions they
were run to settle recorded in `shell/README.md` (lucide glyphs, the "Plan"
label, the left accent bar, 60px icon+micro-label). The HTML now measures
differently from the components — `gotchas.md #12` documents exactly this drift,
a nominal 46px nav button rendering at ~37px — so reading a dimension off these
captures produces a wrong component. That failure mode is why the workflow is
React-first now.

---

## `Lab/Archive/Curves/Per Rep` and `Curves/Set Level` — the SVG curve explorations (2026-09-10)

**What they were:** two exploration story files landed lab-only in
[#163](https://github.com/HJewkes/titan-design/pull/163). *Per Rep* rendered
smooth per-rep curves (inline `<svg>` + Catmull-Rom bezier) over the ~11 Hz
per-sample stream — time, position, velocity, force, phase. *Set Level* rendered
the review/analysis counterpart: the derived set- and session-level curves from
the VBT literature, including an across-session load-velocity profile.

**Superseded by** `Lab/North Star/3 - Diverging Bars` and the shipped
`Custom/Fatigue` marks from
[#128](https://github.com/HJewkes/titan-design/pull/128) — `GhostSpark`
(per-rep velocity over time), `RomProgressionChart` and `SetBarChart`.

**Why:** the north star converged on a **bar** vocabulary, not a curve one. A bar
per rep is countable, survives at the 3px `mini` size the strip needs, and shares
one geometry module (`custom/charts/SetBarChart`) across the hero, the dual and
ROM. A smooth curve is none of those: it needs a continuous sample stream at
render time, it does not degrade to a strip, and it gave every family its own
path-drawing code. The channel discipline both files established — velocity is
the one saturated hue, force/ROM/position are neutral parchment geometry —
**survived** and is the rule the shipped marks follow.

The across-session load-velocity profile in *Set Level* has no shipped
counterpart and needs backend plumbing to assemble. It is the one live proposal
in either file; if it is picked up, it starts from the signals audit, not from
this rendering.

---

## `Lab/Archive/Grinding Line` — the pure-deviation tempo tint (2026-09-10)

**What it was:** a decision story from
[#163](https://github.com/HJewkes/titan-design/pull/163) rendering three rep
archetypes under two tint rules. **Option A ("Deviation")** tinted the current
rep's line by how far its concentric duration departed from the prescribed tempo.
**Option B ("Control-aware")** tinted by the grind signature — the within-concentric
velocity collapse from the concentric's peak to its mid/late trough.

**Rejected:** Option A. Option B shipped as
`ghostLineColor(tempoDeviation, grindSignature)` in
`custom/Fatigue/fatigue-tokens.ts`
([#128](https://github.com/HJewkes/titan-design/pull/128)).

**Why:** Option A tints by deviation *magnitude*, so any slow concentric warms —
including a rep that is slow because the lifter is doing deliberate tempo work.
Smooth, steady, low velocity, no failure: factually off prescribed tempo, but not
a form breakdown. A grind — velocity collapsing mid-concentric, the rep barely
completing — is a breakdown signal, and to a pure-deviation tint the two look
identical. Colour that cannot separate "controlled" from "failing" is worse than
no colour, because it trains the lifter to ignore it. The shipped rule keeps a
smooth rep green regardless of speed (`grindSignature < 0.35` → green, intensity
by `tempoDeviation`) and warms only on collapse.

---

## `Lab/Archive/Rep Breakdown` — the four multi-dimension per-rep encodings (2026-09-10)

**What it was:** four encodings plus an Overview, from
[#163](https://github.com/HJewkes/titan-design/pull/163), each trying to carry
three dimensions of a rep at once — velocity (concentric m/s), cadence (tempo
adherence vs `[ecc·pauseBottom·con·pauseTop]`) and ROM (depth vs full). The mock
set planted two "cheat" reps (fast bar, cut ROM, dropped eccentric) so an
encoding had to make that jump out to earn its keep.

**Superseded by** the fatigue system's **split** of those dimensions across
separate marks in [#128](https://github.com/HJewkes/titan-design/pull/128):
`GhostSpark` carries velocity-over-time with tempo embedded,
`RomProgressionChart` carries ROM, and `FatigueLights` carries the per-dimension
verdict as three dots.

**Why:** the premise was right and the packaging was wrong. A rep really can hide
form breakdown behind acceptable velocity, and that is exactly what
`FatigueLights` exists to surface. But loading three dimensions into one mark
made every encoding either unreadable at the size the wall actually renders, or
readable only by someone who had learned its legend. Three marks that each say
one thing, arranged in one card, answer the same question and each survives being
looked at for a second. The **fatigue-model** vocabulary (`tempoDeviation`,
`grindSignature`, the cheat-rep archetypes) came out of this exploration and is
still in `fatigue-mock.ts`.

---

## `Lab/Archive/Hero Tempo` — the separate hero-scale tempo treatment (2026-09-10)

**What it was:** three hero-scale tempo treatments — hero numerals, a cadence
bar, an ambient clock — each shown as a mini dual-hero (the real
`DualVelocityStrip` plus a split aura, tempo in the gutter). Archived in-place
and landed lab-only in [#163](https://github.com/HJewkes/titan-design/pull/163);
the decision itself is dated 2026-07-23.

**Superseded by** tempo **embedded in the ghost-spark chart** — `GhostSpark` over
`GhostBand`'s phase runs, from
[#128](https://github.com/HJewkes/titan-design/pull/128). There is no separate
hero tempo element.

**Why:** the exploration was run because the vertical `TempoDisplay` in the
gutter clashed with the warm hero — magenta/cyan phase-identity chips and a
compact mono treatment beside a velocity ramp and a split aura. All three
replacements solved the clash by making tempo *bigger*, which spends hero space
on a prescription the lifter already knows. Embedding it in the band spends no
space at all: the phase runs are already drawn, so labelling them carries tempo
for free and puts it next to the rep it describes. The lesson generalises — when
an element clashes with the hero, check whether it needs to be in the hero.

---

## The `inset` surface level (2026-09-10)

**What it was:** a seventh surface plane below `frame`, on the pre-unification
grey ladder.

**Superseded by** `frame` itself, which is both the bezel the ramp sits inside
and the floor a pressed surface clamps at
([TD-07.14 / TD-07.16, #149](https://github.com/HJewkes/titan-design/pull/149)).
`PLANE_ORDER` is now six levels: `frame · background · base · elevated · raised ·
overlay`.

**Why:** measured at **ΔE 1.10** from `frame`, `inset` was an imperceptible
duplicate — a level nobody could see, that every consumer nonetheless had to
choose between. `pressedLevel()` clamping at `frame` gives the same behaviour
with one fewer name. The general rule this established: a plane earns its place
by being distinguishable from its neighbours, and that is a measurement, not a
design preference.

---

## `tonalFill` and `ditherTile` (2026-09-10)

**What they were:** two materials in `theme/materials.ts`. `tonalFill` painted a
ΔL\* 3 gradient across a large surface to give it tonal interest; `ditherTile`
overlaid a quantisation dither to stop that gradient banding.

**Rejected on wall measurement**, not on taste:
[VW-99 run 1 (#151)](https://github.com/HJewkes/titan-design/pull/151) deleted
`tonalFill`, [run 2 (#152)](https://github.com/HJewkes/titan-design/pull/152)
deleted `ditherTile`. The reasoning is preserved in the `materials.ts` module
header, which is the part worth keeping.

**Why:** `tonalFill` was invisible on the wall. It spread ΔL\* 3 smoothly over
~300 px, which is where human contrast sensitivity is at its worst — a
spatial-frequency problem, not an amplitude one, so the band between "invisible"
and "decorative" may simply not exist at that scale. `ditherTile` was held one
run because "probably dead weight" is not a measurement; run 1 could not test it,
since an invisible fill has no gradient to band. Run 2 settled it by drawing a
hand-quantised reference beside the smooth control — the same tone span as five
hard-edged 1-level steps. The reference banded plainly; the smooth gradient did
not. The panel can resolve banding, and this render path does not produce it. A
mitigation for an artefact that does not occur is cost with no benefit.

---

## The `data-1..10` dataviz scale (2026-09-10)

**What it was:** ten semantic colour tokens (`data-1` … `data-10`) mapped onto
the discrete-rainbow primitive, intended as the chart-series palette.

**Superseded by** `categoricalPalette` + `CATEGORICAL_CVD_SAFE_MAX` in
`theme/tokens/primitives.ts`
([TD-05.09, #85](https://github.com/HJewkes/titan-design/pull/85)). `TOKENS.md`
§1 records the supersession
([#157](https://github.com/HJewkes/titan-design/pull/157)) and
`ColorPalettes.stories.tsx` story 11 carries the "Do not use for new work" note.

**Why:** the ten tokens were picked by eye from a rainbow, so they carry no
CVD guarantee, no nested-stability property, and no defined order. The
categorical palette is 7 ordered hues in two variants, nested-stable — a chart
with N series takes the first N, and adding a series never recolours the existing
ones — with a stated colourblind-safe ceiling of 6 and the 7th flagged as
extended.

**Still shipped, deliberately.** `data-1..10` remains in `semantic.ts`,
`global.css` and `tailwind.config.js`, and **no component consumes it**. It is
kept because the token set is public API and removing it is a breaking change
that has not been scheduled; it is listed here because it is the single easiest
wrong turn in the system — the names look like the obvious choice for chart data.
If you reach for `bg-data-3`, you want `categoricalPalette`.
