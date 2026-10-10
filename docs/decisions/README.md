# Decisions

Each file here records one extension of titan's design system: a token category, a palette, a ramp
step or a primitive, decided on rendered evidence before the tokens land. Copy
[the template](./0000-template.md) to start one.

Component and chart directions that were tried and not adopted stay in
[Rejected directions](../../packages/ui/REJECTED.md). Token, palette and primitive rejections live in
the "Rejected alternatives" section of the decision that weighed them, and the table below lists those
decisions.

`packages/ui/src/test/decisions.test.ts` checks every decision has the template's headings and a valid
status, that numbers are unique and contiguous, and that this table lists every file.

## Index

| Number | Title                                                                                    | Status   |
| ------ | ---------------------------------------------------------------------------------------- | -------- |
| 0001   | [Record system extensions as decisions](./0001-record-system-extensions-as-decisions.md) | accepted |
| 0002   | [Light elevation ramp 3b](./0002-light-elevation-ramp-3b.md)                             | accepted |

## When to write one

A decision is required before a PR adds any of:

- a new token category (a new Tailwind colour root, such as `scrim-*` was);
- a new palette;
- a new ramp step;
- a new primitive value;
- a new role inside an existing category that introduces a new colour value.

A new role inside an existing category that only aliases an existing primitive value (a fifth
`scrim-*` pointing at a primitive already in `primitives.ts`) needs no decision. The PR checklist and
the CI gates cover it.

When in doubt, write one: a short accepted decision costs less than a token that has to be unwound.

## Writing one

- Number it one above the highest number in the table, and add its row in the same PR.
- Start at `proposed`. The owner moves it to `accepted` or `rejected`; a later decision that replaces
  it marks it `superseded` and names the successor. A decision that re-points roles starts at
  `accepted` instead; see the next section.
- Put proposal stories under `packages/ui/src/lab/` with a `Lab/Decisions/` title, never under
  `src/theme/`, which the story smoke test does not cover.
- Record distilled reasons only: no verbatim owner quotes, no transcript ids and no private paths.
  This repo is public.

## Decisions that re-point roles

A foundations decision that re-points roles also gets a decision record, even when it adds no new
value: a new tone recipe, a change to the surface planes, the solid ladder or the subtle encoding, or
a re-pointed token family or categorical set.

- The PR that implements the decision, the lock-holder PR, carries the record with status `accepted`
  from the moment the PR opens.
- The record cites the decisions item number, the Gate 2 round and the question id. It never quotes
  the owner.
- If the owner answers "Don't ship", the next PR flips the record to `rejected` and keeps it as the
  record of what was weighed.

The record is `accepted` at open because the owner's pick is the decision. A Gate 2 Ship confirms the
implementation at one head, and a commit that changed the status at Ship time would make a new head
and void that Ship.

Other PRs that render on top of an open role decision stack on the lock-holder PR or wait for it to
merge.

## Checks

A decision that proposes colours can be checked against the real inventory with the tools of the
`color-system-derivation` skill. Both tools read titan's colours from files named by an environment
variable and fall back to their bundled example data when the variable is unset or the file is wrong,
so confirm the output names titan's hues and roles, not the example system's.

```sh
pnpm --filter @titan-design/react-ui build
node packages/ui/scripts/export-color-inventory.mjs "$TMPDIR/titan-colors"

# then, from the skill's tools/ directory:
RAMPS="$TMPDIR/titan-colors/ramps.json" node cvd-solve.mjs
COLORS="$TMPDIR/titan-colors/colors.json" node audit.mjs
```

The export reads the built `packages/ui/dist/theme/tokens.mjs` and exits non-zero when it is missing.
It is local tooling: no CI job or Turbo task runs it.
