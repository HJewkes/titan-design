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
  it('has the nine TypeScript subpaths as object entries', () => {
    expect(objectEntries.map(([subpath]) => subpath)).toEqual([
      '.',
      './bodymap',
      './pages',
      './workout',
      './motion',
      './diagram',
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

  it('resolves resolveMapState through the ./diagram subpath', async () => {
    const entry = await import('@titan-design/react-ui/diagram')
    expect(entry.resolveMapState).toBeTypeOf('function')
  })
})

// Video-only names export from /motion alone (TD-893); the root keeps its budget.
describe('video-only exports', () => {
  const MOTION_ONLY_VALUES = ['EvidenceChip', 'elideSource', 'ChipBand']

  it.each(MOTION_ONLY_VALUES)('%s comes from the motion entry', async (name) => {
    const motion: Record<string, unknown> = await import('./motion')
    expect(motion[name]).toBeDefined()
  })

  it.each(MOTION_ONLY_VALUES)('%s is absent from the root entry', async (name) => {
    const root: Record<string, unknown> = await import('./index')
    expect(root).not.toHaveProperty(name)
  })
})
