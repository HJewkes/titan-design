// Round 0 fixtures for CodeViewer (TD-74). Hand-assembled `SourceExcerpt` values: no code-read
// output was captured. The real ones are slices of titan-design's own public source at commit
// 83122ef6878350d6803123c21410edae5674cb2e
// (verify any of them with `git show 83122ef6:packages/ui/src/<path>`). Windows follow code-read's
// `excerptWindow` arithmetic (5 context lines, 80-line cap), `origin` is 'commit' and `contentHash` is
// the blob's git object id. The findings are illustrative except `tooltipLongFunction`.
// The scale and degenerate fixtures at the bottom are synthetic.

export interface Span {
  startLine: number
  endLine: number
}

/** The consumer-side excerpt shape the viewer's props are adapted from. Not exported by titan. */
export interface SourceExcerpt {
  path: string
  startLine: number
  endLine: number
  text: string
  contentHash: string
  origin: 'commit' | 'worktree' | 'export'
  highlights: Span[]
  truncated: boolean
}

export interface MissingSource {
  excerpt: null
  excerptMissing: 'changed-since-snapshot' | 'not-in-export' | 'no-source'
}

export const FIXTURE_SHA = '83122ef6878350d6803123c21410edae5674cb2e'

/** The real over-100-lines finding: `Tooltip` runs 83 to 253, the 80-line cap clips the window at 157. */
export const tooltipLongFunction: SourceExcerpt = {
  path: 'packages/ui/src/components/ui/tooltip/Tooltip.tsx',
  startLine: 78,
  endLine: 157,
  text: [
    ' * // Rich content tooltip',
    ' * <Tooltip content={<View><Text>Bold tip</Text><Text>with details</Text></View>}>',
    ' *   <Button><ButtonText>Hover me</ButtonText></Button>',
    ' * </Tooltip>',
    ' */',
    'export function Tooltip({',
    '  label,',
    '  content,',
    '  children,',
    "  placement = 'top',",
    '  openDelay = 0,',
    '  closeDelay = 0,',
    '  hasArrow = true,',
    '  isDisabled = false,',
    '  className,',
    '  usePortal: usePortalProp = false,',
    '  isOpen,',
    '  ...props',
    '}: TooltipProps) {',
    '  const [hovered, setHovered] = useState(false)',
    '  const isVisible = isOpen ?? hovered',
    '  const [portalPos, setPortalPos] = useState<PortalPosition | null>(null)',
    '  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)',
    '  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)',
    '  const triggerRef = useRef<View>(null)',
    '',
    "  const isPortalMode = usePortalProp && Platform.OS === 'web' && !!createPortal",
    '',
    '  useEffect(() => {',
    '    if (!isVisible || !isPortalMode || !triggerRef.current) return',
    '    const node = triggerRef.current as unknown as HTMLElement',
    '    const id = requestAnimationFrame(() => {',
    '      const rect = node.getBoundingClientRect()',
    '      const gap = 8',
    "      const cardinal = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right'",
    '',
    '      const positions: Record<string, PortalPosition> = {',
    '        top: {',
    '          top: rect.top - gap,',
    '          left: rect.left + rect.width / 2,',
    "          transform: 'translate(-50%, -100%)',",
    '        },',
    '        bottom: {',
    '          top: rect.bottom + gap,',
    '          left: rect.left + rect.width / 2,',
    "          transform: 'translate(-50%, 0%)',",
    '        },',
    '        left: {',
    '          top: rect.top + rect.height / 2,',
    '          left: rect.left - gap,',
    "          transform: 'translate(-100%, -50%)',",
    '        },',
    '        right: {',
    '          top: rect.top + rect.height / 2,',
    '          left: rect.right + gap,',
    "          transform: 'translate(0%, -50%)',",
    '        },',
    '      }',
    '',
    '      setPortalPos(positions[cardinal] ?? positions.top)',
    '    })',
    '    return () => cancelAnimationFrame(id)',
    '  }, [isVisible, isPortalMode, placement])',
    '',
    '  const clearTimeouts = () => {',
    '    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current)',
    '    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)',
    '  }',
    '',
    '  const show = () => {',
    '    if (isDisabled) return',
    '    clearTimeouts()',
    '    if (openDelay > 0) {',
    '      openTimeoutRef.current = setTimeout(() => setHovered(true), openDelay)',
    '    } else {',
    '      setHovered(true)',
    '    }',
    '  }',
    '',
    '  const hide = () => {',
  ].join('\n'),
  contentHash: 'dc4ec4ce12177c496b5974961a2745ab05d6be36',
  origin: 'commit',
  highlights: [{ startLine: 83, endLine: 157 }],
  truncated: true,
}

