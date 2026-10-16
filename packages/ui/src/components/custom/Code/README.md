# Code — component family

Read-only components over plain props shaped from codewatch commands: hotspots, findings, coupling and
snapshots. Every component takes plain data and has no fetch or store; the family imports nothing from
codewatch or titan-platform, and the app owns every threshold (cutoffs, budgets). Components live flat
on disk; the tiering below is a documentation contract, not a directory layout.

## Composition trees

```
StatusMark ....................... atom
└─ Pill .......................... (existing primitive; subtle variant, tone from `code-status.ts`)
```

Each slice appends its tree here.

## Tier map

| Tier | Members                                        | Imports                                      |
| ---- | ---------------------------------------------- | -------------------------------------------- |
| atom | `StatusMark`                                   | `ui/pill`                                    |
| seam | `types.ts`, `code-status.ts`, `code-format.ts` | `ui/*` types, `utils`, `theme/resolve-color` |

`fixtures.ts` is never exported from the barrel; every path, symbol, package and ref in it is invented.

## Relation to ActiveWork

The family imports `ui/*` and `ui/charts/*` only; it does not import `custom/ActiveWork`. A component
that is domain-free and sits in a higher tier moves down first; nothing is copied.

## Status vocabulary

One owner, `code-status.ts`. No new token: every tone is an existing `Pill` tone. A status is never
colour alone: the word is visible, or the accessible name carries it. `StatusMark` renders change kinds
only; other vocabularies render a `Pill variant="subtle" size="sm"` with the tone from their map.

| Kind             | Visible label                     | Accessible name              | Tone                           |
| ---------------- | --------------------------------- | ---------------------------- | ------------------------------ |
| `crossed-cutoff` | Crossed cutoff                    | Crossed the cutoff           | `error`                        |
| `entered`        | Entered                           | Entered the ranking          | `warning`                      |
| `new-file`       | New                               | New file                     | `info`                         |
| `worsened`       | `+120`, or Worsened without delta | Worsened by 120, or Worsened | `warning`; `error` over cutoff |
| `improved`       | `-120`, or Improved without delta | Improved by 120, or Improved | `success`                      |
| `resolved`       | Resolved                          | Resolved                     | `success`                      |

| Score band | Fill token       | Indicator |
| ---------- | ---------------- | --------- |
| `over`     | `status-error`   | `error`   |
| `elevated` | `status-warning` | `warning` |
| `watch`    | `status-info`    | `info`    |

| Budget band            | Text colour | Word added to the name | Fill             | Flag      |
| ---------------------- | ----------- | ---------------------- | ---------------- | --------- |
| `over`                 | `error`     | over budget            | `status-error`   | `error`   |
| `near`                 | `warning`   | near budget            | `status-warning` | `warning` |
| `within`, `unbudgeted` | `primary`   | none                   | `text-tertiary`  | none      |

| Coupling class | Label        | Tone      |
| -------------- | ------------ | --------- |
| `hidden`       | Hidden       | `warning` |
| `expected`     | Expected     | `neutral` |
| `unverifiable` | Unverifiable | `neutral` |
