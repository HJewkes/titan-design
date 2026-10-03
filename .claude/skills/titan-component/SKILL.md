---
name: titan-component
description: "Builds or extends a titan-design component: file, story and token checklists, the Round 0 contract, review rounds, the functional gate, the coordinator checklist, templates and capture tools. Use for 'new component', 'add a token', 'write a story', 'design round', 'next round', 'release titan'."
---

# titan-component

The process for one titan-design component. Library facts have one owner each and this
skill links them: `CLAUDE.md`, `packages/ui/TOKENS.md`, `packages/ui/MATURITY.md`,
`docs/test-layers.md`, `docs/component-states.md`. Where this file and an owner disagree,
the owner wins; fix this file.

## The pipeline

`candidate` -> Gate 1 (invest) -> align -> productionalize -> Gate 2 (final review) -> wire.

The two gates are the operator's. Everything between them is agent work with no operator
round-trips. A design question that surfaces mid-productionalize means the unit was not
aligned: go back to align.

The `status:` tags that mark each stage, and how a promotion is made, belong to
`packages/ui/MATURITY.md`. A component is wired non-provisionally only at `status:stable`.
Wiring a component that is still under review is allowed only as a spike labelled
provisional, and it never counts toward done.

## Gate 1: the invest decision

Decided by the operator before any brief or specimen work. It is the anti-duplication gate:
it stops a second component from being built beside one that exists.

1. Refresh `packages/ui/src/arch/arch-graph.json` if it is stale (`CLAUDE.md` > Gotchas,
   barrel hash).
2. Write an overlap survey: what else, stable or in `lab` and `candidate`, does similar work
   or shares an element (a bar, track, needle, pill), even in a very different concept.
3. Check `packages/ui/REJECTED.md` for the direction.
4. The operator records one of: invest, don't, merge-with-X. No invest record, no build loop.

## The unit loop

One unit at a time. Each step names its checklist.

1. Brief: what it is, where the idea came from, the primitives it should compose, open
   questions. Place it with `CLAUDE.md` > Component Development > Placement.
2. Align: render it in Storybook and iterate with the operator. An answer to a design
   question is a direction to render next, never a lock. A decision locks only when the
   operator approves its rendered confirmation.
3. Build the files: `references/component.md`.
4. Add the tokens it needs: `references/token.md`.
5. Write the story and the family README row: `references/story.md`.
6. Test and run the gates: `references/verify.md`.
7. Open the PR with every gate green. Record follow-ups as tickets.

Hardening (steps 3 to 6) needs a confirmation render behind every decision it implements.
If you cannot point to a render the operator approved, return to step 2.

## Definition of done: Gate 2

Before asking for Gate 2 the agent has finished:

- Decomposition: every reusable element is a shared primitive, not only composed. A new
  primitive is justified by two consumers or an explicit note.
- Prop API and naming follow `CLAUDE.md` > Component Development > Props Conventions.
- A written data plan: how the component gets its data, each store gap as a ticket, and
  how it avoids re-render storms. A plan, not a built drill-down.

The unit is not done, and nothing merges or becomes `status:stable`, until all three hold:

1. The Storybook shows the final locked design. Rejected options are deleted or marked
   `test.fixme` with a ticket. No half-states, empty-gap placeholders or live menus of
   options.
2. The operator opened that Storybook and approved it. A screenshot or a chat answer does
   not count. Green gates prove it works, not that it is the approved design.
3. An independent read-only reviewer attacked the component after the visual lock, and
   every defect is fixed or deferred with a ticket. Visual approval alone never merges.

Before merging, ask: is the full Storybook the final design, and did the operator validate
it there? If not, open it and wait.

## A rejected direction

Record the rejection in the repo, not the conversation. A rejected component that stays
tested and exported looks like finished work to the next reader.

1. Delete the component, stories, tests and every barrel export. A kept reference goes in
   `src/lab/` with a `status:` tag, never in a barrel.
2. Add an entry to `packages/ui/REJECTED.md`: what was tried, what was chosen, and why.
3. Close its PR as rejected, not superseded, and link the entry.
4. Remove docs that describe it as current.

## Reference index

- `references/component.md`: ordered checklist for the component, test and barrel files.
- `references/story.md`: ordered checklist for stories, docs lines and the family README.
- `references/token.md`: ordered checklist for adding or choosing a token.
- `references/verify.md`: ordered checklist for tests, visual layers and the final gates.
- `templates/`: starter component, test, story and family README, repaired to match `CLAUDE.md`.
- `tools/`: `measure-render.mjs` (measure a story against a reference) and `round-capture.mjs` (named screenshots for a review round); each prints usage with `--help`.