/** Illustrative finding: two ranges with a gap between them and a three-digit gutter. */
export const proseTwoRanges: SourceExcerpt = {
  path: 'packages/ui/src/components/custom/Prose/MarkdownProse.tsx',
  startLine: 123,
  endLine: 196,
  text: [
    '      {label}',
    '    </Text>',
    '  )',
    '}',
    '',
    'function renderInline(text: string, linkers: ProseLinker[], tokenizer: RegExp): ReactNode[] {',
    '  const anchoredLinkers = linkers.map((l) => ({ linker: l, test: anchored(l.pattern) }))',
    '  return text',
    '    .split(tokenizer)',
    "    .filter((piece) => piece !== '' && piece !== undefined)",
    '    .map((piece, i) => {',
    '      if (anchored(BOLD).test(piece)) {',
    '        return (',
    '          <Text key={i} className="font-semibold text-text-primary">',
    '            {piece.slice(2, -2)}',
    '          </Text>',
    '        )',
    '      }',
    '      if (anchored(CODE).test(piece)) {',
    '        return (',
    '          <Text key={i} className="font-mono text-text-primary">',
    '            {piece.slice(1, -1)}',
    '          </Text>',
    '        )',
    '      }',
    '      const hit = anchoredLinkers.find((l) => l.test.test(piece))',
    '      if (hit) return <LinkedRef key={i} linker={hit.linker} value={piece} />',
    '      return <Text key={i}>{piece}</Text>',
    '    })',
    '}',
    '',
    'interface BlockProps {',
    '  block: ProseBlock',
    '  inline: (text: string) => ReactNode[]',
    '  size: ProseSize',
    '}',
    '',
    'function Block({ block, inline, size }: BlockProps) {',
    '  const body = BODY_TEXT[size]',
    "  if (block.type === 'h1' || block.type === 'h2') {",
    '    return (',
    "      <Typography variant={block.type === 'h1' ? 'h5' : 'h6'} className=\"mt-1.5 text-text-primary\">",
    '        {block.text}',
    '      </Typography>',
    '    )',
    '  }',
    "  if (block.type === 'h3') {",
    '    return (',
    '      <Typography variant="subtitle2" className="mt-1 font-bold text-text-primary">',
    '        {inline(block.text)}',
    '      </Typography>',
    '    )',
    '  }',
    "  if (block.type === 'li') {",
    '    return (',
    '      <View className="flex-row gap-2 pl-1">',
    "        <Text className={cn(body, 'text-brand-primary')}>•</Text>",
    '        <Typography variant="body2" className={cn(\'flex-1\', body)}>',
    '          {inline(block.text)}',
    '        </Typography>',
    '      </View>',
    '    )',
    '  }',
    '  return (',
    '    <Typography variant="body2" className={body}>',
    '      {inline(block.text)}',
    '    </Typography>',
    '  )',
    '}',
    '',
    '/**',
    ' * MarkdownProse \u2014 renders a small, predictable markdown subset as themed prose',
    ' * and auto-links references the caller describes.',
    ' *',
  ].join('\n'),
  contentHash: 'fa2975800b592cc81793050db4b2b9efb66e8281',
  origin: 'commit',
  highlights: [
    { startLine: 128, endLine: 152 },
    { startLine: 160, endLine: 191 },
  ],
  truncated: false,
}

/** Illustrative finding: a one-line range with `startLine` above 1. */
export const fixedWindowOneLine: SourceExcerpt = {
  path: 'packages/ui/src/utils/fixed-window.ts',
  startLine: 22,
  endLine: 32,
  text: [
    '  padAfter: number',
    '}',
    '',
    'function assertFinite(field: string, value: number): void {',
    '  if (!Number.isFinite(value))',
    '    throw new RangeError(`${field} must be a finite number, got ${value}`)',
    '}',
    '',
    'function assertNonNegativeInteger(field: string, value: number): void {',
    '  assertFinite(field, value)',
    '  if (!Number.isInteger(value) || value < 0) {',
  ].join('\n'),
  contentHash: '02d4beefbb75a17f541604adc72f078aaa63cad3',
  origin: 'commit',
  highlights: [{ startLine: 27, endLine: 27 }],
  truncated: false,
}

