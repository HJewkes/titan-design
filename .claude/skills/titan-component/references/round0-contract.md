# Round 0 contract and the functional gate

A contract before any pixels, and an adversarial review after the visual lock. Library facts
are not repeated here; each section names the doc that owns them.

## Round 0: the contract

The implementer writes a short contract in the PR body before round 1. The operator confirms
it. It is a text decision, so it goes through a question, not the review harness.

1. **What the data means.** One paragraph. A framing that changes after pixels exist throws
   away every round built on the old one.
2. **Considered existing.** The three nearest existing components or primitives. For each:
   reused, extended, or not suitable, with the reason. Build the list from
   `packages/ui/src/arch/arch-graph.json`, `packages/ui/MATURITY.md`, the components' JSDoc and
   `packages/ui/REJECTED.md`. This narrows the Gate 1 overlap survey from "should we invest" to
   "what exactly do we compose" (`compose-primitives.md` > The process rules).
3. **Props sketch.** Names and types only. Domain numbers are props
   (`compose-primitives.md`, rule 2).
4. **Fixtures from real data**, including the degenerate cases: docs/component-states.md >
   Degenerate data counts as a state.
5. **The four states**: which apply and which do not, per docs/component-states.md >
   Checklist.

**A generic component adds an API design note** (one page, same PR). A generic component is one
built for more than one consumer. The note covers the props; controlled against uncontrolled
state (named by CLAUDE.md > Component Development > Placement, Slots paragraph); composition
slots; the WAI-ARIA pattern it follows, by name; the virtualization approach, if any; where the
logic lives so it tests as pure hooks and functions (docs/test-layers.md); and the primitives it
composes.

## Composition story before composition sign-off

Every wave has a story that shows the component inside its real page with real fixtures. The
operator approves composition only there, never from the isolated story. Pieces approved alone
do not always read together.

## Review surface

Variant picks go through the review harness at responsive widths from round 1. A question is
kept for decisions that are not about renders. Every brief names the fallback (named captures
and a question) in case the harness fails. Mechanics: `review-rounds.md`.

## The functional gate

Runs after the operator locks the render and before Gate 2. It is the third condition of
Gate 2 (SKILL.md > Definition of done). Nothing merges on visual approval alone.

An independent reviewer agent with a read-only profile, never the implementer, attacks the
component and reports each finding with a reproduction:

- logic and input validation, with edge-case and hostile data;
- keyboard and screen-reader behaviour against the named WAI-ARIA pattern, because axe finds
  only part of the accessibility issues and none of the keyboard ones;
- performance at the scale the contract named (for example a large virtualized table);
- API ergonomics from a consumer's seat: write the consumer code and note every surprise.

Each defect is fixed or deferred with a ticket before the merge. Round 0 and this gate keep the
middle of the pipeline free of operator input: Round 0 is part of align, and an agent runs the
functional gate.

## Evidence rules

- Every "looks wrong" claim carries a DOM measurement, taken with `tools/measure-render.mjs`.
  An apparent clip is often uneven padding.
- Every verification claim names the assertion or baseline that verified it: verify.md
  step 13.
- The coordinator grades the diff and the numbers, not the agent's summary.

## A corrected rule becomes a written rule

When the operator corrects a rule (a status colour, a state mapping), the same change does three
things. It records the rule in the repo (`TOKENS.md` or a decisions doc). It applies the rule to
every surface, with a grep as proof. Where possible it adds a lint rule whose message names the
fix.

## When a component is finished

Gate 2 decides that the design is right. The test layers decide that the component is finished:
`packages/ui/MATURITY.md` > Clause 5: every applicable test layer, and docs/test-layers.md. The
PR names each missing layer and why it is missing.

## The process ledger

Keep one ledger per wave, outside this repo, beside the coordinator's notes. Record rounds per
component, agent cost, harness friction, the reuse decisions from Round 0 and the defects the
functional gate found. Its purpose is to compare one wave with the last using numbers.

Taste and new tokens are not process: CLAUDE.md > Architecture > Styling owns both.
