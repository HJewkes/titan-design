# 0001. Record system extensions as decisions

## Status

accepted

## Need

An agent or contributor who needs a token, palette or primitive has no route to propose one. Proposals
have taken four shapes so far: a decision brief beside a component
(`custom/Workout/VolumeStatusPalette.decision.md`), a rendered token proposal kept in `src/theme/`
(`ProposedTokensVW82.stories.tsx`), a candidates module with a test that exactly one set is chosen
(`custom/charts/DatavizLightPalette.candidates.ts`), and `Lab/Decisions/` stories. None of them is
indexed, so the next person cannot find what was decided or why.

The cost shows up in two places. A new colour category can land with no entry in the `TOKENS.md`
decision table. A rejected colour direction is recorded only if someone adds it to `REJECTED.md`,
which is a log of component directions.

## Why existing tokens or primitives cannot serve it

This decision is about process, not a token, so the nearest existing records stand in:

1. `packages/ui/REJECTED.md`: records directions that were not adopted, but not the ones that were,
   and is organised by component rather than by token.
2. `packages/ui/TOKENS.md`: says which token to use, not why a token exists or what it replaced.
3. The `*.decision.md` and `*.decision.stories.tsx` files: each sits beside one component, follows its
   own shape and is not listed anywhere.

## Options

1. A numbered decision folder at the repo root, with a template, an index and a structure test.
2. Fold token decisions into `REJECTED.md` and widen it to accepted decisions as well.
3. Keep proposals beside the component that needs them and add a convention for their shape.

## Rendered evidence

Not applicable: this decision adds no rendered value. Later decisions carry a story id.

## Checks

Not applicable: no colour changes. The checks a token decision must report (contrast, CVD,
near-duplicate) are listed in the template.

## Decision

Option 1. Extensions to the system are recorded in `docs/decisions/`, one numbered file each, from
`0000-template.md`. A decision is required for a new token category, palette, ramp step or primitive,
and for a new role that introduces a new colour value. A new role that only aliases an existing
primitive value needs only the PR checklist and the CI gates. The README in this folder holds the
index and the full rule.

The folder sits at the repo root, not in `packages/ui/docs/`, because `packages/ui/docs` ships in the
npm tarball and these records are for contributors.

`REJECTED.md` and the index link each other. Component directions stay in `REJECTED.md`; token,
palette and primitive rejections go in the decision's "Rejected alternatives" section.

Decisions record distilled reasons only, with no verbatim owner quotes, transcript ids or private
paths, because the repo is public. Existing `REJECTED.md` entries are left as they are.

## Rejected alternatives

- **Fold into `REJECTED.md`.** It holds about 40 component and chart entries and is cited by
  `CLAUDE.md`, the component skill and many of its own entries. Moving or widening it breaks those
  references and mixes two kinds of record for no gain.
- **Proposals beside the component.** This is the current state. Nothing indexes them, and a token
  outlives the component that first needed it.
- **A decision for every new semantic token.** Too heavy for the common case, a new role inside an
  existing category that aliases a primitive already in the system. The gates cover that case.

## Consequences

These files change together when this decision lands:

- `docs/decisions/README.md`, `docs/decisions/0000-template.md` and this file.
- `packages/ui/REJECTED.md` (header paragraph linking the index).
- `packages/ui/TOKENS.md` (section 7, "Adding to the system").
- `README.md` (documentation index row).
- `packages/ui/src/test/decisions.test.ts` (structure test).
- `CLAUDE.md` ("Adding New Tokens" gains a step 0: an accepted decision for the cases above).

Shared colour checks and CI gates for contrast, CVD and near-duplicates follow as separate work under
TD-30.
