# NNNN. Title in the imperative

<!--
Copy this file to NNNN-short-slug.md, one number above the highest in README.md, and add its row
to the index. Keep every heading; write "Not applicable" and the reason under one that does not fit.

Record distilled reasons only. No verbatim owner quotes, no transcript ids and no private paths:
this repo is public.
-->

## Status

proposed

<!-- One of: proposed, accepted, rejected, superseded. A superseded decision names its successor,
for example "superseded by 0007". -->

## Need

What a component or consumer needs that the system cannot express today, and where it showed up.

## Why existing tokens or primitives cannot serve it

The three nearest existing tokens or primitives, and why each one falls short.

1. `nearest-one`:
2. `nearest-two`:
3. `nearest-three`:

## Options

Each option considered, with its values.

## Rendered evidence

The story id that renders the options side by side, for `pnpm review`. Proposal stories go under
`packages/ui/src/lab/` with a `Lab/Decisions/` title, never under `src/theme/`.

## Checks

The output of each check, in both modes where the value differs:

- Contrast: each text or fill pair against its planes.
- CVD: deutan and protan separation for any palette or categorical addition.
- Near-duplicate: the nearest existing semantic colour and its distance.

## Decision

The option chosen and the reason, in a few sentences.

## Rejected alternatives

Each option not chosen and why, so the idea is not re-proposed without new evidence.

## Consequences

The files that change together when the decision lands, for example `primitives.ts`, `semantic.ts`,
`global.css`, `theme/config.ts`, `tailwind.config.js` and the `TOKENS.md` entry.
