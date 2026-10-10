import { runInNewContext } from 'node:vm'

/** One theme entry of `tailwind.config.js` whose value reads a custom property. */
export interface ThemeLeaf {
  /** The theme key: `colors`, `spacing`, `height`, `fontFamily`, … */
  key: string
  /** The class stem under that key, `DEFAULT` segments dropped: `hairline`, `inset-md`. */
  stem: string
  /** The custom property the value reads: `--color-hairline-default`. */
  property: string
}

/**
 * The Tailwind v3 utilities that read each theme key, as a regex fragment. A key not listed
 * here is read by any utility. `spacing` feeds every length utility.
 */
const UTILITIES: Record<string, string> = {
  colors:
    'bg|text|border(?:-[xytrblse])?|divide|outline|ring(?:-offset)?|fill|stroke|shadow|accent|caret|placeholder|decoration|from|via|to',
  spacing:
    'p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|w|h|min-w|min-h|max-w|max-h|size|basis|indent|translate-[xy]|scroll-[mp][xytrbl]?',
  width: 'w',
  minWidth: 'min-w',
  maxWidth: 'max-w',
  height: 'h',
  minHeight: 'min-h',
  maxHeight: 'max-h',
  size: 'size',
  fontFamily: 'font',
  fontSize: 'text',
  fontWeight: 'font',
  lineHeight: 'leading',
  letterSpacing: 'tracking',
  boxShadow: 'shadow',
  borderRadius: 'rounded(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?',
  borderWidth: 'border(?:-[xytrblse])?',
  zIndex: 'z',
  opacity: 'opacity',
  transitionDuration: 'duration',
  transitionTimingFunction: 'ease',
  transitionDelay: 'delay',
  animation: 'animate',
}
const ANY_UTILITY = '[a-z]+(?:-[a-z]+)*'

/** The utilities regex fragment for a theme key; `backgroundColor` and the like read colours. */
export const utilitiesFor = (key: string): string =>
  UTILITIES[key] ?? (key.endsWith('Color') ? UTILITIES.colors! : ANY_UTILITY)

const VAR_RE = /var\(\s*(--[\w-]+)/g

type Theme = Record<string, unknown>

/**
 * Loads the config's `module.exports` in a bare context. `require` returns an empty object, so
 * presets and plugins are not loaded; only the theme tables are read.
 */
function loadConfig(source: string): { theme?: Theme & { extend?: Theme } } {
  const module = { exports: {} as Record<string, unknown> }
  const sandbox = { module, exports: module.exports, require: () => ({}) }
  runInNewContext(source, sandbox, { timeout: 5_000, filename: 'tailwind.config.js' })
  return module.exports as { theme?: Theme & { extend?: Theme } }
}

function leafStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(leafStrings)
  return []
}

function collect(key: string, value: unknown, path: string[], out: ThemeLeaf[]): void {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) collect(key, v, [...path, k], out)
    return
  }
  const stem = path.filter((p) => p !== 'DEFAULT').join('-')
  for (const text of leafStrings(value))
    for (const m of text.matchAll(VAR_RE)) out.push({ key, stem, property: m[1]! })
}

/** Every theme and `theme.extend` entry that reads a custom property, as class stems. */
export function themeLeaves(configSource: string): ThemeLeaf[] {
  const theme = loadConfig(configSource).theme ?? {}
  const out: ThemeLeaf[] = []
  const tables: Theme[] = [theme, theme.extend ?? {}]
  for (const table of tables)
    for (const [key, value] of Object.entries(table))
      if (key !== 'extend') collect(key, value, [], out)
  return out
}
