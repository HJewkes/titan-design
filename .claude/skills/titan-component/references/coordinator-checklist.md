# Coordinator checklist

The coordinator's half of a review round (`review-rounds.md`): Storybook, showing, asking,
merging, releasing and baselines. Commands run from `packages/ui` unless stated.

## Storybook

- Every agent launches its own isolated Storybook and stops only the PID it started:
  CLAUDE.md > Quick Reference > Storybook ports.
- Never restart the operator's server on the locked port, and never pass the launcher a flag
  you have not verified (`gotchas.md` > The Storybook launcher and unverified flags).
- The agent's report names its port. Before trusting a capture, confirm that port serves the
  agent's tree by something unique to it (the same CLAUDE.md section).

## Showing the operator

- Open the round's PNGs, or the review harness page, before asking. Never ask first and open
  after.
- For a live story, open `http://localhost:<port>/?path=/story/<id>`, one tab per variant being
  decided.
- When no browser extension is paired, capture the bare canvas at
  `http://localhost:<port>/iframe.html?id=<id>&viewMode=story` with the Playwright MCP, or
  batch it with `tools/round-capture.mjs`.

## Asking

Variant picks go through the review harness (`review-rounds.md` > Running a round through the
harness). A question is for decisions that are not about renders:

- two to four questions per round, one decision each;
- the agent's questions folded in, never forwarded raw;
- the recommended option first, labelled as the recommendation, with a one-line reason;
- each option names the story or PNG it refers to, so the answer maps to a render.

## Merging

- Merge only when Gate 2 holds: SKILL.md > Definition of done, including the functional gate
  (`round0-contract.md` > The functional gate). Agents never merge.
- A stacked ideation PR merges into the base branch first; close it as folded into the base PR.
- Unchosen variants are already deleted, with a `REJECTED.md` entry, before the merge.

## Releasing titan

Publishing and the tag order belong to CLAUDE.md > Gotchas (releases). The steps around them:

1. Cut a release worktree from `origin/main`, never from the main checkout.
2. Run `pnpm changelog:compile` in `packages/ui` to fold `changelog.d/` fragments into
   `[Unreleased]`. In `packages/ui/CHANGELOG.md`, move `[Unreleased]` under `## x.y.z` and correct stale
   sentences in the entries.
3. Bump `packages/ui/package.json` to `x.y.z`.
4. Open a PR titled `Release x.y.z` and squash-merge it on green.
5. Tag `vX.Y.Z` on that `main` commit and push the tag.
6. Wait until `npm view @titan-design/react-ui@x.y.z version` resolves before bumping any
   consumer. The registry lags the publish job by a few minutes.

## Visual baselines

Refresh only from the CI artifacts: packages/ui/docs/render-testing-pattern.md > How the visual
baselines are updated. Commit only the PNGs that changed. A component change that legitimately
widens a story (new icons widen the icon gallery) refreshes that story's baseline the same way.

## Bumping a consumer

- Bump the `@titan-design/react-ui` spec, then edit the lockfile surgically: `version`,
  `resolved` and `integrity` for the package, plus the root spec. Add a new transitive
  dependency by hand. Never regenerate the whole lockfile.
- Re-check the consumer's page against real data after the bump, including the degenerate
  states.
