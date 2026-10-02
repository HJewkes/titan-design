import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const LAB_DIR = path.resolve(__dirname, 'lab')
const SKIPPED_DIRS = new Set(['node_modules'])
const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip)$/i

// The user name `example` is the placeholder the synthetic fixtures use; `~/.claude/projects/`
// is the documented transcript location, not a user's own path.
const NAME = '(?!example[/\\\\])'
const HOME_PATH = new RegExp(
  [
    `/Users/${NAME}[^/\\s'"\`]+/`,
    `/home/${NAME}[^/\\s'"\`]+/`,
    `[A-Za-z]:\\\\Users\\\\(?!example\\\\)[^\\\\\\s'"\`]+\\\\`,
    '~/Library\\b',
    '~/\\.claude(?!/projects\\b)',
  ].join('|')
)

function* textFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      if (!SKIPPED_DIRS.has(name)) yield* textFiles(full)
    } else if (!BINARY_EXT.test(name)) {
      yield full
    }
  }
}

describe('lab sources', () => {
  it('contain no home-directory paths', () => {
    const offenders = [...textFiles(LAB_DIR)].flatMap((file) => {
      const hit = HOME_PATH.exec(readFileSync(file, 'utf8'))
      return hit ? [`${path.relative(LAB_DIR, file)}: ${hit[0]}`] : []
    })
    expect(offenders).toEqual([])
  })

  it.each([
    [`${'/Users'}/jane/work`, true],
    [`${'/home'}/jane/work`, true],
    [`C:${'\\Users'}\\jane\\work`, true],
    ['~/Library/Application Support', true],
    ['~/.claude/settings.json', true],
    [`${'/Users'}/example/work`, false],
    [`${'/home'}/example/work`, false],
    ['~/.claude/projects/-home-example-app', false],
    ['~/projects/app', false],
    ['/usr/local/bin', false],
  ])('pattern classifies %s', (sample, expected) => {
    expect(HOME_PATH.test(sample)).toBe(expected)
  })
})
