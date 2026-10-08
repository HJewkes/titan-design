// Synthetic fixtures for CommandPalette: every name is invented (a small publishing app with pages,
// articles and people). Only the shapes follow the TP-853 Round 0 contract. Not exported from any barrel.

import type { CommandGroup, CommandItem, LoadResults } from './types'

export interface SourceOptions {
  delayMs: number
  fails?: boolean
}

/** An async source plus a handle that settles every pending request at once. */
export interface PaletteSource {
  loadResults: LoadResults
  release: () => void
}

export interface PaletteFixture {
  name: string
  items: CommandItem[]
  groups: CommandGroup[]
  recentItems: CommandItem[]
  defaultQuery?: string
  createSource?: (options: SourceOptions) => PaletteSource
}

export const SOURCE_ERROR_MESSAGE = 'Search failed (synthetic)'

/** Settles after `delayMs`, or only on `release()` when the delay is not finite; aborts reject. */
export function createDelayedSource(results: CommandItem[], options: SourceOptions): PaletteSource {
  const pending = new Set<() => void>()
  const loadResults: LoadResults = (_query, { signal }) =>
    new Promise((resolve, reject) => {
      const settle = () => {
        pending.delete(settle)
        clearTimeout(timer)
        if (options.fails) reject(new Error(SOURCE_ERROR_MESSAGE))
        else resolve(results)
      }
      const timer = Number.isFinite(options.delayMs)
        ? setTimeout(settle, options.delayMs)
        : undefined
      pending.add(settle)
      signal.addEventListener(
        'abort',
        () => {
          pending.delete(settle)
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true }
      )
    })
  return { loadResults, release: () => [...pending].forEach((settle) => settle()) }
}

const item = (id: string, label: string, groupId?: string, description?: string): CommandItem => ({
  id,
  label,
  ...(groupId === undefined ? {} : { groupId }),
  ...(description === undefined ? {} : { description }),
})

const STATIC_GROUPS: CommandGroup[] = [
  { id: 'pages', label: 'Go to' },
  { id: 'articles', label: 'Articles' },
  { id: 'people', label: 'People' },
]

const ASYNC_GROUPS: CommandGroup[] = [
  { id: 'drafts', label: 'Drafts' },
  { id: 'tags', label: 'Tags' },
]

const STATIC_ITEMS: CommandItem[] = [
  { ...item('page-home', 'Home', 'pages'), keywords: ['start', 'dashboard'] },
  item('page-settings', 'Settings', 'pages', 'Account, theme and notifications'),
  item('page-assets', 'Asset library', 'pages', 'Images and files used in articles'),
  item('page-reset', 'Reset password', 'pages'),
  item('article-tides', 'Reading the tides at Larkspur Bay', 'articles', 'Feature, 9 min read'),
  item('article-bread', 'A week of rye bread', 'articles', 'Column, 4 min read'),
  item('article-maps', 'Hand-drawn maps of Quillon', 'articles', 'Photo essay'),
  item('article-lamps', 'Restoring brass lamps', 'articles', 'How-to, 6 min read'),
  item('person-orla', 'Orla Venn', 'people', 'Editor'),
  item('person-tomas', 'Tomas Ardel', 'people', 'Staff writer'),
  item('person-imke', 'Imke Sorrow', 'people', 'Photographer'),
  item('person-bastian', 'Bastian Kell', 'people', 'Copy desk'),
]

const filler = (seed: string, length: number): string =>
  `${seed} `.repeat(Math.ceil(length / (seed.length + 1))).slice(0, length)

/** A title of 120 characters ending in an ellipsis, as the search service truncates them. */
const longTitle = (lead: string): string =>
  `${lead} ${filler('and the quiet harbour', 118 - lead.length)}…`

const ASYNC_ITEMS: CommandItem[] = [
  item(
    'draft-ferry',
    longTitle('Notes on the night ferry'),
    'drafts',
    filler('excerpt of a ferry draft', 160)
  ),
  item('draft-orchard', 'Orchard almanac, second pass', 'drafts', filler('orchard notes', 160)),
  item('draft-kites', 'Kites over Merrow Down', 'drafts', filler('kite festival copy', 160)),
  item('draft-salt', longTitle('Salt marsh field log'), 'drafts', filler('marsh log excerpt', 160)),
  item('tag-coast', 'coast', 'tags', 'Tag, 14 articles'),
  item('tag-recipes', 'recipes', 'tags', 'Tag, 9 articles'),
  item('tag-craft', 'craft', 'tags', 'Tag, 6 articles'),
  item('tag-maps', 'maps', 'tags', 'Tag, 3 articles'),
]

const RECENT_ITEMS: CommandItem[] = [
  item('article-maps', 'Hand-drawn maps of Quillon', 'articles'),
  item('page-settings', 'Settings', 'pages'),
  item('person-orla', 'Orla Venn', 'people'),
]

const ADJECTIVES = [
  'amber',
  'brisk',
  'cobalt',
  'dusky',
  'early',
  'fallow',
  'gilded',
  'hollow',
  'idle',
  'jade',
]
const NOUNS = [
  'atlas',
  'bramble',
  'cinder',
  'delta',
  'ember',
  'fjord',
  'grove',
  'heron',
  'inlet',
  'juniper',
]

