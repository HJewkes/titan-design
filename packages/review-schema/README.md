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
