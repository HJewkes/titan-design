/**
 * The declared non-text pairs (WCAG 1.4.11 plus the repo's own separator floors).
 *
 * axe checks text only, so nothing else in CI sees a control boundary, a dot, a
 * fill, a track or a separator. Each pair names the semantic token a primitive
 * paints and the Tailwind class that paints it; `sources` is what the source
 * test holds the pair to, so a primitive that moves to another token must move
 * its pair too, in the same PR.
 *
 * Source paths are relative to `src/components`.
 */
import type { semanticColorsDark } from '../tokens/semantic'

export type ColorToken = keyof typeof semanticColorsDark

/** The five planes every pair is measured on. */
export const PLANES = [
  'background-base',
  'surface-base',
  'surface-elevated',
  'surface-raised',
  'surface-overlay',
] as const satisfies readonly ColorToken[]

/** A ratio floor (boundary, mark, fill, track) or a ΔL* floor (separator). */
export type Floor = { ratio: number } | { deltaL: number }

export interface PairSource {
  file: string
  /** The class (or literal) the file must still contain; matched as a whole token. */
  paints: string
}

export interface NonTextPair {
  id: string
  /** Painted colour; alpha is composited over what it sits on. */
  token: ColorToken
  /** What it sits on: the plane (default) or a track token that itself sits on the plane. */
  over?: ColorToken
  floor: Floor
  sources: readonly PairSource[]
}

const MARK: Floor = { ratio: 3 }
const SUBTLE: Floor = { deltaL: 7 }
const DEFAULT: Floor = { deltaL: 12 }
const STRONG: Floor = { deltaL: 18 }

const src = (file: string, paints: string): PairSource => ({ file, paints })

// ── Control boundaries and unchecked/off marks ───────────────────────────────
const boundaries: NonTextPair[] = [
  {
    id: 'boundary.border-input',
    token: 'border-input',
    floor: MARK,
    sources: [
      src('ui/input/Input.tsx', 'border-border-input'),
      src('ui/select/Select.tsx', 'border-border-input'),
      src('ui/autocomplete/Autocomplete.tsx', 'border-border-input'),
      src('ui/checkbox/Checkbox.tsx', 'border-border-input'),
      src('ui/radio/Radio.tsx', 'border-border-input'),
      src('ui/switch/Switch.tsx', 'bg-border-input'),
    ],
  },
  {
    id: 'boundary.border-input-hover',
    token: 'border-input-hover',
    floor: MARK,
    sources: [
      src('ui/input/Input.tsx', 'web:hover:border-border-input-hover'),
      src('ui/select/Select.tsx', 'web:hover:border-border-input-hover'),
    ],
  },
  {
    id: 'boundary.surface-input',
    token: 'surface-input',
    floor: MARK,
    sources: [
      src('ui/input/Input.tsx', 'bg-surface-input'),
      src('ui/autocomplete/Autocomplete.tsx', 'bg-surface-input'),
    ],
  },
  {
    id: 'boundary.hairline-strong',
    token: 'hairline-strong',
    floor: MARK,
    sources: [
      src('ui/select/Select.tsx', 'border-hairline-strong'),
      src('ui/table/TableSelection.tsx', 'border-hairline-strong'),
      src('ui/progress/Progress.tsx', 'bg-hairline-strong'),
    ],
  },
  {
    id: 'boundary.switch-thumb-on-off-track',
    token: 'on-brand-primary',
    over: 'border-input',
    floor: MARK,
    sources: [src('ui/switch/Switch.tsx', 'bg-on-brand-primary')],
  },
]

