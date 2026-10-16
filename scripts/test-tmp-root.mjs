import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ROOT_ENV = 'TITAN_TEST_TMP_ROOT'

/**
 * One temp root per test run (TD-770). Points TMPDIR at it so every `os.tmpdir()` caller, and
 * Playwright's browser profiles, land inside it; the creating process removes it when it exits.
 * Child processes and Playwright workers inherit the variable and reuse the root without owning it.
 */
export function createRunTmpRoot() {
  const inherited = process.env[ROOT_ENV]
  if (inherited) return { root: inherited, remove: () => {} }

  const root = mkdtempSync(join(tmpdir(), 'titan-run-'))
  process.env[ROOT_ENV] = root
  process.env.TMPDIR = root
  const remove = () => rmSync(root, { recursive: true, force: true, maxRetries: 3 })
  process.on('exit', remove)
  return { root, remove }
}
