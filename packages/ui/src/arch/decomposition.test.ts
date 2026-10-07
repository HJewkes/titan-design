// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  LIMITS,
  compareToBaseline,
  describeEntry,
  isInScope,
  measure,
  mergeBaseline,
  overLimit,
  programFor,
  programFromTree,
  // @ts-expect-error — plain-ESM build tooling, shared with scripts/update-decomposition-baseline.mjs
} from '../../scripts/decomposition.mjs'
import baseline from './decomposition-baseline.json'

type Tree = Record<string, string>
type Entries = Record<string, Record<string, number>>
type Kind = 'added' | 'grown' | 'stale'
interface Entry {
  key: string
  metric: string
  value: number | null
  limit: number
  baseline: number | null
}
type Comparison = Record<Kind, Entry[]>

const measureTree = (tree: Tree): Entries => measure(programFromTree(tree))

const NATIVEWIND_TYPES = fileURLToPath(new URL('../types/nativewind.d.ts', import.meta.url))

const propsOf = (entries: Entries) =>
  Object.fromEntries(Object.entries(entries).map(([key, metrics]) => [key, metrics.props]))

const BASE_PROPS = `export interface BaseFieldProps {
  label: string
  hint?: string
  tone?: 'calm' | 'loud'
  size?: 'sm' | 'md'
}
`

const FIELDS = `import { forwardRef, memo } from 'react'
import { Text, View, type ViewProps } from 'react-native'
import type { BaseFieldProps } from '../shared/base-props'

export interface PanelProps extends ViewProps {
  title: string
  subtitle?: string
}

export type FieldProps = Omit<BaseFieldProps, 'tone'> & { onPress?: () => void }

export function Panel({ title, subtitle, ...rest }: PanelProps) {
  return <View {...rest}><Text>{title}{subtitle}</Text></View>
}

export function Field({ label }: FieldProps) {
  return <Text>{label}</Text>
}

export const RefPanel = forwardRef<View, PanelProps>((props, ref) => (
  <View ref={ref}><Text>{props.title}</Text></View>
))

export const MemoField = memo<FieldProps>(({ label, hint }) => <Text>{label}{hint}</Text>)
`

const LINES = `/**
 * File-level JSDoc does not count.
 */
export function documented(): string {
  // a line comment

  /* a block
     comment */
  const url = 'http://example.com' // a trailing comment keeps its line
  const text = \`first
// inside a template, so code

last\`
  /** JSDoc on a local */
  const unused = 1
  return url + text + unused
}
`

const JSX_LINES = `import { Text, View } from 'react-native'

export function Card() {
  return (
    <View>
      {/* a JSX comment
          over two lines */}
      <Text>
        hello
      </Text>
    </View>
  )
}
`

const BRANCHES = `declare const input: { a?: { b?: () => number }; list?: number[] } | undefined
let cache: Record<string, number> = {}

export function ifs(n: number) {
  if (n > 1) return 1
  else if (n > 0) return 2
  return 3
}

export function logical(a: boolean, b: boolean, c?: string) {
  return (a && b) || (c ?? 'x') ? 1 : 0
}

export function optionals() {
  return input?.a?.b?.() ?? input?.list?.[0]
}

export function assignments(key: string) {
  cache[key] ??= 1
  cache[key] ||= 2
  cache[key] &&= 3
  return cache
}

export function loops(items: number[], record: Record<string, number>) {
  let total = 0
  for (let i = 0; i < items.length; i++) total += i
  for (const key in record) total += record[key]
  for (const item of items) total += item
  while (total > 100) total -= 1
  do total += 1
  while (total < 0)
  return total
}

export function switches(kind: string) {
  switch (kind) {
    case 'a':
      return 1
    case 'b':
    case 'c':
      return 2
    default:
      return 3
  }
}

export function guarded() {
  try {
    return JSON.parse('{}')
  } catch {
    return null
  }
}

export function defaults(a = 1, { b = 2, c } = { c: 3 }, [d = 4] = []) {
  return a + b + c + d
}

export function nested(items: number[]) {
  function inner(x?: number) {
    return x ?? 0
  }
  return items.map((x) => (x > 1 ? inner(x) : 0))
}

export class Shape {
  constructor(public size = 1) {}
  area(scale?: number) {
    return this.size * (scale || 1)
  }
}

export function Gate({ open, label }: { open: boolean; label?: string }) {
  return <>{open && label ? <span>{label}</span> : null}</>
}
`

