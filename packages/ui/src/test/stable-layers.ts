/**
 * MATURITY.md clause 5 (TD-26 S6): a stable `ui/` component has every applicable test layer, or
 * its story meta declares `parameters.layers.<layer> = 'n/a: <reason>'`.
 *
 * Every check is a static read of the component's own directory, so no Storybook boots.
 * `stable-layers-baseline.json` maps a component directory to the layers it lacks today; it may
 * only shrink, the same ratchet as the stories-axe baseline.
 */

import { ratchetProblems } from './ratchet'
import {
  UnreadableMeta,
  hasGenericExport,
  hasPlayFunction,
  metaTags,
  parse,
  readMetaLayers,
  usesAnyName,
} from './story-source'

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
const PROPERTY_IMPORT = /from\s+['"]fast-check['"]|\bfcAssert\b/
const FOCUS_NAMES = ['Pressable', 'TextInput', 'focusable', 'tabIndex']
const WINDOWS = /\b(FlatList|SectionList|VirtualizedList)\b|fixed-window/
const NOT_APPLICABLE = /^n\/a: \S/

const isStory = (file: string) => file.endsWith('.stories.tsx')
const isTest = (file: string) => /\.test\.tsx?$/.test(file)
const isSource = (file: string) =>
  /\.tsx?$/.test(file) && !isStory(file) && !isTest(file) && !file.endsWith('.test-d.ts')

function entries(dir: ComponentDir, keep: (file: string) => boolean): [string, string][] {
  return Object.entries(dir.files).filter(([file]) => keep(file))
}

function sources(dir: ComponentDir, keep: (file: string) => boolean): string[] {
  return entries(dir, keep).map(([, source]) => source)
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

function hasKeyboardStory(dir: ComponentDir): boolean {
  return sources(dir, isStory).some((source) => {
    const file = parse(source)
    return metaTags(file).includes('play') && hasPlayFunction(file)
  })
}

interface LayerRule {
  applies: (dir: ComponentDir) => boolean
  present: (dir: ComponentDir, axeBaseline: Record<string, string[]>) => boolean
}

const any = (dir: ComponentDir, keep: (file: string) => boolean, pattern: RegExp) =>
  sources(dir, keep).some((source) => pattern.test(source))

// `visual` has no rule: `missingLayers` skips a layer without one, so clause 5 never requires it and
// never flags a `visual` n/a declaration as stale. Visual coverage is checked by `visual-coverage.test.ts`.
const RULES: Partial<Record<Layer, LayerRule>> = {
  logic: {
    applies: () => true,
    present: (dir) => any(dir, (file) => file.endsWith('.test.ts'), PROPERTY_IMPORT),
  },
  keyboard: {
    applies: (dir) =>
      sources(dir, isSource).some((source) => usesAnyName(parse(source), FOCUS_NAMES)),
    present: hasKeyboardStory,
  },
  axe: { applies: () => true, present: hasAxe },
  types: {
    applies: (dir) => sources(dir, isSource).some((source) => hasGenericExport(parse(source))),
    present: (dir) => Object.keys(dir.files).some((file) => file.endsWith('.test-d.ts')),
  },
  scale: {
    applies: (dir) => any(dir, isSource, WINDOWS),
    present: (dir) => any(dir, isTest, /\bexpectBoundedMount\b/),
  },
}

interface Declarations {
  declared: [string, string][]
  unreadable: string[]
}

function readDeclarations(dir: ComponentDir): Declarations {
  const result: Declarations = { declared: [], unreadable: [] }
  for (const [file, source] of entries(dir, isStory)) {
    try {
      result.declared.push(...readMetaLayers(parse(source)))
    } catch (error) {
      if (!(error instanceof UnreadableMeta)) throw error
      result.unreadable.push(
        `${dir.name}/${file}: cannot read the meta's parameters.layers (${error.message}). ` +
          "Write it as an object literal of string entries, layer: 'n/a: <reason>'."
      )
    }
  }
  return result
}

function declaredNotApplicable(dir: ComponentDir): Set<string> {
  const valid = readDeclarations(dir).declared.filter(([, value]) => NOT_APPLICABLE.test(value))
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

function declarationProblem(
  dir: ComponentDir,
  [layer, value]: [string, string],
  axeBaseline: Record<string, string[]>
): string[] {
  if (!(LAYERS as readonly string[]).includes(layer)) {
    return [`${dir.name} declares layers.${layer}, which is not a layer (${LAYERS.join(', ')}).`]
  }
  if (!NOT_APPLICABLE.test(value)) {
    return [`${dir.name} declares layers.${layer} = '${value}'; it needs 'n/a: <reason>'.`]
  }
  if (RULES[layer as Layer]?.present(dir, axeBaseline)) {
    return [
      `${dir.name} declares layers.${layer} n/a, but the layer exists. Remove the declaration.`,
    ]
  }
  return []
}

/** A meta it cannot read, or a `parameters.layers` entry that names no layer, gives no reason, or is stale. */
export function declarationProblems(
  dir: ComponentDir,
  axeBaseline: Record<string, string[]>
): string[] {
  const { declared, unreadable } = readDeclarations(dir)
  return [
    ...unreadable,
    ...declared.flatMap((declaration) => declarationProblem(dir, declaration, axeBaseline)),
  ]
}

/** Entries or layers in `current` that `original` (the day-one baseline) did not have. */
export function baselineGrowth(
  current: StableLayersBaseline,
  original: Readonly<StableLayersBaseline>
): string[] {
  return Object.entries(current).flatMap(([name, layers]) => {
    const allowed = original[name]
    if (!allowed) {
      return [
        `${name} is not in the baseline clause 5 started with, and ${STABLE_BASELINE_FILE} may ` +
          "only shrink. Add the missing layers or declare them 'n/a: <reason>'.",
      ]
    }
    const gained = layers.filter((layer) => !allowed.includes(layer))
    if (gained.length === 0) return []
    return [
      `${name} gained layer(s) ${gained.join(', ')} in ${STABLE_BASELINE_FILE}, which may only shrink.`,
    ]
  })
}

export function stableBaselineProblems(
  name: string,
  missing: string[],
  baselined: string[] = []
): string[] {
  return ratchetProblems(missing, baselined, {
    added: (added) =>
      `${name} lacks layer(s) ${added.join(', ')}, which ${STABLE_BASELINE_FILE} does not list. ` +
      "Add the layer or declare it 'n/a: <reason>' in the story's parameters.layers; " +
      'the baseline may only shrink.',
    stale: (stale) =>
      `${name} now has layer(s) ${stale.join(', ')}. Remove them from ${STABLE_BASELINE_FILE}, ` +
      'and delete the entry once its list is empty.',
  })
}
