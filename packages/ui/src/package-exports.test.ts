import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Export-map shape (TD-40). A flat `types` next to `import` makes TypeScript
 * read the CJS `.d.ts` for ESM consumers under node16 (attw FalseCJS), so each
 * condition carries its own declaration file.
 */

type Target = { types?: string; default?: string }
type ExportEntry = string | Record<string, string | Target>

const pkgPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
  exports: Record<string, ExportEntry>
}

const objectEntries = Object.entries(pkg.exports).filter(
  (entry): entry is [string, Record<string, string | Target>] => typeof entry[1] === 'object'
)

describe('package.json exports', () => {
  it('has the six TypeScript subpaths as object entries', () => {
    expect(objectEntries.map(([subpath]) => subpath)).toEqual([
      '.',
      './bodymap',
      './pages',
      './theme',
      './theme/tokens',
      './theme/tokens-css',
    ])
  })

  it.each(objectEntries)('%s pairs .d.mts with .mjs under import', (_subpath, entry) => {
    const target = entry.import as Target
    expect(target.types).toMatch(/\.d\.mts$/)
    expect(target.default).toMatch(/\.mjs$/)
  })

  it.each(objectEntries)('%s pairs .d.ts with .js under require', (_subpath, entry) => {
    const target = entry.require as Target
    expect(target.types).toMatch(/(?<!\.d\.m)\.d\.ts$/)
    expect(target.default).toMatch(/\.js$/)
  })

  it.each(objectEntries)('%s has no flat types condition', (_subpath, entry) => {
    expect(entry).not.toHaveProperty('types')
  })

  it.each(objectEntries)('%s lists react-native first when present', (_subpath, entry) => {
    const keys = Object.keys(entry)
    if (keys.includes('react-native')) expect(keys[0]).toBe('react-native')
  })
})
