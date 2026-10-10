# Changelog

All notable changes to `@titan-design/review-schema` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Optional `implemented` on pick-one (an option) and pick-many (a list of options): what the PR
  implements at its head. Every entry must be one of the question's options and not its
  `revisionOption`.
- `shipBlocks(round, feedback)`: per PR group, whether Ship is blocked and why. A group is blocked
  when any of its answers carries free text, or picks other than the question's `implemented`
  option. An unanswered question does not block. Exports `PrGroupShipStatus` and `ShipBlocker`.
- `lintRound` rule `missing-implemented-option`: an `iterate` or `decide` pick question declares
  `implemented`.
- `titan-locks/1` (`LOCKS_SCHEMA_ID`, `LocksSchema`, `parseLocks`): a registry of decision locks.
  Each lock (`L-NNNN`) is keyed on its `decision` (ledger row, decisions item, round, question
  id), has zero or more `holders` (a PR at a head), declares `touches` (tokens per mode,
  components, axis) when it has no holder, and orders itself with `after`. Top-level
  `dependents` name the lock they wait on with `mode` `stack-on` or `defer` and a `reason`. The
  schema refuses an unknown lock id in `after` or `dependents`, an `after` cycle, a repeated lock
  id and a decision row keyed by two locks, naming the ids. Exports `afterCycles`,
  `locksProblems`, `LOCK_AXES`, `LOCK_STATUSES` and `DEPENDENT_MODES`.
- Optional `stackedOn` on a `prGroups` entry (`{ repo, pr, headSha }`): the base that one PR
  group renders on, so groups in one round can sit on different bases. The round-level
  `stackedOn` keeps its meaning. The schema refuses a group stacked on itself, directly or
  through other groups. Exports `stackBase`.

## [0.3.0]

### Added

- Optional question `frames`: the variant keys a question asks about. A renderer places them
  directly above the question, inside the question's own section. The schemas refuse an unknown
  or repeated key and a question with `frames` in no section; `lintRound` checks placement.
- Optional question `decision`: `iterate`, `ship` or `decide` (`DECISION_KINDS`). A merge-bound
  question that sets it must say `ship`.
- Optional `outcomes` on pick-one and pick-many: each option's `accept`, `changes` or `neutral`
  (`OPTION_OUTCOMES`). Every key must be one of the question's options.
- Optional manifest `prGroups` (`[{ pr: "owner/name#n", headSha, sectionIds }]`,
  `PrGroupSchema`). Each section id must be known and in one group only, and each PR has one group.
- Optional variant `variantUnit`, `alternate` and `change` (`changed`, `new`, `removed` or
  `unchanged`, `FRAME_CHANGES`).
- `lintRound(round)` and `LINT_RULES`: the review-layout rules a builder applies before it writes
  a round (`unanchored-question`, `frame-outside-section`, `shared-frame-set`,
  `split-variant-unit`, `unequal-alternates`, `split-pr-group`, `ship-not-last`,
  `ship-head-mismatch`). It returns `{ rule, message }[]`, empty when the round passes.

### Changed

- A STATES strip may hold a question that picks among its own `frames`; it still refuses one
  that picks any other frame. A CHOICE strip holds settings constant within each compared set
  (each question's `frames`, then the frames no question claims), not across the whole strip.
- A sectioned round is no longer capped at 80 variants. The cap was a size picked for one
  Gate 2 batch; the page shows one section (or PR group) at a time and mounts a frame only as it
  nears the viewport, so round size does not bound what is on screen. A round without sections
  is still capped at 12, because it shows every frame on one page.
- A frame outside its question's section, and a frame under two questions, are now
  `lintRound` problems instead of schema errors, so `ManifestSchema` still reads such a round.
- `round.schema.json` carries every new field and drops `maxItems` on `variants`. The schema id stays
  `titan-review/round@2`: every round written for 0.2 still validates.

## [0.2.0]

### Added

- Optional question `topics`: the keys a question shares with questions in other rounds, each
  `ask:`, `component:`, `token:` or `topic:` followed by a name without spaces (`TOPIC_PREFIXES`).
  `ask:<unit>/<questionId>` is the same question across rounds.
- Optional manifest `stackedOn` (`{ repo, pr, headSha }`, `StackedOnSchema`): the base PR a stacked
  round renders beneath its own, whose frames are context and not under review.
- `round.schema.json` carries both fields. The schema id stays `titan-review/round@2`: every
  round@2 manifest written for 0.1 still validates.

## [0.1.0]

### Added

- `RoundSchema` (`titan-review/round@2`), `ManifestSchema` (round@1 and round@2) and
  `FeedbackSchema` (`titan-review/feedback@1`), with the generated JSON Schema files.
