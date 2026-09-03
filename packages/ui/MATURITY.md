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

## Promoting a component

Promotion is a **one-line edit** on the component's story `meta`, negating the
inherited default and adding the new status:

```ts
const meta: Meta<typeof Foo> = {
  title: 'Workout/Foo',
  tags: ['status:stable', '!status:review'], // ! negates the inherited default
  // ...
}
```

Use `status:candidate` the same way for material ported in for review.

**Do not promote ad hoc.** Promotion happens in a scheduled review session,
working a ranked candidate list _in order_. See
[the review protocol](#formal-review-protocol).

## Formal review protocol

The Stable list is **not yet applied** — every component currently reads
Needs-Review. A ranked candidate list is the agenda for a future review session,
scheduled for **after the live workout dashboard ships** (`VW-27`), once the
mobile components and Lab items have been decomposed and ported into Storybook
as `status:candidate`. That lets us review _the full field_ of component
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

## Generic primitives (`Components/Atoms|Molecules|Organisms|DataViz`)

The ~52 generic primitives (Button, Card, Input, Modal, Table, …) are a separate
foundation tier and are out of scope for this Voltras-workout review pass. They
default to `status:review` like everything else; assess them in their own pass.
