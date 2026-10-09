# Changelog

All notable changes to `@titan-design/review-schema` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

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
