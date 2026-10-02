import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC_DIR = path.dirname(fileURLToPath(import.meta.url))
const SCANNED_DIRS = [
  path.join(SRC_DIR, 'lab'),
  path.join(SRC_DIR, '..', '.storybook', 'lab-archive'),
]
const SKIPPED_DIRS = new Set(['node_modules', '.private-out'])
const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip)$/i

// `example` is the only user name the synthetic fixtures may carry, in every form.
const NAME = String.raw`(?!example\b)[^/\\\s'"\x60]+`
const ENCODED_NAME = String.raw`(?!example-)[^-\s/'"\x60]+`
const HOME_PATH = new RegExp(
  [
    String.raw`/(?:Users|home)/${NAME}`,
    String.raw`-(?:Users|home)-${ENCODED_NAME}-`,
    String.raw`[A-Za-z]:\\{1,4}Users\\{1,4}${NAME}`,
    String.raw`~/Library\b`,
    String.raw`~/\.claude(?!/projects/-(?:home|Users)-example-)`,
  ].join('|'),
  'i'
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
    const offenders = SCANNED_DIRS.filter(existsSync).flatMap((dir) =>
      [...textFiles(dir)].flatMap((file) =>
        HOME_PATH.test(readFileSync(file, 'utf8')) ? [path.relative(SRC_DIR, file)] : []
      )
    )
    // File names only: printing the match would copy a real path into test output.
    expect(offenders).toEqual([])
  })

  const U = '/Users'
  const H = '/home'
  it.each([
    ['posix home', `${H}/jane/work`],
    ['posix users', `${U}/jane/work`],
    ['no trailing slash', `cd ${U}/jane`],
    ['lowercase users', `${U.toLowerCase()}/jane/work`],
    ['windows', `C:${'\\Users'}\\jane\\work`],
    ['JSON-escaped windows', `C:${'\\\\Users'}\\\\jane\\\\work`],
    ['encoded users dir', `-${U.slice(1)}-jane-work`],
    ['encoded home dir', `-${H.slice(1)}-jane-work`],
    ['encoded under .claude', `~/.claude/projects/-${U.slice(1)}-jane-work`],
    ['library', '~/Library/Application Support'],
    ['claude config', '~/.claude/settings.json'],
  ])('flags %s', (_form, sample) => {
    expect(HOME_PATH.test(sample)).toBe(true)
  })

  it.each([
    ['posix home', `${H}/example/work`],
    ['posix users', `${U}/example/work`],
    ['no trailing slash', `cd ${U}/example`],
    ['windows', `C:${'\\Users'}\\example\\work`],
    ['JSON-escaped windows', `C:${'\\\\Users'}\\\\example\\\\work`],
    ['encoded home dir', `-${H.slice(1)}-example-work`],
    ['encoded under .claude', `~/.claude/projects/-${H.slice(1)}-example-work`],
    ['unrelated path', '~/projects/app'],
    ['system path', '/usr/local/bin'],
  ])('allows the placeholder: %s', (_form, sample) => {
    expect(HOME_PATH.test(sample)).toBe(false)
  })

  it('does not treat a longer name as the placeholder', () => {
    expect(HOME_PATH.test(`${H}/examples/work`)).toBe(true)
  })
})
