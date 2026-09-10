# Component maturity taxonomy

A component's **maturity status** records whether its design has been formally
reviewed and approved for consumption — separate from whether it merely exists
and compiles. It exists so app surfaces (the MCP dashboard, the mobile app) can
depend on the design system without _incidentally pulling in unvetted material_.

## The four statuses

| Status             | Meaning                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `status:stable`    | Formally reviewed **and approved**; safe to consume in app surfaces.      |
| `status:review`    | **Default.** Exists and may be tested, but not yet formally reviewed.     |
| `status:candidate` | Ported in for review (e.g. from the mobile app or a Lab exploration).     |
| `status:lab`       | WIP exploration. Lives under `Lab/*` and is excluded from publish builds. |

Status is carried as a Storybook **tag**, so it is machine-readable and drives
the sidebar tag-filter (the funnel control) — you can slice the whole library to
just Stable, or just Needs-Review, at a glance.

## Default posture: everything is Needs-Review

`.storybook/preview.tsx` sets a project-level `tags: ['status:review']`, so
**every story inherits `status:review`** with zero per-file annotation. Nothing
is Stable until it is _formally promoted_. This is deliberate: the burden of
proof is on promotion, not on flagging.

`status:review` is now the *residue*, not the population. Every story under
`src/components` and `src/lab` carries an explicit status except the ones listed
under [Not yet tagged](#not-yet-tagged); a story that still reads Needs-Review is
one nobody has run the rule against.

## The tagging rule — derive it, don't decide it

A status is a **function of the repo**, not a judgment call. Given a story file,
in this order:

1. Under `src/lab/**` → **`status:lab`**. No exceptions; lab is excluded from
   publish builds (`package.json` `files` carries `!src/lab`).
2. Under `src/components/ui/<dir>/` and **all four** hold → **`status:stable`**:
   - a test file in `<dir>` whose source contains `axe`;
   - `<dir>` has its own `README.md`, **or** its story carries a `Composes:`
     line, **or** it has a row in the
     [`ui/*` family README](src/components/ui/README.md) dependency map;
   - no heading in [`REJECTED.md`](REJECTED.md) names one of its exports;
   - no row in [`DEPRECATIONS.md`](DEPRECATIONS.md) names one of its exports.
3. Anything else under `src/components` → **`status:candidate`**.

Clause 2's fourth condition is an addition made when this rule was written
(2026-09-10). `status:stable` means "safe to consume in app surfaces", which a
`@deprecated` export is by definition not; without it `HelpTip` and `Tile` would
have been promoted on the same day they were marked for retirement. It is the
only clause not derivable from the original taxonomy — flag it if you disagree
with it rather than quietly tagging around it.

Consequences worth stating out loud:

- **Adding a `ui/*` primitive without a row in the family README leaves it
  `candidate`.** The README is load-bearing, not decoration.
- **`custom/*` and `shell/*` cannot reach `stable` under this rule.** They are
  `candidate` by construction until the rule grows a clause for them, which is a
  deliberate deferral: the Voltras-workout review pass (below) is where that
  clause gets written.
- **Deprecating an export demotes it** on the next pass. That is the intent.

## Promoting a component

Promotion is a **one-line edit** on the component's story `meta`, negating the
inherited default and adding the new status:

```ts
const meta: Meta<typeof Foo> = {
  title: 'Custom/Workout/Foo',
  tags: ['status:stable', '!status:review'], // ! negates the inherited default
  // ...
}
```

Use `status:candidate` the same way for material ported in for review.

**Do not promote ad hoc.** Either the rule above produces the tag, or promotion
happens in a scheduled review session working a ranked candidate list _in order_.
See [the review protocol](#formal-review-protocol).

## Not yet tagged

Two sets were held open by parallel work when the rule was first applied and
still inherit `status:review`. A later pass finishes them by re-running the rule:

| Files                                                             | Held by      |
| ----------------------------------------------------------------- | ------------ |
| `src/components/custom/Workout/**` (56 stories)                   | E3 batch B2  |
| `ui/{menu,popover,modal,select,tooltip}` stories (5)              | trigger work |

## Formal review protocol

The rule above settles `ui/*` and `src/lab`. It deliberately leaves the
**domain families** (`custom/*`, `shell/*`) at `status:candidate`, which is the
agenda for a review session scheduled for **after the live workout dashboard
ships** (`VW-27`), once the mobile components and Lab items have been decomposed
and ported into Storybook. That lets us review _the full field_ of component
direction in one comprehensive pass rather than blessing today's set in
isolation.

Each session: walk the list top-to-bottom (highest confidence first), and for
each component either promote it (`status:stable`) or record why it stays under
review. Confidence ranking = test coverage · token-cleanliness (no raw hex) ·
design stability · prior vetting.

## Candidate ranking is produced at review time, not kept here

This file used to carry a 45-row ranked candidate table and a reasons table for
components held back. Both went stale within weeks: the ranking was a snapshot
of unit-test counts and raw-hex literals per component, and every component PR
moves those numbers. The July 2026 snapshot is preserved in the history of
[PR #100](https://github.com/HJewkes/titan-design/pull/100).

Regenerate the list at the start of a review session from the same signals:

- unit tests per component (`vitest run --reporter=json`, count by file)
- raw hex literals per `.tsx` (the no-raw-color ratchet from #127 already
  tracks the total; its per-file report is the ranking input)
- prior operator vetting, from the PR history of the component's family

Rank highest confidence first, then walk the list as the protocol above says.

## Generic primitives (`Components/Atoms|Molecules|Organisms`)

The **38** generic primitives (Button, Card, Input, Modal, Table, …) are a
separate foundation tier and are out of scope for the Voltras-workout review
pass. This file used to say "~52": that number predated the `ui/` reorganisation
and was never recounted. It is `ls -d src/components/ui/*/ | wc -l` — 38
directories, one per primitive — and it is the same 38 the
[family README](src/components/ui/README.md) indexes.

They no longer default to `status:review`: the tagging rule above resolves all
38 (31 `stable`, 2 `candidate` for the deprecated `HelpTip` and `Tile`, 5 held
open). Their assessment happened by rule, not by session.

## Related

- [`REJECTED.md`](REJECTED.md) — directions tried and deliberately not adopted.
  Clause 2 of the tagging rule reads it.
- [`DEPRECATIONS.md`](DEPRECATIONS.md) — exports marked `@deprecated` but not yet
  removed. Clause 2 reads it too, and a listed export cannot be `stable`.
- [`docs/library-roadmap.md`](docs/library-roadmap.md) — the decisions this
  taxonomy serves.