/** Illustrative metric finding: no spans, so the window starts at line 1. */
export const fixedWindowWholeFile: SourceExcerpt = {
  path: 'packages/ui/src/utils/fixed-window.ts',
  startLine: 1,
  endLine: 74,
  text: [
    'export interface FixedWindowInput {',
    "  /** Scroll offset of the viewport's leading edge, in the same unit as `itemSize`. */",
    '  offset: number',
    '  /** Viewport extent along the scroll axis. */',
    '  viewport: number',
    '  /** Extent of every item along the scroll axis. */',
    '  itemSize: number',
    '  /** Total number of items. */',
    '  count: number',
    '  /** Extra items to render on each side of the visible range. */',
    '  overscan: number',
    '}',
    '',
    'export interface FixedWindow {',
    '  /** First rendered index, inclusive. */',
    '  start: number',
    '  /** One past the last rendered index, exclusive. */',
    '  end: number',
    '  /** Spacer extent before the first rendered item: `start * itemSize`. */',
    '  padBefore: number',
    '  /** Spacer extent after the last rendered item: `(count - end) * itemSize`. */',
    '  padAfter: number',
    '}',
    '',
    'function assertFinite(field: string, value: number): void {',
    '  if (!Number.isFinite(value))',
    '    throw new RangeError(`${field} must be a finite number, got ${value}`)',
    '}',
    '',
    'function assertNonNegativeInteger(field: string, value: number): void {',
    '  assertFinite(field, value)',
    '  if (!Number.isInteger(value) || value < 0) {',
    '    throw new RangeError(`${field} must be a non-negative integer, got ${value}`)',
    '  }',
    '}',
    '',
    'function validate({ offset, viewport, itemSize, count, overscan }: FixedWindowInput): void {',
    "  assertFinite('offset', offset)",
    "  assertFinite('viewport', viewport)",
    "  assertFinite('itemSize', itemSize)",
    '  if (viewport < 0) throw new RangeError(`viewport must not be negative, got ${viewport}`)',
    '  if (itemSize <= 0) throw new RangeError(`itemSize must be greater than zero, got ${itemSize}`)',
    "  assertNonNegativeInteger('count', count)",
    "  assertNonNegativeInteger('overscan', overscan)",
    '}',
    '',
    'const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max)',
    '',
    '/**',
    ' * Computes which items of a fixed-size list to render for a scroll position.',
    ' *',
    ' * `start` is inclusive and `end` is exclusive, with `0 <= start <= end <= count`. Every item whose',
    ' * range `[i * itemSize, (i + 1) * itemSize)` intersects `[offset, offset + viewport)` lies inside',
    ' * `[start, end)`, and `overscan` adds up to that many extra items on each side, clamped to the list.',
    ' * `padBefore + (end - start) * itemSize + padAfter === count * itemSize`.',
    ' *',
    ' * Edge cases: `count` 0 gives an empty window. A `viewport` of 0 selects no item unless `offset`',
    ' * falls inside one, which it then includes. An `offset` before the list or past its end is clamped,',
    ' * so the window is empty (before overscan) rather than out of bounds. Invalid input throws a',
    ' * `RangeError` naming the field: non-finite numbers, negative `viewport`, `itemSize <= 0`, and a',
    ' * negative or non-integer `count` or `overscan`.',
    ' *',
    ' * Consumers: the TD-31 code viewer, the TD-32 tree view and the TD-33 virtualised table, and the',
    ' * TD-35 dependency matrix, which calls it once per axis.',
    ' */',
    'export function computeWindow(input: FixedWindowInput): FixedWindow {',
    '  validate(input)',
    '  const { offset, viewport, itemSize, count, overscan } = input',
    '  const firstVisible = clamp(Math.floor(offset / itemSize), count)',
    '  const endVisible = Math.max(firstVisible, clamp(Math.ceil((offset + viewport) / itemSize), count))',
    '  const start = Math.max(0, firstVisible - overscan)',
    '  const end = Math.min(count, endVisible + overscan)',
    '  return { start, end, padBefore: start * itemSize, padAfter: (count - end) * itemSize }',
    '}',
  ].join('\n'),
  contentHash: '02d4beefbb75a17f541604adc72f078aaa63cad3',
  origin: 'commit',
  highlights: [],
  truncated: false,
}

/** Gutter width grows from two to three digits at line 100. */
export const gutterGrowth: SourceExcerpt = {
  path: 'packages/ui/src/components/ui/tooltip/Tooltip.tsx',
  startLine: 95,
  endLine: 106,
  text: [
    '  ...props',
    '}: TooltipProps) {',
    '  const [hovered, setHovered] = useState(false)',
    '  const isVisible = isOpen ?? hovered',
    '  const [portalPos, setPortalPos] = useState<PortalPosition | null>(null)',
    '  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)',
    '  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)',
    '  const triggerRef = useRef<View>(null)',
    '',
    "  const isPortalMode = usePortalProp && Platform.OS === 'web' && !!createPortal",
    '',
    '  useEffect(() => {',
  ].join('\n'),
  contentHash: 'dc4ec4ce12177c496b5974961a2745ab05d6be36',
  origin: 'commit',
  highlights: [],
  truncated: false,
}

