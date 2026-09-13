# Fatigue component family

The aligned **"Live panel v2"** hardened into titan components: the live velocity
hero beside the always-on fatigue card. Everything consumes one read-model
(`LiveFatigueModel`) — a titan-local mirror of voltras-mcp's
`src/dashboard/spa/live-page/fatigue-model.ts`, sourced from real WA analytics
(`getSetFatigueVerdict` / `getSetWorkingROM` / per-sample telemetry). Files live flat;
the tier map below is a documentation contract, not a directory layout.

## Composition tree (composes-↓ / used-by-↑)

```
LiveFatiguePanel              ← the composition (Live panel v2)
├─ LiveAuraFrame              (Workout/ — coaching flood, category tracks the verdict)
├─ VelocityHero               ← primary read
│  └─ VelocityStrip           (Workout/ — reused as-is; VL bands overlaid on its peak scale)
└─ LiveFatigueCard            ← secondary read (consumes LiveFatigueModel)
   ├─ VerdictHero             (RPE number + verdict word, tone-flooded)
   ├─ FatigueLights           (VEL/ROM/TEMPO "why" dots)
   │  ├─ Indicator           (ui/indicator — the dot primitive, glow)
   │  └─ Tooltip              (ui/tooltip — hover detail)
   ├─ RomProgressionChart     (per-rep silver/red depth bars + reference lines)
   ├─ GhostSpark              (per-rep velocity-time sparkline; tempo EMBEDDED)
   │  ├─ GhostBand            (the phase-coloured axis band — ECC/CON labelled inside)
   │  └─ GhostBloom           (the ghost fan + silver→red current line; orientation up/down)
   ├─ DualGhostSpark          (dual-Voltra: ONE GhostBand + TWO mirrored GhostBlooms)
   │  ├─ GhostBand            (the SAME band, centred, shared by both devices)
   │  └─ GhostBloom ×2        (left up / right down — a one-prop flip, one shared scale)
   └─ Surface                 (ui/surface — the base-plane, paper-accented card ground)
```

## Tier map

**Atoms** — `VerdictHero` · `FatigueLights` · `RomProgressionChart` · `GhostBand` · `GhostBloom`
**Molecules** — `VelocityHero` (VelocityStrip + VL bands) · `GhostSpark` (band + one bloom) ·
`DualGhostSpark` (one band + two mirrored blooms)
**Organisms** — `LiveFatigueCard` (the card, one data contract) · `LiveFatiguePanel` (hero + card + aura)

## Reuse audit — composed, not hand-rolled

- **`Indicator`** (ui/indicator/) — the fatigue lights are an `Indicator` (glow) + a mono
  label inside a `Tooltip`; no re-implemented dot. Roadmap decision 10 settled the two
  competing dots in `Indicator`'s favour and this README used to name the loser.
  `FatigueLights.tsx:12` still imports the deprecated `StatusDot`; that call site migrates
  under AW-127 (`DEPRECATIONS.md`). Compose `Indicator` in anything new here.
- **`Tooltip`** (ui/tooltip/) — the per-dimension hover detail.
- **`VelocityStrip`** (Workout/) — the hero reuses it verbatim; `VelocityHero` only adds
  the loss-relative VL20/VL30 band overlay on the strip's own peak scale.
- **`LiveAuraFrame`** (Workout/) — the coaching flood.
- **`Surface`** (ui/surface/) — the card ground (`level="base"`, one step above the
  `background` shell), separated by the alpha `hairline-default` edge and finished with
  the shared `barPaper` accent; no hardcoded surface hex.
- **`GhostBand` / `GhostBloom`** — the single `GhostSpark` and the dual `DualGhostSpark`
  compose the SAME band + bloom; the dual is the bloom with `orientation="down"`, not a
  second renderer. No forked path / band / tint code, so a bloom improvement reaches both.
- **Tokens** — colours come from `getSemanticColors` / `primitiveRamps`; formatting from
  `roundTempo`. No literal surface/status hex constants.

**No new top-level primitives promoted.** Every genuinely-new leaf here (verdict hero,
lights, ROM chart, ghost-spark) is fatigue-specific with a single consumer (the card),
so per the ≥2-consumer rule they stay in the family rather than becoming shared atoms.
The reusable pure helpers (`ghostLineColor`, `auraForVerdict`, `mixHex`) live in
`fatigue-tokens.ts`.

## Locked design calls (applied)

