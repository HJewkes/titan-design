# Review rounds

How one component goes from round 1 to signed off when the operator reviews and an implementer
agent builds. This is the align step of SKILL.md > The unit loop, at wave scale. The
coordinator's half (showing, asking, merging, releasing) is `coordinator-checklist.md`. The
review harness mechanics belong to `packages/review-harness/README.md`.

## Roles

- **One implementer per component**, in its own worktree, on one PR for the whole unit.
- **The coordinator** dispatches, shows, asks, merges and releases. It does not read component
  files; its context has to last the whole wave.
- **The operator** looks at renders and answers. Everything else is agent work.

## The round

1. **Dispatch.** The coordinator sends the operator's words verbatim in a quote block, then a
   numbered do-list derived from them. Never send the do-list alone: the implementer needs the
   original to catch what the do-list missed.
2. **Build** on the same branch and push to the same PR. Never open a PR per round.
3. **Update the PR body.** A `## Round N, for sign-off` section goes on top, the previous round
   stays below marked superseded, and a running decisions table (`# | Round | Decision`) is
   the record.
4. **Capture.** The review harness captures each variant at each width. For an ad-hoc shot, use
   `tools/round-capture.mjs` and name the file `<width>-<story-name>.png`, adding the variant
   key (`<width>-<key>-<story-name>.png`) when two variants share a story. An extra evidence
   crop keeps a descriptive name (`360-end-cells-zoom.png`).
5. **Self-check.** Before the operator sees the round, run the checks under _Before the
   operator sees a round_.
6. **Report** in under ten lines: head sha, story ids, what the agent saw in the render (not
   what it coded), gate counts (test files and tests, type-check, lint errors), and at most
   three questions.
7. **Show and ask.** The coordinator puts the round in front of the operator
   (`coordinator-checklist.md`).
8. **Record** the answer and dispatch round N+1. An answer is a direction to render next, not a
   lock; the lock is the operator approving the rendered result.

## Show, do not describe

The fourth process rule. A visual choice, or an existing component offered as prior art,
reaches the operator as a render, never as prose.

- **Every option a question asks about is rendered side by side on the same page.** A question
  that shows one option and describes the others is invalid; rebuild the round.
- **A new component gets no "main" frame**, because main renders it blank. Show main against
  head only for a change to an existing component.
- **A net-new shape question can use a served HTML mockup** (SVG, replay buttons for motion).
  It is an escape hatch for shapes titan cannot compose yet, never a way to decide a layout
  titan already composes.
- **Variants differ visibly at the review size.** If two variants differ only by a tint the
  operator cannot see at that size, change one before the round.
- **When the operator cannot tell variants apart, measure and zoom before arguing.** Probe the
  DOM, shoot a zoomed crop, then change the variant.

## Before the operator sees a round

- **Contrast in both themes.** Measure every frame in light and dark: text at 4.5:1, large text
  and non-text marks at 3:1. A miss caused by the component's own choice (a wrong token, its own
  opacity, its own fill) is a defect and goes back to the implementer, never a question to the
  operator. A miss inherited from a primitive or token used as documented is not the
  component's defect: record it, route it to the primitive or token audit, and proceed.
- **Light gets the same scrutiny as dark.** Check every frame on both the base and the elevated
  surface.
- **Every "looks cut off" or "a bit off" gets a browser measurement** with
  `tools/measure-render.mjs` before anyone touches overflow.

## Round 1 and data

- **Responsive stories from round 1.** Never a fixed-width frame; size to the canvas.
- **State the data semantics in round 1**, through the Round 0 contract
  (`round0-contract.md`).
- **Fixture real data early**, including the degenerate states: docs/component-states.md >
  Degenerate data counts as a state.
- **Measure the shipped reference before inventing constraints.** A constraint the existing
  system already breaks is not a constraint.

## Branches and records

- **Ideation goes on a stacked branch that touches only new files.** The base agent merges it
  into the base PR; squash-merging the base then marks the stacked PR merged.
- **Unchosen variants are deleted** with a `packages/ui/REJECTED.md` entry (SKILL.md > A
  rejected direction). A `*.decision.stories.tsx` story may stay as the record of the choice,
  rendering the shipped component.
- **Pin the decision in a test.** A test fails if the tokens or props drift from the chosen
  set; a mutation of the decision should fail a named test.
- **Agents stop at pushed and reported.** The coordinator merges and releases.

## Running a round through the harness

Commands, the manifest and feedback schemas, sections, heights and image variants are in
`packages/review-harness/README.md`. The process rules on top of it:

- Put the agent's two to four questions in the manifest, not in a separate question.
- Use an image variant only for an app-level screen Storybook cannot render.
- A tip, popover or menu the round must show is a story that renders open: README > Open-tip
  stories are open by STATE.
- The implementer may run the harness itself and iterate from stdout. When the coordinator runs
  it, the coordinator forwards the stdout JSON verbatim as the round N+1 dispatch.
- Quote `comment`, `note` and `text` verbatim when acting on them, as the dispatch rule above
  requires.
