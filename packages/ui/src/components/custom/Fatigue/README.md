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
   │  ├─ StatusDot            (Workout/ — the dot primitive, glow)
   │  └─ Tooltip              (ui/tooltip — hover detail)
   ├─ RomProgressionChart     (per-rep silver/red depth bars + reference lines)
   ├─ GhostSpark              (per-rep velocity-time sparkline; tempo EMBEDDED)
   └─ Surface                 (ui/surface — the base-plane, paper-accented card ground)
```

## Tier map

**Atoms** — `VerdictHero` · `FatigueLights` · `RomProgressionChart` · `GhostSpark`
**Molecules** — `VelocityHero` (VelocityStrip + VL bands)
**Organisms** — `LiveFatigueCard` (the card, one data contract) · `LiveFatiguePanel` (hero + card + aura)

## Reuse audit — composed, not hand-rolled

- **`StatusDot`** (Workout/) — the fatigue lights are `StatusDot` (glow) + a mono label
  inside a `Tooltip`; no re-implemented dot.
- **`Tooltip`** (ui/tooltip/) — the per-dimension hover detail.
- **`VelocityStrip`** (Workout/) — the hero reuses it verbatim; `VelocityHero` only adds
  the loss-relative VL20/VL30 band overlay on the strip's own peak scale.
- **`LiveAuraFrame`** (Workout/) — the coaching flood.
- **`Surface`** (ui/surface/) — the card ground (`level="base"`, one step above the
  `background` shell), separated by the alpha `hairline-default` edge and finished with
  the shared `barPaper` accent; no hardcoded surface hex.
- **Tokens** — colours come from `getSemanticColors` / `primitiveRamps`; formatting from
  `roundTempo`. No literal surface/status hex constants.

**No new top-level primitives promoted.** Every genuinely-new leaf here (verdict hero,
lights, ROM chart, ghost-spark) is fatigue-specific with a single consumer (the card),
so per the ≥2-consumer rule they stay in the family rather than becoming shared atoms.
The reusable pure helpers (`ghostLineColor`, `auraForVerdict`, `mixHex`) live in
`fatigue-tokens.ts`.

## Locked design calls (applied)

- **Velocity hero = loss-relative** — VL20/VL30 decision bands (not absolute velocity
  zones). See *deferred* below for the bar-fill recolour.
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

## Data plan / follow-ups

- **Store wiring:** `LiveFatigueCard` consumes `LiveFatigueModel` from voltras-mcp's
  `mapStoreToFatigueModel` (`panels/fatigue-view.ts`), replacing the provisional
  hand-rolled `live-page/FatigueCard.tsx` spike. The velocity hero's per-rep velocities
  are NOT on the model (they come from the live-view velocity path) — passed as the
  panel's separate `velocity` prop.
- **Deferred — VelocityStrip loss-relative bar fill:** the locked call also wants the
  hero's BAR FILL recoloured gold→orange→red by velocity loss (not absolute zone).
  VelocityStrip has no loss-relative colour mode; `VelocityHero` owns the band overlay
  only. Recolouring needs a new `VelocityStrip` prop (a follow-up — not done here to keep
  VelocityStrip reused as-is).
- **Deferred — velocity bar "grow up from bottom" animation:** the locked call wants the
  live bar to grow from the baseline (tracking the rep) rather than the current
  drop-in/pop. That is VelocityStrip-internal animation; a follow-up on VelocityStrip.