const COMPLEXITY_MESSAGE = /(?:'([^']+)'|^(Constructor)) has a complexity of (\d+)/

function eslintComplexity(source: string): Record<string, number> {
  const linter = new Linter({ configType: 'flat' })
  const config = {
    files: ['**/*.tsx'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { complexity: ['error', 0] },
  }
  const result: Record<string, number> = {}
  for (const message of linter.verify(source, [config] as Linter.Config[], 'branches.tsx')) {
    const match = COMPLEXITY_MESSAGE.exec(message.message)
    if (match) result[match[1] ?? match[2].toLowerCase()] = Number(match[3])
  }
  return result
}

function detectorComplexity(entries: Entries, file: string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, metrics] of Object.entries(entries)) {
    if (!key.startsWith(`${file}#`)) continue
    const name = key.slice(key.lastIndexOf('>') + 1).replace(`${file}#`, '')
    if (!/[#.]/.test(name)) result[name] = metrics.complexity
  }
  return result
}

describe('decomposition detector', { timeout: 30_000 }, () => {
  it('counts props declared under src, not ones a component inherits from ViewProps', () => {
    const entries = measureTree({
      'components/shared/base-props.ts': BASE_PROPS,
      'components/fields/Fields.tsx': FIELDS,
    })

    expect(entries['components/fields/Fields.tsx#Panel'].props).toBe(2)
  })

  it('counts the props an Omit keeps from a titan type declared in another file', () => {
    const entries = measureTree({
      'components/shared/base-props.ts': BASE_PROPS,
      'components/fields/Fields.tsx': FIELDS,
    })

    expect(entries['components/fields/Fields.tsx#Field'].props).toBe(4)
  })

  it('ignores props a .d.ts augmentation adds, such as the className from nativewind.d.ts', () => {
    const tree = {
      'components/shared/base-props.ts': BASE_PROPS,
      'components/fields/Fields.tsx': FIELDS,
    }
    const augmented = { ...tree, 'types/nativewind.d.ts': readFileSync(NATIVEWIND_TYPES, 'utf8') }

    const plain = measureTree(tree)
    const withAugmentation = measureTree(augmented)

    expect(withAugmentation['components/fields/Fields.tsx#Panel'].props).toBe(2)
    expect(propsOf(withAugmentation)).toEqual(propsOf(plain))
  })

  it('resolves the props of forwardRef and memo components whose parameter is inferred', () => {
    const entries = measureTree({
      'components/shared/base-props.ts': BASE_PROPS,
      'components/fields/Fields.tsx': FIELDS,
    })

    expect(entries['components/fields/Fields.tsx#RefPanel']).toMatchObject({ props: 2 })
    expect(entries['components/fields/Fields.tsx#MemoField']).toMatchObject({ props: 4 })
  })

  it('counts code lines only: blank, comment and JSDoc lines drop, template lines stay', () => {
    const entries = measureTree({ 'utils/lines.ts': LINES })

    expect(entries['utils/lines.ts#documented']['function-lines']).toBe(9)
    expect(entries['utils/lines.ts']['file-lines']).toBe(9)
  })

  it('skips JSX comments and whitespace-only JSX text but counts JSX text lines', () => {
    const entries = measureTree({ 'components/card/Card.tsx': JSX_LINES })

    expect(entries['components/card/Card.tsx#Card']['component-lines']).toBe(9)
    expect(entries['components/card/Card.tsx']['file-lines']).toBe(10)
  })

  it("matches ESLint's complexity rule on every counted construct", () => {
    const entries = measureTree({ 'utils/branches.tsx': BRANCHES })

    const eslint = eslintComplexity(BRANCHES)
    const detector = detectorComplexity(entries, 'utils/branches.tsx')

    expect(Object.keys(eslint).length).toBeGreaterThanOrEqual(13)
    expect(detector).toEqual(eslint)
  })

  it('keeps function keys when lines are inserted above', () => {
    const source = `import { useMemo } from 'react'
export function Chart() {
  const a = useMemo(() => 1, [])
  const b = useMemo(() => 2, [])
  return a + b
}
`
    const before = Object.keys(measureTree({ 'utils/chart.ts': source }))
    const after = Object.keys(measureTree({ 'utils/chart.ts': `\n\nconst moved = 1\n\n${source}` }))

    expect(after).toEqual(before)
    expect(before).toEqual([
      'utils/chart.ts',
      'utils/chart.ts#Chart',
      'utils/chart.ts#Chart>a',
      'utils/chart.ts#Chart>b',
    ])
  })

  it('keeps every existing key when an unrelated sibling callback is inserted above', () => {
    const chart = (extra: string) => `import { useMemo, useState } from 'react'
export function Chart({ ticks, rows }: { ticks: number[]; rows: number[][] }) {
${extra}  const [open] = useState(() => false)
  const bars = useMemo(() => rows.map((row) => row.length), [rows])
  const labels = ticks.map((tick) => String(tick))
  rows.filter((row) => row.length > 0).forEach((row) => row.sort())
  return open ? bars : labels
}
`
    const before = Object.keys(measureTree({ 'utils/chart.ts': chart('') }))
    const after = Object.keys(
      measureTree({
        'utils/chart.ts': chart('  ticks.map((tick) => tick * 2)\n  rows.map((row) => row)\n'),
      })
    )

    expect(after).toEqual(expect.arrayContaining(before))
    expect(before).toEqual([
      'utils/chart.ts',
      'utils/chart.ts#Chart',
      'utils/chart.ts#Chart>bars',
      'utils/chart.ts#Chart>bars>rows.map',
      'utils/chart.ts#Chart>labels',
      'utils/chart.ts#Chart>open',
      'utils/chart.ts#Chart>rows.filter',
      'utils/chart.ts#Chart>rows.filter().forEach',
    ])
  })

  it('names default parameters by their binding and repeated callbacks by an ordinal', () => {
    const source = `export function pick(items: number[], by = (n: number) => n, { order = () => 0 } = {}) {
  items.forEach((n) => by(n))
  items.forEach((n) => order() + n)
  return items
}
`
    const keys = Object.keys(measureTree({ 'utils/pick.ts': source }))

    expect(keys).toEqual([
      'utils/pick.ts',
      'utils/pick.ts#pick',
      'utils/pick.ts#pick>by',
      'utils/pick.ts#pick>items.forEach',
      'utils/pick.ts#pick>items.forEach#2',
      'utils/pick.ts#pick>order',
    ])
  })

  it('keys a destructured initializer callback by its first destructured name', () => {
    const source = `import { useState } from 'react'
export function useToggle() {
  const [a, setA] = useState(() => false)
  return [a, setA] as const
}
`
    const keys = Object.keys(measureTree({ 'hooks/useToggle.ts': source }))

    expect(keys).toEqual([
      'hooks/useToggle.ts',
      'hooks/useToggle.ts#useToggle',
      'hooks/useToggle.ts#useToggle>a',
    ])
  })

  it("keys an anonymous default export by its file's basename", () => {
    const entries = measureTree({
      'components/card/Card.tsx': `import { View } from 'react-native'
export default function () { return <View /> }
`,
      'utils/format.ts': 'export default (value: number) => String(value)\n',
    })

    expect(entries['components/card/Card.tsx#Card']).toHaveProperty('component-lines', 1)
    expect(entries).toHaveProperty(['utils/format.ts#format'])
  })

  it('suffixes a repeated qualified name with ~2', () => {
    const source = `export function build(flag: boolean) {
  if (flag) {
    const toX = () => 1
    return toX()
  }
  const toX = () => 2
  return toX()
}
`
    const keys = Object.keys(measureTree({ 'utils/build.ts': source }))

    expect(keys).toContain('utils/build.ts#build>toX')
    expect(keys).toContain('utils/build.ts#build>toX~2')
  })

  it('measures only shipping files: no stories, tests, fixtures, lab or theme', () => {
    const component = "export function Thing() { return 'thing' }\n"
    const entries = measureTree({
      'components/thing/Thing.tsx': component,
      'components/thing/Thing.stories.tsx': component,
      'components/thing/Thing.test.tsx': component,
      'components/thing/thing-fixture.ts': component,
      'lab/Thing.tsx': component,
      'theme/tokens.ts': component,
    })

    expect(Object.keys(entries)).toEqual([
      'components/thing/Thing.tsx',
      'components/thing/Thing.tsx#Thing',
    ])
    expect(isInScope('components/custom/Workout/velocity-story-kit.tsx')).toBe(false)
    expect(isInScope('hooks/useThing.ts')).toBe(true)
  })

  it('treats a PascalCase function as a component only when it contains JSX', () => {
    const entries = measureTree({
      'components/badge/Badge.tsx': `import { View } from 'react-native'
export function Badge() { return <View /> }
export function FormatValue(value: number) { return String(value) }
export function renderRow() { return <View /> }
`,
    })

    expect(entries['components/badge/Badge.tsx#Badge']).toHaveProperty('component-lines', 1)
    expect(entries['components/badge/Badge.tsx#FormatValue']).not.toHaveProperty('component-lines')
    expect(entries['components/badge/Badge.tsx#renderRow']).not.toHaveProperty('props')
  })

  it('keeps only the metrics above their limit', () => {
    const entries = {
      'a.ts': { 'file-lines': LIMITS['file-lines'] + 1 },
      'a.ts#f': { complexity: LIMITS.complexity, 'function-lines': LIMITS['function-lines'] + 1 },
      'a.ts#g': { complexity: 1 },
    }

    expect(overLimit(entries)).toEqual({
      'a.ts': { 'file-lines': LIMITS['file-lines'] + 1 },
      'a.ts#f': { 'function-lines': LIMITS['function-lines'] + 1 },
    })
  })
})

describe('decomposition detector on the package', () => {
  it(
    'measures every shipping file and counts own props through the real tsconfig',
    { timeout: 60_000 },
    () => {
      const entries = measure(programFor()) as Entries

      expect(entries['components/custom/Workout/VelocityStrip.tsx#VelocityStrip'].props).toBe(21)
    }
  )
})

const describeAll = (entries: Entry[], kind: Kind): string =>
  entries.map((entry) => describeEntry(entry, kind)).join('\n')

describe('decomposition ratchet', () => {
  let comparison: Comparison

  beforeAll(() => {
    comparison = compareToBaseline(measure(programFor()), baseline)
  }, 60_000)

  it('finds no over-limit metric that the baseline does not list', () => {
    expect(comparison.added, describeAll(comparison.added, 'added')).toEqual([])
  })

  it('finds no baselined metric that has grown', () => {
    expect(comparison.grown, describeAll(comparison.grown, 'grown')).toEqual([])
  })

  it('finds no baselined metric that has shrunk or gone', () => {
    expect(comparison.stale, describeAll(comparison.stale, 'stale')).toEqual([])
  })

  it('commits the baseline with keys and metrics sorted', () => {
    const keys = Object.keys(baseline)

    expect(keys).toEqual([...keys].sort())
    for (const metrics of Object.values(baseline)) {
      const names = Object.keys(metrics)
      expect(names).toEqual([...names].sort())
    }
  })
})

const codeLines = (count: number): string =>
  Array.from({ length: count }, (_, i) => `export const v${i} = ${i}\n`).join('')

const propsComponent = (count: number): string => {
  const props = Array.from({ length: count }, (_, i) => `  p${i}?: string`).join('\n')
  return `import { View } from 'react-native'
export interface WideProps {
${props}
}
export function Wide(props: WideProps) { return <View>{String(props)}</View> }
`
}

const LONG_FILE = 'utils/long.ts'
const LONG_BASELINE = { [LONG_FILE]: { 'file-lines': 230 } }

describe('decomposition ratchet on fixtures', { timeout: 30_000 }, () => {
  it('reports a new component over the props limit as added', () => {
    const live = measureTree({ 'components/wide/Wide.tsx': propsComponent(14) })

    const { added } = compareToBaseline(live, {}) as Comparison

    expect(added).toEqual([
      {
        key: 'components/wide/Wide.tsx#Wide',
        metric: 'props',
        value: 14,
        limit: 13,
        baseline: null,
      },
    ])
  })

  it('reports a baselined file one line longer as grown', () => {
    const live = measureTree({ [LONG_FILE]: codeLines(231) })

    const comparison = compareToBaseline(live, LONG_BASELINE) as Comparison

    expect(comparison).toEqual({
      added: [],
      grown: [{ key: LONG_FILE, metric: 'file-lines', value: 231, limit: 225, baseline: 230 }],
      stale: [],
    })
  })

  it('reports a baselined file one line shorter as stale', () => {
    const live = measureTree({ [LONG_FILE]: codeLines(229) })

    const { grown, stale } = compareToBaseline(live, LONG_BASELINE) as Comparison

    expect(grown).toEqual([])
    expect(stale).toEqual([
      { key: LONG_FILE, metric: 'file-lines', value: 229, limit: 225, baseline: 230 },
    ])
  })

  it('reports a baselined file that was deleted as stale', () => {
    const live = measureTree({ 'utils/other.ts': codeLines(1) })

    const { stale } = compareToBaseline(live, LONG_BASELINE) as Comparison

    expect(stale).toEqual([
      { key: LONG_FILE, metric: 'file-lines', value: null, limit: 225, baseline: 230 },
    ])
  })

  it('passes a baselined file whose value is unchanged', () => {
    const live = measureTree({ [LONG_FILE]: codeLines(230) })

    expect(compareToBaseline(live, LONG_BASELINE)).toEqual({ added: [], grown: [], stale: [] })
  })
})

const FIX_TEXT: Record<string, string> = {
  props: 'Group related props into one object prop',
  'component-lines': 'Extract a part component',
  'file-lines': 'Move pure helpers into a sibling `.ts` module',
  complexity: 'Replace branches with a lookup table or early returns',
  'function-lines': 'Split into named helpers.',
}
const REGEN = '`node packages/ui/scripts/update-decomposition-baseline.mjs'

describe('decomposition failure messages', () => {
  it.each(Object.keys(FIX_TEXT))(
    'names key, metric, value, limit, baseline, the %s fix and the command',
    (metric) => {
      const entry = {
        key: 'utils/a.ts#f',
        metric,
        value: 120,
        limit: LIMITS[metric],
        baseline: 110,
      }

      const message = describeEntry(entry, 'grown')

      expect(message).toContain(
        `\`utils/a.ts#f\` ${metric} is 120 (limit ${LIMITS[metric]}, baseline 110).`
      )
      expect(message).toContain(FIX_TEXT[metric])
      expect(message).toContain(`${REGEN} --allow-increase\` and say why in the PR.`)
      expect(message).not.toContain('\n')
    }
  )

  it('marks an added entry as having no baseline', () => {
    const entry = {
      key: 'utils/a.ts',
      metric: 'file-lines',
      value: 230,
      limit: 225,
      baseline: null,
    }

    expect(describeEntry(entry, 'added')).toContain('is 230 (limit 225, baseline none).')
  })

  it('tells a stale entry to lock in the progress with the plain regen command', () => {
    const entry = {
      key: 'utils/a.ts',
      metric: 'file-lines',
      value: null,
      limit: 225,
      baseline: 230,
    }

    expect(describeEntry(entry, 'stale')).toBe(
      `\`utils/a.ts\` file-lines is gone (limit 225, baseline 230). Lock in the progress: run ${REGEN}\`.`
    )
  })
})

describe('decomposition baseline regen', () => {
  const previous = { 'a.ts': { 'file-lines': 230 } }
  const grownLive = { 'a.ts': { 'file-lines': 231 } }
  const addedLive = { 'a.ts': { 'file-lines': 230 }, 'b.ts#f': { complexity: 20 } }

  it('refuses an added or grown entry unless the increase is allowed', () => {
    expect(mergeBaseline(previous, addedLive)).toMatchObject({ ok: false, baseline: previous })
    expect(mergeBaseline(previous, grownLive)).toMatchObject({ ok: false, baseline: previous })
  })

  it('accepts an added or grown entry with allowIncrease', () => {
    expect(mergeBaseline(previous, addedLive, { allowIncrease: true })).toMatchObject({
      ok: true,
      baseline: { 'a.ts': { 'file-lines': 230 }, 'b.ts#f': { complexity: 20 } },
    })
    expect(mergeBaseline(previous, grownLive, { allowIncrease: true })).toMatchObject({
      ok: true,
      baseline: grownLive,
    })
  })

  it('drops shrunk and under-limit metrics and sorts keys and metrics', () => {
    const live = {
      'z.ts#g': { 'function-lines': 120, complexity: 18 },
      'a.ts': { 'file-lines': 200 },
    }

    const before = { ...previous, 'z.ts#g': { complexity: 19, 'function-lines': 120 } }

    const { ok, baseline: merged } = mergeBaseline(before, live)

    expect(ok).toBe(true)
    expect(JSON.stringify(merged)).toBe(
      JSON.stringify({ 'z.ts#g': { complexity: 18, 'function-lines': 120 } })
    )
  })
})
