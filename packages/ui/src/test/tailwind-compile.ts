import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
export const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

// postcss is a declared dependency of tailwindcss, not of this package; resolve
// it from there rather than relying on hoisting.
const tailwindEntry = require.resolve('tailwindcss', { paths: [uiRoot] })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tailwind = require(tailwindEntry) as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postcss = createRequire(tailwindEntry)('postcss') as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tailwindConfig = require(path.join(uiRoot, 'tailwind.config.js')) as any

/** The subset of `classes` the real `tailwind.config.js` emits a CSS rule for. */
export async function compileClasses(classes: string[]): Promise<Set<string>> {
  const raw = `<div class="${classes.join(' ')}"></div>`
  const result = await postcss([
    tailwind({ ...tailwindConfig, content: { files: [{ raw, extension: 'html' }] } }),
  ]).process('@tailwind utilities;', { from: undefined })

  return new Set(
    [...(result.css as string).matchAll(/^\.([^\s{]+)\s*\{/gm)].map((m) => m[1].replace(/\\/g, ''))
  )
}
