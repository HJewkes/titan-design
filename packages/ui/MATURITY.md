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

`status:review` is now the _residue_, not the population. Every story under
`src/components` and `src/lab` carries an explicit status
([Not yet tagged](#not-yet-tagged) is empty); a story that still reads Needs-Review is
one nobody has run the rule against.

## The tagging rule — derive it, don't decide it

A status is a **function of the repo**, not a judgment call. Given a story file,
in this order:

1. Under `src/lab/**` → **`status:lab`**. No exceptions; lab is excluded from
   publish builds (`package.json` `files` carries `!src/lab`). A story titled
   `Lab/…` elsewhere is also `status:lab`: it records a design decision about
   the components beside it rather than defining one, and the public Storybook
   build drops every `Lab/` title (`.storybook/main.ts`).
2. Under `src/components/ui/<dir>/`, where `<dir>` is the component's own directory (for charts,
   `ui/charts/<dir>/`), and all five conditions below hold, it is **`status:stable`**:
   - a test file in `<dir>` whose source contains `axe`;
   - `<dir>` has its own `README.md`, **or** its story carries a `Composes:`
     line, **or** it has a row in the
     [`ui/*` family README](src/components/ui/README.md) dependency map;
   - no heading in [`REJECTED.md`](REJECTED.md) names one of its exports;
   - no row in [`DEPRECATIONS.md`](DEPRECATIONS.md) names one of its exports;
   - every applicable test layer exists, or its story declares the layer n/a
     ([clause 5](#clause-5-every-applicable-test-layer)). Clause 5 took effect with TD-26 slice
     S6 (TD-93). `stable-layers-baseline.json` holds the gaps of the components that were stable
     that day, so no component lost stable when the rule started.
3. Anything else under `src/components` → **`status:candidate`**.

Clause 2's fourth condition is an addition made when this rule was written
(2026-09-10). `status:stable` means "safe to consume in app surfaces", which a
`@deprecated` export is by definition not; without it `HelpTip` and `Tile` would
have been promoted on the same day they were marked for retirement. It is the
only clause not derivable from the original taxonomy — flag it if you disagree
with it rather than quietly tagging around it.

### Clause 5: every applicable test layer

Clause 5 is live as of TD-26 slice S6 (TD-93). A `ui/` component is stable only if each
applicable layer below exists in `<dir>`, or its story `meta` declares the layer not applicable:

```ts fragment
parameters: { layers: { keyboard: 'n/a: focus belongs to the wrapped Button' } },
```

The value must start `n/a: ` and give a non-empty reason. An empty reason, or a key that names no
layer, fails the detector. So does an n/a for a layer that exists: remove the declaration. Only
the default-exported `meta` counts, and its `parameters.layers` must be an object literal of string
entries; a spread or a non-literal value fails closed. The [test-layers doc](../../docs/test-layers.md) says how to write each
layer.

| Layer      | Applies when                                         | Exists when                                                             |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `logic`    | always                                               | a `*.test.ts` in `<dir>` imports `fast-check` or calls `fcAssert`       |
| `keyboard` | the component takes focus (`Pressable`, `TextInput`) | a story file in `<dir>` tagged `play` has a `play` function             |
| `axe`      | always                                               | no story id of the component is in `src/test/stories-axe-baseline.json` |
| `visual`   | n/a until TD-46                                      | an entry in TD-46's visual manifest, once it lands on `main`            |
| `types`    | the component exports a generic                      | a `*.test-d.ts` in `<dir>`                                              |
| `scale`    | the component windows its items (a `FlatList`)       | a test in `<dir>` calls `expectBoundedMount`                            |

A `play`-tagged story is one the `storybook` Vitest browser project runs. "Takes focus",
"exports a generic" and "windows" are read from the component's own source; a declaration
overrides a reading that is wrong for one component.

`src/test/stable-layers.test.ts` derives the layers by reading files, with no Storybook boot.
`src/test/stable-layers-baseline.json` lists the layers each stable component lacked on the
day clause 5 started: every component stable that day (`ORIGINAL_BASELINE` in the test), so none
lost `stable` that day. It may only
shrink, and the test pins that day's entries: a new component or a new layer in it fails. A gap it does not list fails the test, and a listed layer that now exists fails as stale
until someone removes it. A component that lacks a layer and has no baseline entry cannot be
promoted until it adds the layer or declares it n/a.

Consequences worth stating out loud:

- **Adding a `ui/*` primitive without a row in the family README leaves it
  `candidate`.** The README is load-bearing, not decoration.
- **`custom/*` and `shell/*` cannot reach `stable` under this rule. Placement
  follows the rule in `CLAUDE.md` (Placement): `ui/` is the domain-free tier, so
  eligibility follows from what a component knows.** They are `candidate` by
  construction until the rule grows a clause for them, which is a deliberate
  deferral: the Voltras-workout review pass (below) is where that clause gets
  written.
- **Deprecating an export demotes it** on the next pass. That is the intent.

## Promoting a component

Promotion is a **one-line edit** on the component's story `meta`, negating the
inherited default and adding the new status:

```ts fragment
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

None. The two sets held open when the rule was first applied, `src/components/custom/Workout/**`
and the `ui/{menu,popover,modal,select,tooltip}` stories, were tagged by TD-8. Workout stories are
`candidate`, or `lab` under step 1 for the `*.decision.stories.tsx` files and `VolumeStatusPalette`,
all titled `Lab/Decisions/…`; the
five `ui/` families are `candidate` because clause 5 fails for them (no `logic` layer), so none of
them derives `stable` yet.

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

The generic primitives (Button, Card, Input, Modal, Table, …) are a separate foundation tier and
are out of scope for the Voltras-workout review pass. Each has its own directory under
`src/components/ui/` or `src/components/ui/charts/`, and `src/arch/arch-graph.json` lists them too.
`charts/` and `charts/kit/` hold no component. Count the directories from `packages/ui`:

```sh
ls -d src/components/ui/*/ src/components/ui/charts/*/ | grep -vcE '/charts/$|/kit/$'
```

A directory without a story file carries no status tag. One is `trigger` (`TriggerSurface`, added
in #176), an internal helper that `Menu`, `Popover` and `Tooltip` compose. It is not exported from
the `ui` barrel. The others hold a model, fixtures and an `API-NOTE.md` ahead of their component.
List them:

```sh
for d in src/components/ui/*/ src/components/ui/charts/*/; do ls "$d"*.stories.tsx >/dev/null 2>&1 || echo "$d"; done | grep -vE '/charts/$|/kit/$'
```

The directories with stories no longer default to `status:review`. The tagging rule resolves
them, by rule and not by session. Count each status:

```sh
for d in src/components/ui/*/ src/components/ui/charts/*/; do grep -ho "'status:[a-z]*'" "$d"*.stories.tsx 2>/dev/null | sort -u; done | sort | uniq -c
```

Each `candidate` is held by a named clause:

- **Clause 2's fourth condition** (a `DEPRECATIONS.md` row). `typography`, `eyebrow` and
  `empty-state` became stable-eligible when they moved into `ui/`, but the M2 and M3 shim rows name
  their exports. They are promotable once the shims go in 0.23.0. `table` (M4, #367), `spark-bars` (M5, TD-188),
  `file-path-label` (M6, TD-418), `date-time` (M7, TD-428), `scatter`, `treemap` and `gauge` (M8,
  TD-471) and `metric` (M9, TD-53) are held the same way. `help-tip` and `tile` are deprecated.
- **Clause 5** (a missing test layer). `menu`, `popover`, `modal`, `select` and `tooltip` have no
  `logic` layer (see [Not yet tagged](#not-yet-tagged)). `stat-card` has no `logic` layer either.
  It was not stable when clause 5 started, so it has no baseline entry to cover the gap.
- **No clause holds `carousel`.** All five conditions of clause 2 pass for it, so the rule derives
  `stable`, and its story carries `status:stable` (TD-704).

## Related

- [`REJECTED.md`](REJECTED.md) — directions tried and deliberately not adopted.
  Clause 2 of the tagging rule reads it.
- [`DEPRECATIONS.md`](DEPRECATIONS.md) — exports marked `@deprecated` but not yet
  removed. Clause 2 reads it too, and a listed export cannot be `stable`.
- [`docs/library-roadmap.md`](docs/library-roadmap.md) — the decisions this
  taxonomy serves.
