# @titan-design/review-schema

The zod schemas for titan-review rounds and the feedback a round returns. The package is
**zod-only**: `zod` (v4) is its one peer dependency and it has no runtime dependencies of its own.
`@titan-design/review-harness` serves rounds against these schemas; anything else that writes or
reads a round imports them from here instead of copying them.

## Schema ids

| Constant                    | Value                     | Meaning                                                               |
| --------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `MANIFEST_SCHEMA_ID`        | `titan-review/round@2`    | The round contract. `RoundSchema` accepts only this id.               |
| `LEGACY_MANIFEST_SCHEMA_ID` | `titan-review/round@1`    | A round written before the contract. `ManifestSchema` still reads it. |
| `FEEDBACK_SCHEMA_ID`        | `titan-review/feedback@1` | The submission a round returns, validated by `FeedbackSchema`.        |
| `LOCKS_SCHEMA_ID`           | `titan-locks/1`           | The decision-lock registry, validated by `LocksSchema`.               |

## Exports

- `RoundSchema`: the round@2 contract (sections with `deciding`, `changed` and `context`, a strip
  kind on each section with frames, `signsOff` on each pick-one, a loopback `storybookUrl`).
- `ManifestSchema`: any round the review page can render, round@1 included.
- `FeedbackSchema`, `RecommendationSchema`, and the section, variant, question and contrast schemas
  they compose.
- `SHIP_OPTIONS`, the only options a merge-bound question may offer.
- `TOPIC_PREFIXES`, the prefixes a question's optional `topics` keys take (`ask:`, `component:`,
  `token:`, `topic:`), and `StackedOnSchema`, the optional manifest `stackedOn` naming the base PR
  `{ repo, pr, headSha }` a stacked round renders beneath its own.
- A question's optional `frames`: the variant keys it asks about, all in its own section. A
  renderer places those frames directly above the question; a frame sits above one question.
- The review kinds (all optional): a question's `decision` (`iterate`, `ship` or `decide`,
  `DECISION_KINDS`) and `outcomes` (option text to `accept`, `changes` or `neutral`,
  `OPTION_OUTCOMES`); the manifest's `prGroups` (`[{ pr, headSha, sectionIds }]`,
  `PrGroupSchema`); and a variant's `variantUnit` (shared by every view of one variant),
  `alternate` (the column it is compared in) and `change` (`changed`, `new`, `removed` or
  `unchanged`, `FRAME_CHANGES`).
- `implemented` on a pick-one (an option) or pick-many (a list): what the PR implements at its
  head. `shipBlocks(round, feedback)` returns `{ pr, blocked, blockers: { questionId, kind,
message }[] }[]`, one per PR group: blocked when an answer in the group has free text (`comment`,
  `text`, a frame comment) or picks other than `implemented`; an unanswered question does not
  block. `pr` is `owner/name#n`; a group is its `prGroups` sections plus the questions whose
  `page` is that PR.
- A `prGroups` entry's optional `stackedOn` (`{ repo, pr, headSha }`) names the base that one group
  renders on, so two groups of one round can sit on different bases (`stackBase(group)` gives
  the base's `owner/name#n`). A group stacked on another group of the round ships after that
  holder: its `shipBlocks` status carries `shipsAfter`, and it is blocked (kind
  `holder-not-shipped`, naming the holder) while the holder's Ship is answered Don't ship or asks
  for a revision. An unanswered holder does not block, as an unanswered question does not.
- `lintRound(round)`, a pure check of a parsed round against the review-layout rules. It returns
  `{ rule, message }[]` (empty when the round passes; `LINT_RULES` lists the rules) and every
  round builder refuses a round with any problem.
- `LocksSchema` and `parseLocks(input)`: the `titan-locks/1` registry. A lock is keyed on the
  decision it implements, held by zero or more PRs at heads, and ordered by `after`; `dependents`
  wait on a lock by `stack-on` or `defer`. Parsing refuses an unknown lock id, an `after` cycle
  (`afterCycles` lists them), a repeated id and a decision row keyed by two locks.
- `isLoopbackUrl(url)`, true only for an http(s) URL on `127.0.0.1`, `localhost` or `[::1]`.
- `manifestJsonSchema()` and `feedbackJsonSchema()`, the JSON Schema an author writes against.
- The inferred types: `ManifestInput`, `Manifest`, `Feedback`, `Recommendation`, `Question`,
  `Section`, `Variant` and the rest.

```ts
import { RoundSchema, MANIFEST_SCHEMA_ID, type ManifestInput } from '@titan-design/review-schema'

const round: ManifestInput = { schema: MANIFEST_SCHEMA_ID /* ... */ }
const result = RoundSchema.safeParse(round)
```

## JSON Schema files

`schema/round.schema.json` and `schema/feedback.schema.json` ship with the package (import them as
`@titan-design/review-schema/schema/round.schema.json`). They are generated from `src/schema.ts`
by `pnpm --filter @titan-design/review-schema schema`, and a test fails if they drift.