/** Line 17 is 1,480 characters: horizontal scroll and `wrap`. */
export const longLineReal: SourceExcerpt = {
  path: 'packages/ui/src/components/custom/ActiveWork/initiative-fixture.ts',
  startLine: 12,
  endLine: 22,
  text: [
    "  title: 'alpha-workspace \u2014 sample project planner',",
    "  state: 'focused',",
    '  rank: 1,',
    "  shipTarget: '2026-Q3',",
    "  updated: '2026-07-12',",
    '  body: "# alpha-workspace \u2014 sample project planner\\n\\n## Purpose\\n\\nProjects span weeks; a single sitting doesn\'t. Every handoff between sittings, laptops or helpers loses context unless something durable holds it. `planner` is that something: plain files per project (brief, handoff, tasks, sessions, notes) under `/home/example/.local/share/planner/<slug>/`, read and written through one small CLI.\\n\\n## First version\\n\\n- **Storage:** one folder per project, markdown with front matter. No database.\\n- **CLI:** `planner open`, `planner task add`, `planner note add`, `planner wrap`.\\n- **Helper:** a small background process that watches the folders and feeds the web view.\\n- **Web view:** read-only, served on `localhost:4100`.\\n\\n## Decisions\\n\\n- Plain files over a database, so any editor can fix a broken record.\\n- Task ids are per project (`AW-1`, `AW-2`, ...) and never reused.\\n- The CLI is the only writer; the web view reads.\\n\\n## Left for later\\n\\n- Import from calendars, email and notes apps (**AW-6**).\\n- Editing in the web view (**AW-7**).\\n- Sync between laptops; plain git works for now.\\n\\n## People\\n\\n- Owner: @example-owner (sample account).\\n- Early users: two sample testers on the `planner-beta` list.\\n\\n## Questions\\n\\n- How large can one project\'s task file grow before the web view slows down?\\n- Should done tasks archive automatically, and after how many days?\\n- Is a background helper worth its install cost on a laptop that sleeps?\\n",',
    '}',
    '',
    'export const INITIATIVE_LOOPS_FIXTURE: OpenLoop[] = [',
    '  {',
    "    ref: '2026-08-27-0930-sample-branch-review#n1',",
  ].join('\n'),
  contentHash: 'cbfdf94d575f6182b2dd4beb81b3973e18ee189e',
  origin: 'commit',
  highlights: [{ startLine: 17, endLine: 17 }],
  truncated: false,
}

/** Em dashes at lines 4, 10 and 12: non-ASCII BMP text. */
export const unicodeReal: SourceExcerpt = {
  path: 'packages/ui/src/components/custom/ActiveWork/format-time.ts',
  startLine: 1,
  endLine: 32,
  text: [
    '/**',
    ' * A compact age label for a dense column: `today`, `4d ago`, `3mo ago`.',
    ' *',
    ' * Deliberately not `DateTime format="relative"` \u2014 that renders Intl prose ("4',
    ' * days ago"), which is too long for a 74px column, and it reads `Date.now()`',
    ' * internally so a story or a visual baseline could never be deterministic. `now`',
    ' * is injected here for exactly that reason.',
    ' */',
    'export function formatTaskAge(iso: string | null | undefined, now: number): string {',
    "  if (!iso) return '\u2014'",
    '  const then = new Date(iso).getTime()',
    "  if (Number.isNaN(then)) return '\u2014'",
    '',
    '  const days = Math.floor((now - then) / 86_400_000)',
    "  if (days <= 0) return 'today'",
    "  if (days === 1) return '1d ago'",
    '  if (days < 30) return `${days}d ago`',
    '  return `${Math.floor(days / 30)}mo ago`',
    '}',
    '',
    '/**',
    " * A session's wall-clock length as `1h 4m` or `42m`. Empty when the span is",
    ' * missing, unparseable or not positive, so callers can drop the separator',
    ' * rather than render `0m`.',
    ' */',
    'export function formatSessionDuration(started: string, ended: string): string {',
    '  const ms = new Date(ended).getTime() - new Date(started).getTime()',
    "  if (!(ms > 0)) return ''",
    '  const minutes = Math.round(ms / 60_000)',
    '  const hours = Math.floor(minutes / 60)',
    '  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`',
    '}',
  ].join('\n'),
  contentHash: '90e6b2f1b08b0232317febbbb28aedd2310b9606',
  origin: 'commit',
  highlights: [],
  truncated: false,
}

