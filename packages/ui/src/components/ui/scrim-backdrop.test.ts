import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(here, '../../..')
// postcss is tailwindcss's own dependency, so resolve it from there
const postcss = createRequire(require.resolve('tailwindcss'))('postcss')
const tailwindConfig = require(path.join(packageRoot, 'tailwind.config.js'))

const BACKDROP_SOURCES = ['drawer/Drawer.tsx', 'modal/Modal.tsx']

function scrimClassesIn(file: string): string[] {
  const source = readFileSync(path.join(here, file), 'utf8')
  const literals = source.match(/'[^'\n]*\bbg-scrim[^'\n]*'|"[^"\n]*\bbg-scrim[^"\n]*"/g) ?? []
  return literals.flatMap((literal) => literal.slice(1, -1).split(/\s+/))
}

async function compile(classes: string[]): Promise<string> {
  const config = { ...tailwindConfig, content: [{ raw: classes.join(' ') }] }
  const result = await postcss([require('tailwindcss')(config)]).process('@tailwind utilities;', {
    from: undefined,
  })
  return result.css
}

describe('scrim backdrop classes', () => {
  it.each(BACKDROP_SOURCES)('%s backdrop classes each emit a CSS rule', async (file) => {
    const classes = scrimClassesIn(file)
    expect(classes.length).toBeGreaterThan(0)

    const css = await compile(classes)

    const dead = classes.filter((cls) => !css.includes(`.${cls.replace(/:/g, '\\:')}`))
    expect(dead).toEqual([])
  })
})
