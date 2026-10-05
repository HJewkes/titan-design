import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const { loadBaseline, baselineKey, srcRootOf, isAtModuleScope } = createRequire(import.meta.url)(
  '../../eslint-rules/ratchet'
)

describe('ratchet loadBaseline', () => {
  let dir: string
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'))
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('reads a baseline beside the rule', () => {
    fs.writeFileSync(path.join(dir, 'ok-baseline.json'), '{"a.ts":{"x":1}}')
    expect(loadBaseline('ok-baseline.json', dir)).toEqual({ 'a.ts': { x: 1 } })
  })

  it('returns an empty baseline when the file is missing', () => {
    expect(loadBaseline('missing-baseline.json', dir)).toEqual({})
  })

  it('throws with the baseline filename when the JSON is malformed', () => {
    fs.writeFileSync(path.join(dir, 'broken-baseline.json'), '{"a.ts": ')
    expect(() => loadBaseline('broken-baseline.json', dir)).toThrow(/broken-baseline\.json/)
  })
})

describe('ratchet srcRootOf', () => {
  const at = (filename: string) => ({ filename, cwd: '/fallback' })

  it('takes the last /src/ segment', () => {
    expect(srcRootOf(at('/work/src/repo/packages/ui/src/components/ui/A.tsx'))).toBe(
      '/work/src/repo/packages/ui/src'
    )
  })

  it('falls back to the cwd outside any src directory', () => {
    expect(srcRootOf(at('/repo/scripts/a.mjs'))).toBe('/fallback')
  })
})

describe('ratchet baselineKey', () => {
  it('is the cwd-relative POSIX path', () => {
    const context = { cwd: '/repo/packages/ui', filename: '/repo/packages/ui/src/a/B.tsx' }
    expect(baselineKey(context)).toBe('src/a/B.tsx')
  })
})

describe('ratchet isAtModuleScope', () => {
  it('is false under a function and true otherwise', () => {
    const program = { type: 'Program' }
    const fn = { type: 'ArrowFunctionExpression', parent: program }
    expect(isAtModuleScope({ type: 'CallExpression', parent: program })).toBe(true)
    expect(isAtModuleScope({ type: 'CallExpression', parent: fn })).toBe(false)
  })
})
