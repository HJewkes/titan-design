import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const VISUAL_DIR = path.dirname(fileURLToPath(import.meta.url))

// Every file under visual/ that carries authored data or fixtures registers here.
const REGISTERED = [
  'router/types.ts',
  'router/patterns.ts',
  'router/catalogue.ts',
  'router/route.ts',
  'router/route.test.ts',
]

// Reserved example domains are the only email hosts synthetic fixtures may use.
const EMAIL = /[\w.+-]+@(?!example\.(?:com|org|net)\b)[\w-]+(?:\.[\w-]+)+/i
const HOME_PATH = /\/(?:Users|home)\/|[A-Za-z]:\\/i
const DENYLIST = ['jewkes']

function leaks(text: string): string[] {
  const lower = text.toLowerCase()
  return [
    ...(HOME_PATH.test(text) ? ['home path'] : []),
    ...(EMAIL.test(text) ? ['email'] : []),
    ...DENYLIST.filter((name) => lower.includes(name)).map(() => 'denylisted name'),
  ]
}

describe('visual fixtures hygiene', () => {
  it.each(REGISTERED.map((file) => [file]))('%s carries no real paths, emails or names', (file) => {
    const full = path.join(VISUAL_DIR, file)

    expect(existsSync(full)).toBe(true)
    // Kinds only: printing the match would copy the leak into test output.
    expect(leaks(readFileSync(full, 'utf8'))).toEqual([])
  })

  const U = '/Users'
  const H = '/home'
  it.each([
    ['posix users path', `${U}/someone/work`, 'home path'],
    ['posix home path', `${H}/someone/work`, 'home path'],
    ['windows path', `C:${'\\'}Users${'\\'}someone`, 'home path'],
    ['email', `someone${'@'}corp.test`, 'email'],
    ['denylisted name', `by ${DENYLIST[0].toUpperCase()}`, 'denylisted name'],
  ])('flags a %s', (_kind, sample, expected) => {
    expect(leaks(sample)).toEqual([expected])
  })

  it.each([
    ['example.com email', `ops${'@'}example.com`],
    ['team name', 'Team North owns Service A'],
    ['relative path', 'packages/ui/src/visual'],
  ])('allows a %s', (_kind, sample) => {
    expect(leaks(sample)).toEqual([])
  })
})
