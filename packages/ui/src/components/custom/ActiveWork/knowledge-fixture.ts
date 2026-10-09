import type { NoteKind, SourceType } from './knowledge-class'
import type { KnowledgeItem, KnowledgeProblem } from './knowledge-filters'

/*
 * Synthetic knowledge for the list, its stories and tests. Every slug, title and
 * path is invented; ids and paths follow the wire shape (`<slug>:notes:<file>`,
 * absolute paths). Fixed values only: no `Date.now()`, no unseeded randomness.
 */

/** The reference instant every fixture date is read against. */
export const KNOWLEDGE_NOW = Date.parse('2026-09-30T12:00:00.000Z')

const DAY_MS = 86_400_000

/** The ISO day `days` before {@link KNOWLEDGE_NOW}. */
const daysAgo = (days: number) => new Date(KNOWLEDGE_NOW - days * DAY_MS).toISOString().slice(0, 10)

interface NoteSeed {
  kind: NoteKind
  title: string
  /** Days before KNOWLEDGE_NOW. */
  age: number
  tags?: string[]
}

interface SourceSeed {
  type: SourceType
  filename: string
  title: string
  age?: number
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function fixtureNote(slug: string, seed: NoteSeed): KnowledgeItem {
  const created = daysAgo(seed.age)
  const filename = `${created}-${slugify(seed.title)}.md`
  return {
    id: `${slug}:notes:${filename}`,
    ref: `note:${slug}/${filename}`,
    record: 'note',
    initiative: slug,
    title: seed.title,
    path: `/synthetic/${slug}/sources/notes/${filename}`,
    noteKind: seed.kind,
    created,
    mtime: `${created}T09:00:00.000Z`,
    ...(seed.tags ? { tags: seed.tags } : {}),
  }
}

export function fixtureSource(slug: string, seed: SourceSeed): KnowledgeItem {
  return {
    id: `${slug}:sources:${seed.filename}`,
    record: 'source',
    initiative: slug,
    title: seed.title,
    path: `/synthetic/${slug}/sources/${seed.filename}`,
    sourceType: seed.type,
    ...(seed.age === undefined ? {} : { mtime: `${daysAgo(seed.age)}T15:30:00.000Z` }),
    ...(seed.filename.includes('/') ? { isNested: true } : {}),
  }
}

const GARDEN = [
  fixtureNote('garden', {
    kind: 'gotcha',
    title: 'Raised beds drain slower after rain',
    age: 2,
    tags: ['soil', 'water'],
  }),
  fixtureNote('garden', {
    kind: 'decision',
    title: 'Plant the beans along the north fence',
    age: 6,
  }),
  fixtureNote('garden', {
    kind: 'process',
    title: 'How to rotate the compost bins',
    age: 15,
    tags: ['compost'],
  }),
  fixtureNote('garden', { kind: 'fyi', title: 'The hose timer runs on two batteries', age: 41 }),
  fixtureNote('garden', {
    kind: 'plan',
    title: 'Spring seed order',
    age: 88,
    tags: ['seeds', 'spring', 'budget'],
  }),
  fixtureSource('garden', {
    type: 'deepdive',
    filename: 'deepdive-soil-ph.md',
    title: 'Soil acidity by bed',
    age: 9,
  }),
  fixtureSource('garden', {
    type: 'pr',
    filename: 'pr-12-trellis.md',
    title: 'Trellis for the climbing peas',
    age: 33,
  }),
  fixtureSource('garden', {
    type: 'session',
    filename: 'session-planting-day.md',
    title: 'Planting day record',
    age: 70,
  }),
  fixtureSource('garden', {
    type: 'pointer',
    filename: 'captures/bed-3-photo-notes.md',
    title: 'Bed 3 photo notes',
    age: 4,
  }),
  fixtureSource('garden', {
    type: 'pointer',
    filename: 'captures/frost-dates.md',
    title: 'Frost dates by year',
    age: 120,
  }),
]

const KILN = [
  fixtureNote('kiln', {
    kind: 'gotcha',
    title: 'Cone 6 glazes craze on the thin bowls',
    age: 1,
    tags: ['glaze'],
  }),
  fixtureNote('kiln', { kind: 'decision', title: 'Fire bisque loads on Fridays only', age: 12 }),
  fixtureNote('kiln', {
    kind: 'process',
    title: 'Loading the shelves for a glaze fire',
    age: 30,
    tags: ['firing', 'shelves'],
  }),
  fixtureNote('kiln', { kind: 'fyi', title: 'The controller logs every segment', age: 55 }),
  fixtureNote('kiln', { kind: 'plan', title: 'Second kiln for the studio', age: 100 }),
  fixtureSource('kiln', {
    type: 'deepdive',
    filename: 'deepdive-cooling-curves.md',
    title: 'Cooling curves compared',
    age: 19,
  }),
  fixtureSource('kiln', {
    type: 'pr',
    filename: 'pr-7-element-swap.md',
    title: 'Element swap write-up',
    age: 3,
  }),
  fixtureSource('kiln', {
    type: 'pointer',
    filename: 'pointer-supplier.md',
    title: 'Clay supplier pointer',
    age: 61,
  }),
  fixtureSource('kiln', {
    type: 'session',
    filename: 'logs/firing-0412.md',
    title: 'Firing log, April',
    age: 26,
  }),
  fixtureSource('kiln', {
    type: 'deepdive',
    filename: 'logs/thermocouple.md',
    title: 'Thermocouple drift',
    age: 80,
  }),
]

const TIDEPOOL = [
  fixtureNote('tidepool', {
    kind: 'gotcha',
    title: 'Low tide tables are a day off in the app',
    age: 5,
    tags: ['tides'],
  }),
  fixtureNote('tidepool', { kind: 'decision', title: 'Count anemones by quadrant', age: 8 }),
  fixtureNote('tidepool', {
    kind: 'process',
    title: 'Photograph each quadrant from the same rock',
    age: 22,
  }),
  fixtureNote('tidepool', {
    kind: 'fyi',
    title: 'Sea stars returned to pool four',
    age: 47,
    tags: ['survey'],
  }),
  fixtureNote('tidepool', { kind: 'plan', title: 'Winter survey schedule', age: 92 }),
  fixtureSource('tidepool', {
    type: 'session',
    filename: 'session-first-survey.md',
    title: 'First survey record',
    age: 14,
  }),
  fixtureSource('tidepool', {
    type: 'deepdive',
    filename: 'deepdive-species-list.md',
    title: 'Species list method',
    age: 36,
  }),
  fixtureSource('tidepool', {
    type: 'pr',
    filename: 'pr-3-quadrant-grid.md',
    title: 'Quadrant grid change',
    age: 65,
  }),
  fixtureSource('tidepool', {
    type: 'pointer',
    filename: 'surveys/pool-four.md',
    title: 'Pool four survey sheet',
    age: 11,
  }),
  fixtureSource('tidepool', {
    type: 'pointer',
    filename: 'surveys/pool-seven.md',
    title: 'Pool seven survey sheet',
    age: 74,
  }),
]

const ORRERY = [
  fixtureNote('orrery', {
    kind: 'gotcha',
    title: 'The brass gears bind below ten degrees',
    age: 3,
    tags: ['gears', 'cold'],
  }),
  fixtureNote('orrery', { kind: 'decision', title: 'Drive the moons from one shaft', age: 10 }),
  fixtureNote('orrery', { kind: 'process', title: 'Cleaning the gear train', age: 27 }),
  fixtureNote('orrery', { kind: 'fyi', title: 'Saturn ring is cut from one sheet', age: 58 }),
  fixtureNote('orrery', {
    kind: 'plan',
    title: 'Add the outer planets',
    age: 115,
    tags: ['scope'],
  }),
  fixtureSource('orrery', {
    type: 'pr',
    filename: 'pr-21-crank.md',
    title: 'Hand crank redesign',
    age: 7,
  }),
  fixtureSource('orrery', {
    type: 'deepdive',
    filename: 'deepdive-gear-ratios.md',
    title: 'Gear ratios for each orbit',
    age: 44,
  }),
  fixtureSource('orrery', {
    type: 'session',
    filename: 'session-assembly.md',
    title: 'Assembly session record',
    age: 85,
  }),
  fixtureSource('orrery', {
    type: 'pointer',
    filename: 'drawings/base-plate.md',
    title: 'Base plate drawing',
    age: 18,
  }),
  fixtureSource('orrery', {
    type: 'pr',
    filename: 'drawings/arm-lengths.md',
    title: 'Arm lengths table',
    age: 95,
  }),
]

/** 40 items over four initiatives: every note kind, every source type, eight nested sources. */
export const KNOWLEDGE_ITEMS: KnowledgeItem[] = [...GARDEN, ...KILN, ...TIDEPOOL, ...ORRERY]

export const KNOWLEDGE_EMPTY: KnowledgeItem[] = []

export const KNOWLEDGE_ONE: KnowledgeItem[] = [GARDEN[0]!]

/** Sources only, with no `created`; the last two have no `mtime` either, so a date range must count them. */
export const KNOWLEDGE_SOURCES_ONLY: KnowledgeItem[] = [
  ...KNOWLEDGE_ITEMS.filter((item) => item.record === 'source').slice(0, 6),
  fixtureSource('kiln', {
    type: 'pointer',
    filename: 'pointer-undated.md',
    title: 'Undated pointer',
  }),
  fixtureSource('garden', {
    type: 'deepdive',
    filename: 'archive/undated.md',
    title: 'Undated archive note',
  }),
]

/** Twelve notes written on one day, so a date sort leaves every tie to the stable order. */
export const KNOWLEDGE_SAME_DAY: KnowledgeItem[] = Array.from({ length: 12 }, (_, index) =>
  fixtureNote(index % 2 === 0 ? 'kiln' : 'garden', {
    kind: 'fyi',
    title: `Same-day note ${String(index + 1).padStart(2, '0')}`,
    age: 4,
  })
)

const HOSTILE_DUPLICATE = fixtureNote('orrery', {
  kind: 'fyi',
  title: 'First copy of a duplicated id',
  age: 9,
})

/**
 * Data that breaks naive rendering: an unbroken 400-character title, a title of
 * markup, twenty tags, one filename in two initiatives, two items with one id, and
 * a `created` of 2026-02-30, which `Date.parse` would quietly turn into March.
 */
export const KNOWLEDGE_HOSTILE: KnowledgeItem[] = [
  fixtureNote('garden', { kind: 'fyi', title: 'x'.repeat(400), age: 6 }),
  fixtureNote('kiln', {
    kind: 'gotcha',
    title: '<script>alert("x")</script> **not bold** [not](a-link)',
    age: 7,
  }),
  fixtureNote('tidepool', {
    kind: 'process',
    title: 'A note with twenty tags',
    age: 8,
    tags: Array.from({ length: 20 }, (_, index) => `tag-${index + 1}`),
  }),
  fixtureSource('garden', {
    type: 'pr',
    filename: 'pr-1-shared-name.md',
    title: 'Shared filename in garden',
    age: 10,
  }),
  fixtureSource('kiln', {
    type: 'pr',
    filename: 'pr-1-shared-name.md',
    title: 'Shared filename in kiln',
    age: 11,
  }),
  HOSTILE_DUPLICATE,
  { ...HOSTILE_DUPLICATE, title: 'Second copy of a duplicated id' },
  {
    ...fixtureNote('orrery', {
      kind: 'decision',
      title: 'Written on a day that does not exist',
      age: 12,
    }),
    created: '2026-02-30',
  },
]

/** A seeded linear congruential generator, so the large fixture is the same on every run. */
function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 2 ** 32
    return state / 2 ** 32
  }
}

