# Design Freeze Workflow

Implements TD-06.04: the process (and script) that freezes an approved HTML
prototype as ground truth before any React implementation work starts on it.
This is Stage 3 ("Design Freeze") of the HTML-to-React extraction pipeline
described in the sibling `voltras` repo's `docs/improved-workflow.md`.

## Why this stage exists

Without a freeze point, a prototype can keep evolving (a new animation here, a
tweaked padding there) while agents are simultaneously building React
components against a spec that's already stale. The pipeline's own
retrospective (`voltras` repo, `docs/improved-workflow.md`, Stage 3) traces
most of a prior session's HTML/React drift to exactly this: no clear moment
where "the prototype is done, build against it" was declared and recorded.

**Rule:** a component does not get handed to an implementation agent (via
TD-06.03's prompt template) until it has been through design freeze. If the
prototype changes after that point, the change goes through a re-freeze (see
below), never a hand-edit of the React component to "match the new design."

## What "freeze" means, concretely

Three steps, in order, run by `packages/ui/scripts/design-freeze.mjs`:

1. **Tag the HTML file in git.** The script runs `git status --porcelain --
   <html file>` and refuses to proceed if it reports any change — staged,
   unstaged, or untracked. This guarantees the freeze point is an exact,
   already-committed version of the prototype, not a moving target. It then
   creates an annotated tag at `HEAD`: `design-freeze/<component>-<version>`
   (version defaults to today's date, override with `--tag-version`).

2. **Extract a CSS property manifest.** Delegates to
   `extract-css-properties.mjs` (TD-06.02) to read `getComputedStyle` off the
   frozen prototype element and write a manifest conforming to
   `css-property-manifest.schema.json` (TD-06.01) to
   `packages/ui/src/theme/manifest/<component>.manifest.json`.

3. **Generate a specimen-page skeleton.** Reads the matched element's
   `outerHTML` from the same rendered page and emits a `<ComparisonPair>`
   snippet — the convention used in `packages/ui/specimen/comparison.tsx` — with
   the frozen markup inlined as the HTML ground truth and a `TODO` placeholder
   where the (not-yet-built) React component goes. The script only *emits*
   this snippet (to stdout or `--out-skeleton <file>`); it does not edit
   `comparison.tsx` itself, so pasting it in stays a deliberate, reviewable
   step rather than unattended codegen against a large shared file.

## Usage

```bash
cd packages/ui
node scripts/design-freeze.mjs <html> <selector> <component> \
  [--out-manifest <file>] [--out-skeleton <file>] [--tag-version <v>] \
  [--skip-git-tag] [--variant <axis>=<value> ...]

# e.g. freezing E1rmBadge from the frozen prototype in the voltras repo:
node scripts/design-freeze.mjs \
  ../../../voltras/docs/prototypes/component-demo.html \
  '.e1rm-badge' \
  e1rm-badge \
  --variant size=md \
  --out-skeleton /tmp/e1rm-badge.skeleton.tsx
```

Also available as `pnpm design-freeze -- <html> <selector> <component> ...`
from `packages/ui`.

`--skip-git-tag` runs extraction and skeleton generation without touching git
— useful for iterating on a manifest before the prototype is actually ready to
freeze, or for prototypes that live outside this repo's git history.

## Where this fits in the 06.01 → 06.05 pipeline

```
TD-06.01  CSS property manifest schema        (packages/ui/src/theme/manifest/*.schema.json)
TD-06.02  extract-css-properties.mjs           (schema-conforming extraction from a rendered page)
TD-06.04  design-freeze.mjs   ◄── this ticket  (git tag + 06.02 + specimen skeleton, in one gated step)
TD-06.03  component-implementation.md prompt   (consumes the manifest + specimen entry this produces)
TD-06.05  implementation checklist             (marks a component done once built against the freeze)
```

TD-06.02 turns "an HTML file + selector" into a manifest; TD-06.04 wraps that
in the freeze *gate* — it won't run (or won't tag) against an uncommitted
prototype, and it also produces the specimen skeleton half of TD-06.03's
"HTML ground truth" dispatch input. Concretely, after a component's design
freeze:

- Its manifest (`packages/ui/src/theme/manifest/<component>.manifest.json`) is
  the `CSS_PROPERTY_MANIFEST_JSON` you paste into TD-06.03's prompt.
- Its specimen skeleton, once pasted into `comparison.tsx` and filled in, is
  the `htmlContent` ground truth the same prompt references.
- Only then is the component `+READY` for an implementation agent.

If a project wires up an automated dispatch gate (PM task states, a `brain
pm` workflow step, etc.), the check is: *does a `design-freeze/<component>-*`
tag exist at or after the manifest's current content* — i.e., don't dispatch
TD-06.03 against a component that hasn't been through this script. This repo
does not itself run such a gate; it's a process rule for whoever is
dispatching implementation work.

## Post-freeze changes

If the prototype needs to change after a freeze:

1. Update the HTML prototype and commit it.
2. Re-run `design-freeze.mjs` — this regenerates the manifest and specimen
   skeleton and creates a new tag (bump `--tag-version` or accept the new
   date-based default; tag names are per-component-per-version, so re-freezing
   never collides with or deletes the prior freeze).
3. Existing Layer 2/3 tests (computed-style and HTML-vs-React parity, see
   TD-06.05's checklist) will fail against the new manifest — that failure is
   the signal for what to update in the React component. Never hand-edit the
   component to match a new design without going through the manifest first.

## Testing

`packages/ui/src/theme/manifest/design-freeze.test.ts` covers the pure
functions (tag naming/messages, porcelain-output parsing, skeleton
generation, arg parsing) the same way `extract-css-properties.test.ts` covers
TD-06.02 — no real git or Chromium process runs in the test suite. The script
was additionally smoke-tested by hand against a scratch git repo to confirm
`git tag` creation and the uncommitted-file rejection both behave correctly.
