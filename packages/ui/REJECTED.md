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