const repeatLines = (text: string, count: number): string => {
  const lines = text.split('\n')
  return Array.from({ length: count }, (_, i) => lines[i % lines.length]).join('\n')
}

const synthetic = (
  name: string,
  text: string,
  overrides: Partial<SourceExcerpt> = {}
): SourceExcerpt => {
  const startLine = overrides.startLine ?? 1
  return {
    path: `synthetic/${name}`,
    startLine,
    endLine: startLine + text.replace(/(\r\n|\r|\n)$/, '').split(/\r\n|\r|\n/).length - 1,
    text,
    contentHash: 'synthetic',
    origin: 'commit',
    highlights: [],
    truncated: false,
    ...overrides,
  }
}

const range = (startLine: number, endLine: number): Span => ({ startLine, endLine })
const numbered = (count: number): string =>
  Array.from({ length: count }, (_, i) => `line ${i + 1}`).join('\n')

/** Synthetic: the 80-line Tooltip window repeated to 5,000 lines. `focusLine` 4,990 is the scale target. */
export const scale5k = synthetic('scale5k', repeatLines(tooltipLongFunction.text, 5000), {
  highlights: [range(10, 10), range(2500, 2500), range(4990, 4990)],
})

/** Synthetic: the same text repeated to 10,000 lines, for the five-digit gutter. */
export const scale10k = synthetic('scale10k', repeatLines(tooltipLongFunction.text, 10000), {
  highlights: [range(10, 10), range(5000, 5000), range(9990, 9990)],
})

export const empty = synthetic('empty', '')
export const oneLine = synthetic('oneLine', 'export {}')
export const trailingNewline = synthetic('trailingNewline', 'a\nb\n', { endLine: 2 })
export const crlf = synthetic('crlf', 'a\r\nb\r\n', { endLine: 2 })
export const loneCr = synthetic('loneCr', 'a\rb')
export const tabs = synthetic('tabs', '\tindented\n\t\ttwice\nmid\tline')
export const wideChars = synthetic(
  'wideChars',
  [
    '\u4f60\u597d\uff0c\u4e16\u754c',
    '\u{1f600} \u{1f680}',
    '\u{1f468}\u200d\u{1f469}\u200d\u{1f467}',
    'e\u0301',
    '\u05e9\u05dc\u05d5\u05dd',
  ].join('\n')
)
export const line2000 = synthetic('line2000', 'x'.repeat(2000))
export const line10000 = synthetic('line10000', 'x'.repeat(10000))

const twenty = numbered(20)
export const rangePastEof = synthetic('rangePastEof', twenty, { highlights: [range(18, 40)] })
export const rangeOutside = synthetic('rangeOutside', twenty, { highlights: [range(50, 60)] })
export const invertedRange = synthetic('invertedRange', twenty, { highlights: [range(12, 8)] })
export const overlappingRanges = synthetic('overlappingRanges', numbered(30), {
  highlights: [range(3, 8), range(6, 12)],
})
export const nestedRanges = synthetic('nestedRanges', twenty, {
  highlights: [range(2, 20), range(5, 6)],
})
export const allLinesHighlighted = synthetic('allLinesHighlighted', twenty, {
  highlights: [range(1, 20)],
})
export const endLineMismatch = synthetic('endLineMismatch', numbered(25), { endLine: 30 })
export const bigStartLine = synthetic('bigStartLine', numbered(10), { startLine: 99996 })
export const badNumbers = synthetic('badNumbers', numbered(5), {
  startLine: 0,
  highlights: [range(1.5, Number.NaN)],
})

/** Consumer-level values for the composition story: each renders `emptyState`. */
export const missingSource: MissingSource[] = [
  { excerpt: null, excerptMissing: 'changed-since-snapshot' },
  { excerpt: null, excerptMissing: 'not-in-export' },
  { excerpt: null, excerptMissing: 'no-source' },
]

export const realFixtures = {
  tooltipLongFunction,
  proseTwoRanges,
  fixedWindowOneLine,
  fixedWindowWholeFile,
  gutterGrowth,
  longLineReal,
  unicodeReal,
}

export const syntheticFixtures = {
  scale5k,
  scale10k,
  empty,
  oneLine,
  trailingNewline,
  crlf,
  loneCr,
  tabs,
  wideChars,
  line2000,
  line10000,
  rangePastEof,
  rangeOutside,
  invertedRange,
  overlappingRanges,
  nestedRanges,
  allLinesHighlighted,
  endLineMismatch,
  bigStartLine,
  badNumbers,
}
