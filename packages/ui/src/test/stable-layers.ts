/**
 * MATURITY.md clause 5 (TD-26 S6): a stable `ui/` component has every applicable test layer, or
 * its story meta declares `parameters.layers.<layer> = 'n/a: <reason>'`.
 *
 * Every check is a static read of the component's own directory, so no Storybook boots.
 * `stable-layers-baseline.json` maps a component directory to the layers it lacks today; it may
 * only shrink, the same ratchet as the stories-axe baseline.
 */

export const LAYERS = ['logic', 'keyboard', 'axe', 'visual', 'types', 'scale'] as const
export type Layer = (typeof LAYERS)[number]

/** A directory under `src/components/ui/`, its top-level file names mapped to their source. */
export interface ComponentDir {
  name: string
  files: Record<string, string>
}

export type StableLayersBaseline = Record<string, string[]>

export const STABLE_BASELINE_FILE = 'packages/ui/src/test/stable-layers-baseline.json'

const STABLE_TAG = /tags:\s*\[[^\]]*['"]status:stable['"]/
const PLAY_TAG = /tags:\s*\[[^\]]*['"]play['"]/
const PLAY_FUNCTION = /\bplay\s*:/
const PROPERTY_IMPORT = /from\s+['"]fast-check['"]|\bfcAssert\b/
const TAKES_FOCUS = /\b(Pressable|TextInput|focusable|tabIndex)\b/
const GENERIC_EXPORT = /export\s+(function\s+\w+\s*<|const\s+\w+\s*=\s*<[A-Z])/
const WINDOWS = /\b(FlatList|SectionList|VirtualizedList)\b|fixed-window/
const LAYERS_PARAMETER = /layers:\s*\{([^}]*)\}/
const DECLARATION = /(\w+)\s*:\s*(['"`])(.*?)\2/g
const NOT_APPLICABLE = /^n\/a: \S/

const isStory = (file: string) => file.endsWith('.stories.tsx')
const isTest = (file: string) => /\.test\.tsx?$/.test(file)
const isSource = (file: string) =>
  /\.tsx?$/.test(file) && !isStory(file) && !isTest(file) && !file.endsWith('.test-d.ts')

function sources(dir: ComponentDir, keep: (file: string) => boolean): string[] {
  return Object.entries(dir.files)
    .filter(([file]) => keep(file))
    .map(([, source]) => source)
}

export function isStable(dir: ComponentDir): boolean {
  return sources(dir, isStory).some((source) => STABLE_TAG.test(source))
}

function storyIdPrefixes(dir: ComponentDir): string[] {
  return sources(dir, isStory).flatMap((source) => {
    const title = /title:\s*['"]([^'"]+)['"]/.exec(source)?.[1]
    if (!title) return []
    return [
      `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}--`,
    ]
  })
}

function hasAxe(dir: ComponentDir, axeBaseline: Record<string, string[]>): boolean {
  const prefixes = storyIdPrefixes(dir)
  return !Object.keys(axeBaseline).some((id) => prefixes.some((prefix) => id.startsWith(prefix)))
}

interface LayerRule {
  applies: (dir: ComponentDir) => boolean
  present: (dir: ComponentDir, axeBaseline: Record<string, string[]>) => boolean
}

const any = (dir: ComponentDir, keep: (file: string) => boolean, pattern: RegExp) =>
  sources(dir, keep).some((source) => pattern.test(source))

// `visual` is absent until TD-46's manifest lands on main; clause 5 reads it as n/a until then.
const RULES: Partial<Record<Layer, LayerRule>> = {
  logic: {
    applies: () => true,
    present: (dir) => any(dir, (file) => file.endsWith('.test.ts'), PROPERTY_IMPORT),
  },
  keyboard: {
    applies: (dir) => any(dir, isSource, TAKES_FOCUS),
    present: (dir) =>
      sources(dir, isStory).some((source) => PLAY_TAG.test(source) && PLAY_FUNCTION.test(source)),
  },
  axe: { applies: () => true, present: hasAxe },
  types: {
    applies: (dir) => any(dir, isSource, GENERIC_EXPORT),
    present: (dir) => Object.keys(dir.files).some((file) => file.endsWith('.test-d.ts')),
  },
  scale: {
    applies: (dir) => any(dir, isSource, WINDOWS),
    present: (dir) => any(dir, isTest, /\bexpectBoundedMount\b/),
  },
}

function declarations(dir: ComponentDir): [string, string][] {
  return sources(dir, isStory).flatMap((source) => {
    const body = LAYERS_PARAMETER.exec(source)?.[1] ?? ''
    return [...body.matchAll(DECLARATION)].map((match): [string, string] => [match[1], match[3]])
  })
}

function declaredNotApplicable(dir: ComponentDir): Set<string> {
  const valid = declarations(dir).filter(([, value]) => NOT_APPLICABLE.test(value))
  return new Set(valid.map(([layer]) => layer))
}

/** Applicable layers the directory neither has nor validly declares n/a, in `LAYERS` order. */
export function missingLayers(dir: ComponentDir, axeBaseline: Record<string, string[]>): Layer[] {
  const exempt = declaredNotApplicable(dir)
  return LAYERS.filter((layer) => {
    const rule = RULES[layer]
    if (!rule || exempt.has(layer) || !rule.applies(dir)) return false
    return !rule.present(dir, axeBaseline)
  })
}

/** A `parameters.layers` entry that names no layer or gives no reason. */
export function declarationProblems(dir: ComponentDir): string[] {
  return declarations(dir).flatMap(([layer, value]) => {
    if (!(LAYERS as readonly string[]).includes(layer)) {
      return [`${dir.name} declares layers.${layer}, which is not a layer (${LAYERS.join(', ')}).`]
    }
    if (NOT_APPLICABLE.test(value)) return []
    return [`${dir.name} declares layers.${layer} = '${value}'; it needs 'n/a: <reason>'.`]
  })
}

export function stableBaselineProblems(
  name: string,
  missing: string[],
  baselined: string[] = []
): string[] {
  const added = missing.filter((layer) => !baselined.includes(layer))
  const stale = baselined.filter((layer) => !missing.includes(layer))
  const problems: string[] = []
  if (added.length > 0) {
    problems.push(
      `${name} lacks layer(s) ${added.join(', ')}, which ${STABLE_BASELINE_FILE} does not list. ` +
        "Add the layer or declare it 'n/a: <reason>' in the story's parameters.layers; " +
        'the baseline may only shrink.'
    )
  }
  if (stale.length > 0) {
    problems.push(
      `${name} now has layer(s) ${stale.join(', ')}. Remove them from ${STABLE_BASELINE_FILE}, ` +
        'and delete the entry once its list is empty.'
    )
  }
  return problems
}