/** Deterministic by construction: each index names one adjective, noun and group. */
function veryLargeItems(count: number): CommandItem[] {
  return Array.from({ length: count }, (_, i) => {
    const adjective = ADJECTIVES[i % ADJECTIVES.length]
    const noun = NOUNS[Math.floor(i / ADJECTIVES.length) % NOUNS.length]
    return item(
      `entry-${i}`,
      `${adjective} ${noun} ${i}`,
      STATIC_GROUPS[i % STATIC_GROUPS.length].id
    )
  })
}

const defaultSource = (options: SourceOptions) => createDelayedSource(ASYNC_ITEMS, options)

export const PALETTE_DEFAULT: PaletteFixture = {
  name: 'Default',
  items: STATIC_ITEMS,
  groups: [...STATIC_GROUPS, ...ASYNC_GROUPS],
  recentItems: RECENT_ITEMS,
  createSource: defaultSource,
}

export const DEFAULT_ASYNC_DELAY_MS = 300

export const PALETTE_STATIC_ONLY: PaletteFixture = {
  name: 'Static only',
  items: STATIC_ITEMS,
  groups: STATIC_GROUPS,
  recentItems: [],
}

export const PALETTE_ONE_ITEM: PaletteFixture = {
  name: 'One item',
  items: [item('page-home', 'Home')],
  groups: [],
  recentItems: [],
}

export const PALETTE_EMPTY: PaletteFixture = {
  name: 'Empty',
  items: [],
  groups: [],
  recentItems: [],
}

export const PALETTE_NO_MATCH: PaletteFixture = {
  ...PALETTE_DEFAULT,
  name: 'No match',
  defaultQuery: 'zzzz',
}

export const VERY_LARGE_COUNT = 10_000

export const PALETTE_VERY_LARGE: PaletteFixture = {
  name: 'Very large',
  items: veryLargeItems(VERY_LARGE_COUNT),
  groups: STATIC_GROUPS,
  recentItems: [],
}

export const PALETTE_LONG_LABEL: PaletteFixture = {
  name: 'Long label',
  items: [
    item('long-label', 'w'.repeat(254), 'articles', filler('a description that runs on', 160)),
    item('short-label', 'Restoring brass lamps', 'articles'),
  ],
  groups: STATIC_GROUPS,
  recentItems: [],
}

export const UNKNOWN_GROUP_ID = 'archive'

export const PALETTE_MISSING: PaletteFixture = {
  name: 'Missing',
  items: [
    item('loose-1', 'Untitled page'),
    item('loose-2', 'Archived column', UNKNOWN_GROUP_ID),
    item('loose-3', 'Reading the tides at Larkspur Bay', 'articles'),
  ],
  groups: STATIC_GROUPS,
  recentItems: [],
}

export const PALETTE_SLOW: PaletteFixture = {
  ...PALETTE_STATIC_ONLY,
  name: 'Slow',
  groups: PALETTE_DEFAULT.groups,
  createSource: ({ fails }) => createDelayedSource(ASYNC_ITEMS, { delayMs: Infinity, fails }),
}

export const PALETTE_FAILING: PaletteFixture = {
  ...PALETTE_STATIC_ONLY,
  name: 'Failing',
  createSource: ({ delayMs }) => createDelayedSource([], { delayMs, fails: true }),
}

export const HOSTILE_SHARED_ID = 'shared'

export const HOSTILE_LABELS = {
  empty: '',
  regex: '.*+?^${}()|[]\\/ (a|b)*',
  emoji: 'Reading list 📚 with 👩🏽‍💻 and 🏳️‍🌈',
  rightToLeft: 'مقالات جديدة للقراءة',
}

export const PALETTE_HOSTILE: PaletteFixture = {
  name: 'Hostile',
  items: [
    { ...item('hostile-first', 'Disabled first row', 'pages'), isDisabled: true },
    item(HOSTILE_SHARED_ID, 'Shared id from the static list', 'pages'),
    item('hostile-empty', HOSTILE_LABELS.empty, 'pages'),
    item('hostile-regex', HOSTILE_LABELS.regex, 'articles'),
    item('hostile-emoji', HOSTILE_LABELS.emoji, 'articles'),
    item('hostile-rtl', HOSTILE_LABELS.rightToLeft, 'people'),
  ],
  groups: [...STATIC_GROUPS, { id: 'pages', label: 'Duplicate group id' }],
  recentItems: [item(HOSTILE_SHARED_ID, 'Shared id from the recent list', 'pages')],
  createSource: (options) =>
    createDelayedSource(
      [item(HOSTILE_SHARED_ID, 'Shared id from the async source', 'tags')],
      options
    ),
}

export const PALETTE_ALL_DISABLED: PaletteFixture = {
  name: 'All disabled',
  items: STATIC_ITEMS.slice(0, 4).map((entry) => ({ ...entry, isDisabled: true })),
  groups: STATIC_GROUPS,
  recentItems: [],
}

export const PALETTE_FIXTURES: Record<string, PaletteFixture> = {
  default: PALETTE_DEFAULT,
  staticOnly: PALETTE_STATIC_ONLY,
  oneItem: PALETTE_ONE_ITEM,
  empty: PALETTE_EMPTY,
  noMatch: PALETTE_NO_MATCH,
  veryLarge: PALETTE_VERY_LARGE,
  longLabel: PALETTE_LONG_LABEL,
  missing: PALETTE_MISSING,
  slow: PALETTE_SLOW,
  failing: PALETTE_FAILING,
  hostile: PALETTE_HOSTILE,
  allDisabled: PALETTE_ALL_DISABLED,
}
