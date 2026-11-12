import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { captureStories, serve, WIDTHS } from './pr-visual-capture.mjs'
import { storiesFor } from './pr-visual-stories.mjs'

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(readFileSync(join(UI_ROOT, 'src/arch/component-catalog.json'), 'utf8'))

describe('pr-visual capture inputs (TP-1697)', () => {
  it('maps a real component change to its catalog stories', () => {
    const selection = storiesFor(
      ['packages/ui/src/components/custom/ActiveWork/CoChangeChip.tsx'],
      catalog
    )
    const chip = catalog.entries.find((entry) => entry.name === 'CoChangeChip')
    expect(selection.broad).toBeUndefined()
    expect(selection.storyIds).toEqual(expect.arrayContaining(chip.storyIds))
  })

  it('captures at the review widths playwright.config.ts uses', () => {
    const config = readFileSync(join(UI_ROOT, 'playwright.config.ts'), 'utf8')
    for (const { width, height } of WIDTHS)
      expect(config).toContain(`viewport: { width: ${width}, height: ${height} }`)
  })
})

describe('pr-visual capture failures (TP-4774)', () => {
  it('keeps going after a story throws and shoots the others', async () => {
    const shot = []
    await captureStories({
      storyIds: ['a--one', 'b--two'],
      outDir: 'out',
      has: () => true,
      shootOne: async (id, _viewport, file) => {
        if (id === 'a--one') throw new Error('boom')
        shot.push(file)
      },
    })
    expect(shot).toHaveLength(WIDTHS.length)
    expect(shot.every((file) => file.includes('b--two'))).toBe(true)
  })
})

describe('pr-visual static server (TP-1697)', () => {
  let server
  let origin
  beforeAll(async () => {
    const root = mkdtempSync(join(tmpdir(), 'pr-visual-'))
    mkdirSync(join(root, 'assets'))
    writeFileSync(join(root, 'iframe.html'), '<html></html>')
    writeFileSync(join(root, 'assets', 'app.js'), 'export {}')
    server = await serve(root)
    origin = `http://127.0.0.1:${server.address().port}`
  })
  afterAll(() => server.close())

  it('serves a build file with its content type, off port 6006', async () => {
    const response = await fetch(`${origin}/assets/app.js`)
    expect(server.address().port).not.toBe(6006)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/javascript')
  })

  it('answers 404 for a missing file and a path outside the build', async () => {
    expect((await fetch(`${origin}/missing.js`)).status).toBe(404)
    expect((await fetch(`${origin}/..%2f..%2fetc%2fpasswd`)).status).toBe(404)
  })
})