- **Velocity hero = loss-relative** — VL20/VL30 decision bands (not absolute velocity
  zones). See _deferred_ below for the bar-fill recolour.
- **ROM chart + ghost line = ONE silver/red scheme** — silver when right, only SHADES OF
  RED when there's an issue (no greens, no ambers). Shared constants `SILVER` /
  `RED_LIGHT|MID|DEEP` live in `fatigue-tokens.ts`; both consumers import them. The ghost
  line (`ghostLineColor`): controlled rep stays silver, dimming toward grey with
  `tempoDeviation` (a drift cue, never a colour); a collapsing rep (`grindSignature ≥ 0.35`)
  runs light→mid→deep red by severity. ROM bars: silver at/above working, light red below
  working, deep red below the short threshold. (The verdict tones and the velocity-loss
  VL20/VL30 bands are a SEPARATE language — unchanged.)
- **RPE only** — no reps-in-reserve line; the number + verdict word carry exertion state.
- **No separate top alert** — the card covers exertion state.
- **Tempo carried by the ghost-spark phase BAND** (`PHASE_AXIS_COLOR`) — no mini-tempo
  digits, and no standalone hero-tempo component.

## Responsive geometry (TD-03.58 / TD-03.60)

`panel-layout.ts` is the panel's single geometry source — a pure module with no
`react-native` import, so the tiers are unit-tested without `onLayout` (which never fires
under jsdom, gotcha 6). `LiveFatiguePanel` measures its own width (`SIZE-D01`:
container-driven, not a `size` prop) and calls it; `containerWidth` overrides the
measurement for tests and for a consumer that already knows the width.

| tier | width | layout | padding · gap | card width |
| --- | --- | --- | --- | --- |
| `xs` | < 600 | stacked | 16 · 12 | full content width |
| `sm` | 600–999 | stacked | 20 · 14 | full content width |
| `md` | 1000–1199 | row | 24 · 18 | 318 |
| `lg` | 1200–1919 | row | 24 · 18 | 318 |
| `xl` | ≥ 1920 | row | 24 · 18 | `0.22 × width`, clamped to 318–460 |

The edges are titan's own `primitiveBreakpoints`, asserted by identity in
`panel-layout.test.ts` so nobody can quietly swap in a hand-picked set. Padding and gap
are deliberately frozen from `md` up: voltras-mcp's `panel-geometry.ts` derives its stage
chrome from them, and moving them would overflow the wall stage.

`panelBodySplit` is the one-height rule: side by side, the hero and the card both take the
whole `bodyHeight`; stacked, they share it (card 0.55, gap taken out first). Both numbers
come from one call, so `bodyHeight` moves both or neither.

Nothing here animates. A tier change is a re-layout, never a transition — the panel is
read from across a room mid-set, and the visual baselines need a deterministic render.

## Data plan / follow-ups

- **Store wiring:** `LiveFatigueCard` consumes `LiveFatigueModel` from voltras-mcp's
  `mapStoreToFatigueModel` (`panels/fatigue-view.ts`), replacing the provisional
  hand-rolled `live-page/FatigueCard.tsx` spike. The velocity hero's per-rep velocities
  are NOT on the model (they come from the live-view velocity path) — passed as the
  panel's separate `velocity` prop.
- **Open — voltras-mcp duplicates the panel geometry:** `panel-geometry.ts` hardcodes
  `FATIGUE_CARD_WIDTH = 318`, `PANEL_PAD = 24` and `HERO_EYEBROW_ALLOWANCE = 26` so the
  idle stage can prefigure the panel. Those are now derivable — `panelLayout` /
  `panelBodySplit` / `HERO_EYEBROW_ALLOWANCE` are exported from this family's barrel. Until
  the SPA imports them, its idle stage will draw a 318 card placeholder where the live panel
  draws an expanded one on an `xl` display.
- **Deferred — VelocityStrip loss-relative bar fill:** the locked call also wants the
  hero's BAR FILL recoloured gold→orange→red by velocity loss (not absolute zone).
  VelocityStrip has no loss-relative colour mode; `VelocityHero` owns the band overlay
  only. Recolouring needs a new `VelocityStrip` prop (a follow-up — not done here to keep
  VelocityStrip reused as-is).
- **Deferred — velocity bar "grow up from bottom" animation:** the locked call wants the
  live bar to grow from the baseline (tracking the rep) rather than the current
  drop-in/pop. That is VelocityStrip-internal animation; a follow-up on VelocityStrip.