// ── Tone marks: dots, fills, checked fills, tone borders, underlines ─────────
const MARK_TOKENS: ReadonlyArray<[ColorToken, ...PairSource[]]> = [
  [
    'brand-primary',
    src('ui/indicator/Indicator.tsx', 'bg-brand-primary'),
    src('ui/pill/Pill.tsx', 'bg-brand-primary'),
    src('ui/pill/Pill.tsx', 'border-brand-primary'),
    src('ui/progress/Progress.tsx', 'bg-brand-primary'),
    src('ui/tabs/Tabs.tsx', 'border-brand-primary'),
    src('ui/checkbox/Checkbox.tsx', 'bg-brand-primary'),
    src('ui/radio/Radio.tsx', 'bg-brand-primary'),
    src('ui/switch/Switch.tsx', 'bg-brand-primary'),
    src('ui/select/Select.tsx', 'bg-brand-primary'),
  ],
  [
    'brand-secondary',
    src('ui/pill/Pill.tsx', 'border-brand-secondary'),
    src('ui/progress/Progress.tsx', 'bg-brand-secondary'),
    src('ui/radio/Radio.tsx', 'bg-brand-secondary'),
  ],
  [
    'status-success',
    src('ui/indicator/Indicator.tsx', 'bg-status-success'),
    src('ui/pill/Pill.tsx', 'border-status-success'),
    src('ui/progress/Progress.tsx', 'bg-status-success'),
    src('ui/radio/Radio.tsx', 'bg-status-success'),
  ],
  ['status-live', src('ui/indicator/Indicator.tsx', 'bg-status-live')],
  [
    'status-error',
    src('ui/indicator/Indicator.tsx', 'bg-status-error'),
    src('ui/pill/Pill.tsx', 'border-status-error'),
    src('ui/progress/Progress.tsx', 'bg-status-error'),
    src('ui/radio/Radio.tsx', 'bg-status-error'),
    src('ui/checkbox/Checkbox.tsx', 'border-status-error'),
  ],
  ['status-error-vivid', src('ui/indicator/Indicator.tsx', 'bg-status-error-vivid')],
  [
    'status-warning',
    src('ui/indicator/Indicator.tsx', 'bg-status-warning'),
    src('ui/pill/Pill.tsx', 'border-status-warning'),
    src('ui/progress/Progress.tsx', 'bg-status-warning'),
  ],
  [
    'status-info',
    src('ui/indicator/Indicator.tsx', 'bg-status-info'),
    src('ui/pill/Pill.tsx', 'border-status-info'),
    src('ui/progress/Progress.tsx', 'bg-status-info'),
  ],
]

const marks: NonTextPair[] = MARK_TOKENS.map(([token, ...sources]) => ({
  id: `mark.${token}`,
  token,
  floor: MARK,
  sources,
}))

// ── Progress tracks: the track on the plane, and the fill on the track ───────
const TRACKS: ReadonlyArray<[string, ColorToken, ColorToken]> = [
  ['primary', 'brand-primary', 'brand-primary-muted'],
  ['secondary', 'brand-secondary', 'brand-secondary-muted'],
  ['success', 'status-success', 'status-success-muted'],
  ['error', 'status-error', 'status-error-muted'],
  ['warning', 'status-warning', 'status-warning-muted'],
  ['info', 'status-info', 'status-info-muted'],
]

const tracks: NonTextPair[] = TRACKS.flatMap(([tone, fill, track]) => {
  const paints = [src('ui/progress/Progress.tsx', `bg-${track}`)]
  return [
    { id: `track.${tone}`, token: track, floor: MARK, sources: paints },
    { id: `fill-on-track.${tone}`, token: fill, over: track, floor: MARK, sources: paints },
  ]
})

// ── Separators: held to the repo's ΔL* floors (7 / 12 / 18), not to WCAG ─────
// Divider, ListItem, Table, TablePagination, Modal and Metric paint `hairline`
// since TD-480; nothing paints the `divider` token any more.
const separators: NonTextPair[] = [
  {
    id: 'separator.hairline-subtle',
    token: 'hairline-subtle',
    floor: SUBTLE,
    sources: [
      src('ui/select/Select.tsx', 'border-hairline-subtle'),
      src('ui/card/Card.tsx', 'border-hairline-subtle'),
    ],
  },
  {
    id: 'separator.hairline-default',
    token: 'hairline-default',
    floor: DEFAULT,
    sources: [
      src('ui/tabs/Tabs.tsx', 'border-hairline'),
      src('ui/drawer/Drawer.tsx', 'border-hairline'),
      src('ui/menu/Menu.tsx', 'bg-hairline'),
      src('ui/collapse/Collapse.tsx', 'divide-hairline'),
      src('ui/form-field/FormField.tsx', 'border-hairline'),
      src('ui/progress/Progress.tsx', "['hairline-default']"),
      src('ui/divider/Divider.tsx', 'bg-hairline'),
      src('ui/list-item/ListItem.tsx', 'bg-hairline'),
      src('ui/table/Table.tsx', 'border-hairline'),
      src('ui/table/TablePagination.tsx', 'border-hairline'),
      src('ui/modal/Modal.tsx', 'border-hairline'),
      src('ui/metric/Metric.tsx', 'bg-hairline'),
    ],
  },
  {
    id: 'separator.hairline-strong',
    token: 'hairline-strong',
    floor: STRONG,
    sources: [src('ui/card/Card.tsx', 'border-hairline-strong')],
  },
  {
    id: 'separator.border-prominent',
    token: 'border-prominent',
    floor: DEFAULT,
    sources: [
      src('shell/TopBar.tsx', 'bg-border-prominent'),
      src('custom/Workout/ZoneTrack.tsx', 'border-prominent'),
      src('custom/Workout/SetBar.tsx', 'border-prominent'),
      src('custom/Workout/PlaceholderStrip.tsx', 'border-prominent'),
    ],
  },
]

export const NON_TEXT_PAIRS: readonly NonTextPair[] = [
  ...boundaries,
  ...marks,
  ...tracks,
  ...separators,
]
