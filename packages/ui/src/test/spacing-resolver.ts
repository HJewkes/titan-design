/**
 * Resolve a spacing or sizing class to the pixel value it actually renders
 * (AW-142) — the shared half of the per-component token assertions.
 *
 * `className` never reaches the DOM under this test environment: NativeWind is
 * stubbed and react-native-web drops the prop, so `render(<Pill size="md"/>)`
 * emits `<div class="css-view-175oi2r">` and nothing else. A geometry assertion
 * therefore reads the classes out of the component source and resolves them the
 * way Tailwind does: class to theme key, theme key to custom property, custom
 * property to the value `global.css` declares. A change at any of the three
 * fails the test.
 *
 * Not named `*.test.ts`, so vitest's `include` does not collect it.
 */

import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolveConfig = require('tailwindcss/resolveConfig') as (config: unknown) => any
const theme = resolveConfig(require(path.join(packageRoot, 'tailwind.config.js'))).theme
const css = readFileSync(path.join(packageRoot, 'src/theme/global.css'), 'utf8')

/** Which resolved-theme scale each utility prefix reads. */
const SCALE_FOR_PREFIX: Record<string, string> = {
  p: 'padding',
  px: 'padding',
  py: 'padding',
  pt: 'padding',
  pb: 'padding',
  pl: 'padding',
  pr: 'padding',
  m: 'margin',
  mx: 'margin',
  my: 'margin',
  mt: 'margin',
  mb: 'margin',
  ml: 'margin',
  mr: 'margin',
  gap: 'gap',
  'gap-x': 'gap',
  'gap-y': 'gap',
  h: 'height',
  'min-h': 'minHeight',
  w: 'width',
}

/**
 * `px-squish-x-md` → `'12px'`, `p-4` → `'16px'`. `undefined` when the class is
 * not a spacing utility at all, which is how a caller spots a typo.
 */
export function resolvePx(className: string): string | undefined {
  const [, prefix, key] = className.match(/^(min-h|gap-[xy]|gap|[a-z]{1,2})-(.+)$/) ?? []
  const reference = SCALE_FOR_PREFIX[prefix] && theme[SCALE_FOR_PREFIX[prefix]]?.[key]
  if (typeof reference !== 'string') return undefined
  const varName = reference.match(/^var\((--[a-z0-9-]+)\)$/)?.[1]
  // The numeric scale is literal px in the config; only semantic keys indirect.
  if (!varName) return reference
  return css.match(new RegExp(`^\\s*${varName}:\\s*(.+?);\\s*$`, 'm'))?.[1]
}

/** Every class in the list, resolved. Reads as the geometry the size ships. */
export function resolveAll(classNames: string[]): (string | undefined)[] {
  return classNames.map(resolvePx)
}

/** The source of a file sitting beside the test that calls this. */
export function siblingSource(testFileUrl: string, filename: string): string {
  return readFileSync(path.join(path.dirname(fileURLToPath(testFileUrl)), filename), 'utf8')
}

/**
 * The classes a size map assigns at `<constName>[<level>]`, split on spaces.
 * `field` picks one key out of an object-valued entry (`{ container: '…' }`).
 */
export function sizeClasses(
  source: string,
  constName: string,
  level: string,
  field?: string
): string[] {
  const block = source.match(new RegExp(`const ${constName}[^=]*= \\{([\\s\\S]*?)\\n\\}`))
  if (!block) throw new Error(`no ${constName} in source`)
  // Prettier breaks a long entry across lines; flatten so one pattern covers both.
  const flat = block[1].replace(/\s+/g, ' ')
  const value = flat.match(
    field
      ? new RegExp(`\\b${level}: \\{[^}]*?\\b${field}: '(.+?)'`)
      : new RegExp(`\\b${level}: '(.+?)'`)
  )?.[1]
  if (value === undefined) throw new Error(`no ${field ?? 'string'} value at ${constName}.${level}`)
  return value.split(' ')
}
