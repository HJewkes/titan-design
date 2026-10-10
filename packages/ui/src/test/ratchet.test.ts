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

describe('ratchet adoption', () => {
  const rulesDir = path.resolve(import.meta.dirname, '../../eslint-rules')
  const sources = fs
    .readdirSync(rulesDir)
    .filter((name) => name.endsWith('.js') && name !== 'ratchet.js')
    .map((name) => ({ name, text: fs.readFileSync(path.join(rulesDir, name), 'utf8') }))

  it('scans the rule files', () => {
    expect(sources.length).toBeGreaterThan(10)
  })

  it.each(['loadBaseline', 'baselineKey', 'srcRootOf', 'isAtModuleScope'])(
    'no rule outside ratchet.js defines %s',
    (helper) => {
      const definition = new RegExp(`(function\\s+${helper}\\b|(const|let|var)\\s+${helper}\\s*=)`)
      expect(sources.filter(({ text }) => definition.test(text)).map(({ name }) => name)).toEqual(
        []
      )
    }
  )

  it('no rule wraps a require of a baseline file in try/catch', () => {
    const swallowed = /try\s*\{[^}]*require\([^)]*baseline[^)]*\)[^}]*\}\s*catch/
    const readJsonHelper = /function\s+readJson\b/
    expect(
      sources
        .filter(({ text }) => swallowed.test(text) || readJsonHelper.test(text))
        .map(({ name }) => name)
    ).toEqual([])
  })

  it('a moved rule fails the lint run on a malformed baseline', () => {
    const nodeRequire = createRequire(import.meta.url)
    const ratchetPath = nodeRequire.resolve('../../eslint-rules/ratchet')
    const rulePath = nodeRequire.resolve('../../eslint-rules/props-naming')
    const real = fs.readFileSync
    const spy = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementation(((file: string, ...rest: []) =>
        String(file).endsWith('props-naming-baseline.json')
          ? '{"src/a.tsx": '
          : real(file, ...rest)) as typeof fs.readFileSync)
    delete nodeRequire.cache[ratchetPath]
    delete nodeRequire.cache[rulePath]
    try {
      const rule = nodeRequire(rulePath)
      const context = { filename: path.resolve('src/a.tsx'), cwd: process.cwd(), sourceCode: {} }
      expect(() => rule.create(context)).toThrow(/props-naming-baseline\.json/)
    } finally {
      spy.mockRestore()
      delete nodeRequire.cache[ratchetPath]
      delete nodeRequire.cache[rulePath]
    }
  })
})
