# Changelog

All notable changes to `@titan-design/review-schema` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.0]

### Added

- Optional question `frames`: the variant keys a question asks about. A renderer places them
  directly above the question, inside the question's own section. Every key must be a frame of
  that section, and a frame sits above one question only; both `RoundSchema` and
  `ManifestSchema` refuse anything else, and a round without sections cannot use `frames`.

### Changed

- A STATES strip may hold a question that picks among its own `frames`; it still refuses one
  that picks any other frame. A CHOICE strip holds settings constant within each compared set
  (each question's `frames`, then the frames no question claims), not across the whole strip.
- A sectioned round is no longer capped at 80 variants. The cap was a size picked for one
  Gate 2 batch; the page shows one section (or PR group) at a time and mounts a frame only as it
  nears the viewport, so round size does not bound what is on screen. A round without sections
  is still capped at 12, because it shows every frame on one page.
- `round.schema.json` carries `frames` and drops `maxItems` on `variants`. The schema id stays
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
