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
