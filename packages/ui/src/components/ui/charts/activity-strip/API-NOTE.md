# ActivityStrip API note

Source: TP-849 Round 0 contract (section 7), restated for the model slice (TP-6259). This slice holds
the pure model and fixtures only; the component, hook and story follow in later slices.

**What it shows.** Equal-width time buckets with an event count each, drawn as intensity (not height), plus
supplied gaps (spans already judged idle). All times are epoch milliseconds; the model has no time zone.

**Controlled versus uncontrolled.** The only state is the cursor: `cursor`, `defaultCursor`,
`onCursorChange`, `onCursorCommit` (later slice). The strip reports a time; the consumer scrolls or seeks.
`window` is a stateless painted range.

**Model functions** (`activity-strip-model.ts`, pure, never throw):

- `cleanBuckets`: drops non-finite starts, sums duplicate starts, orders by start. A count that is null,
  NaN, infinite or negative is unknown: it adds nothing and is tallied in `unknownCount`.
- `resolveBucketMs`: a positive finite value, else 60,000.
- `resolveDomain`: the given range when finite and non-empty, else the extent of buckets and gaps, else one
  bucket from zero. Never empty.
- `cleanGaps`: drops inverted and empty gaps, clips to the domain, merges overlapping or touching ones.
- `resolveMaxCount`: the shared ceiling when positive, else the largest count, never below 1.
- `binCount(count, max, scale, steps = 4)`: 0 for zero, null, NaN or negative; otherwise 1..steps. A positive
  count never bins to 0. `scale` is `linear`, `sqrt` (default) or `log`.
- `columnMax(buckets, domain, length, bucketMs)`: merges buckets into whole pixel columns by the maximum,
  never the mean, so a one-minute spike survives. At most `floor(length)` columns, each in `0..length-1`.
- `offsetOfTime` / `timeAtOffset`: inverse of each other on the domain, clamped; a bad length maps to 0 and
  the domain start.
- `stepCursor(cursor, key, domain, bucketMs)`: ArrowRight/ArrowDown one bucket later, ArrowLeft/ArrowUp one
  earlier, PageDown/PageUp ten, Home/End the ends. Clamps, never wraps. From a null cursor the first press
  lands on the domain start (End: the domain end). Down moves later in both orientations (question C4).
- `bucketAt`: the cleaned bucket whose span holds a time, or null.
- `buildActivityStripModel`: combines the above into columns with steps, gap marks in pixels, totals, the
  busiest bucket and the longest gap.
- `summarizeActivity`: one sentence. Cases: Empty ("No activity."), Only gaps, One item (claims no busiest
  bucket), the general span/total/busiest/gaps sentence, and Missing values ("N buckets with no count").

**Rules fixed here.** A column's intensity is its maximum bucket. A positive count always draws at least the
lowest step. Gaps are supplied, not derived. Reported times are always inside the domain.

**Fixtures** (`fixtures.ts`): Default, Row, Minimap, Midnight, Empty, One item, All equal, Spike, Missing
values, Shared ceiling, Very large (4,320 buckets), Only gaps and Hostile, all with fixed epoch values and
seeded counts, so no test reads the clock. Not exported from any barrel.
