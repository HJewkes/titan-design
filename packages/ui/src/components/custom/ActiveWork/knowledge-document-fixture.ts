import type { KnowledgeDocument } from './knowledge-document'
import { fixtureNote, fixtureSource } from './knowledge-fixture'

/*
 * Synthetic documents for the reader, its stories and tests. Every slug, title and
 * body is invented. Fixed values only: no `Date.now()`, no unseeded randomness.
 */

const NOTE_ITEM = fixtureNote('garden', {
  kind: 'gotcha',
  title: 'Raised beds drain slower after rain',
  age: 2,
  tags: ['soil', 'water', 'beds'],
})

/** A `gotcha` note whose body carries task, wiki and PR references, under a repeated title heading. */
export const NOTE_DOCUMENT: KnowledgeDocument = {
  item: NOTE_ITEM,
  body: `# Raised beds drain slower after rain

After the October rain the beds held water for two days. The liner added in GD-12 blocks the lower drain holes.

- Check the liner before the next planting, see [[bed-layout]].
- The first fix, #41, widened the top drains and did not help.
- **Do not** add more compost until the drains are clear; use \`rake -l 4\` to open the surface.

Raised the same question under KL-3 for the kiln shelves.`,
}

const DEEPDIVE_ITEM = fixtureSource('kiln', {
  type: 'deepdive',
  filename: 'glaze-firing-schedules.md',
  title: 'Glaze firing schedules',
  age: 9,
})

/** A deep dive with a pipe table, a fenced code block and a numbered list. */
export const SOURCE_DOCUMENT_TABLES: KnowledgeDocument = {
  item: DEEPDIVE_ITEM,
  body: `# Glaze firing schedules

How the three schedules compare.

## Schedules

| Schedule | Ramp | Hold | Cool |
| --- | --- | --- | --- |
| Slow | 80 per hour | 20 minutes | 12 hours |
| Standard | 120 per hour | 10 minutes | 8 hours |
| Fast | 180 per hour | none | 5 hours |

## Controller program

\`\`\`
segment 1: ramp 120 to 1000
segment 2: ramp 60 to 1220
segment 3: hold 10
\`\`\`

## Steps

1. Load the shelves from the bottom.
2. Start the standard program.
3. Log the cone reading when the kiln cools.`,
}

const LONG_ITEM = fixtureSource('tidepool', {
  type: 'session',
  filename: 'survey-log.md',
  title: 'Survey log',
  age: 21,
})

/** A 5,000-line source, for the reader's scale gate. */
export const SOURCE_DOCUMENT_LONG: KnowledgeDocument = {
  item: LONG_ITEM,
  body: [
    '# Survey log',
    ...Array.from(
      { length: 4_999 },
      (_, index) => `Pool ${index + 1}: counted ${(index * 7) % 23} anemones, water clear.`
    ),
  ].join('\n'),
}

/** The read stopped at the size cap: the body is the start of a 2 MB file. */
export const DOCUMENT_TRUNCATED: KnowledgeDocument = {
  item: fixtureSource('tidepool', {
    type: 'session',
    filename: 'run/tide-readings.md',
    title: 'Tide readings',
    age: 4,
  }),
  body: SOURCE_DOCUMENT_LONG.body.split('\n').slice(0, 40).join('\n'),
  isTruncated: true,
  bytes: 2_097_152,
}

/** Frontmatter only: the body is the empty string. */
export const DOCUMENT_EMPTY_BODY: KnowledgeDocument = {
  item: fixtureNote('orrery', { kind: 'fyi', title: 'Placeholder for the lens order', age: 6 }),
  body: '',
}

/** A nested `.json` source: plain mono text. */
export const DOCUMENT_JSON: KnowledgeDocument = {
  item: fixtureSource('orrery', {
    type: 'pointer',
    filename: 'exports/lens-order.json',
    title: 'lens-order.json',
    age: 12,
  }),
  body: '{\n  "lenses": [\n    { "id": "L1", "focal": 120 },\n    { "id": "L2", "focal": 85 }\n  ],\n  "status": "ordered"\n}',
}

/** A nested `.png` source: no preview, and no body passed to the prose renderer. */
export const DOCUMENT_BINARY: KnowledgeDocument = {
  item: fixtureSource('orrery', {
    type: 'pointer',
    filename: 'exports/dial-photo.png',
    title: 'dial-photo.png',
    age: 12,
  }),
  body: '\u0089PNG\r\n\u001a\n\u0000\u0000\u0000\rIHDR',
}

/** Every document the browser story can open, by item id. */
export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  NOTE_DOCUMENT,
  SOURCE_DOCUMENT_TABLES,
  DOCUMENT_TRUNCATED,
  DOCUMENT_EMPTY_BODY,
  DOCUMENT_JSON,
  DOCUMENT_BINARY,
]