const LARGE_SLUG_WORDS = [
  'loom',
  'quarry',
  'harbor',
  'meadow',
  'forge',
  'atlas',
  'ember',
  'reef',
  'mill',
  'canyon',
]
const NOTE_KIND_CYCLE: NoteKind[] = ['process', 'gotcha', 'fyi', 'decision', 'plan']
const SOURCE_TYPE_CYCLE: SourceType[] = ['pr', 'deepdive', 'session', 'pointer']

function largeItem(index: number, random: () => number): KnowledgeItem {
  const slug = `${LARGE_SLUG_WORDS[index % 10]}-${Math.floor(index / 10) % 3}`
  const age = Math.floor(random() * 365)
  if (random() < 0.6) {
    const kind = NOTE_KIND_CYCLE[Math.floor(random() * 5)]!
    return fixtureNote(slug, { kind, title: `Synthetic ${kind} note ${index}`, age })
  }
  const type = SOURCE_TYPE_CYCLE[Math.floor(random() * 4)]!
  const filename = random() < 0.3 ? `nested/item-${index}.md` : `${type}-item-${index}.md`
  return fixtureSource(slug, { type, filename, title: `Synthetic ${type} source ${index}`, age })
}

/** 5,000 seeded items over 30 initiatives: the stated scale. */
export const KNOWLEDGE_LARGE: KnowledgeItem[] = (() => {
  const random = seededRandom(859)
  return Array.from({ length: 5000 }, (_, index) => largeItem(index, random))
})()

/** Three files the source could not read, with the reason for each. */
export const KNOWLEDGE_PROBLEMS: KnowledgeProblem[] = [
  {
    initiative: 'garden',
    filename: '2026-09-01-broken-frontmatter.md',
    error: 'frontmatter is not valid YAML',
  },
  {
    initiative: 'kiln',
    filename: '2026-08-14-missing-kind.md',
    error: 'missing required field: kind',
  },
  { initiative: 'orrery', filename: '2026-07-30-unreadable.md', error: 'permission denied' },
]
