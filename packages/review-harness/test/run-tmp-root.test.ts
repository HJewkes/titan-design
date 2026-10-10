import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

const HELPER = fileURLToPath(new URL('../../../scripts/test-tmp-root.mjs', import.meta.url))

const scratch: string[] = []
afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function freshEnv(tmp: string) {
  const { TITAN_TEST_TMP_ROOT: _inherited, ...rest } = process.env
  return { ...rest, TMPDIR: tmp }
}

// Runs `body` in a fresh node process whose TMPDIR is a scratch dir, so the run root never touches the shared one.
function runInFreshProcess(body: string) {
  const parent = mkdtempSync(join(tmpdir(), 'titan-run-root-'))
  scratch.push(parent)
  const script = join(parent, 'run.mjs')
  writeFileSync(script, `import { createRunTmpRoot } from ${JSON.stringify(HELPER)}\n${body}`)
  const env = freshEnv(parent)
  const stdout = execFileSync(process.execPath, [script], { env, encoding: 'utf8' })
  return { parent, stdout: stdout.trim() }
}

describe('per-run test temp root', () => {
  it('points os.tmpdir() inside the run root for this test run', () => {
    expect(process.env.TITAN_TEST_TMP_ROOT).toBeTruthy()
    expect(tmpdir()).toBe(process.env.TITAN_TEST_TMP_ROOT)
  })

  it('removes the root, and what was created under it, when the process exits', () => {
    const { stdout } = runInFreshProcess(`
const { root } = createRunTmpRoot()
const { mkdtempSync, writeFileSync } = await import('node:fs')
const { tmpdir } = await import('node:os')
writeFileSync(mkdtempSync(tmpdir() + '/x-') + '/f', 'x')
console.log(root)
`)
    expect(stdout).not.toBe('')
    expect(existsSync(stdout)).toBe(false)
  })

  it('removes the root when the process exits with a failure', () => {
    const parent = mkdtempSync(join(tmpdir(), 'titan-run-root-'))
    scratch.push(parent)
    const marker = join(parent, 'root.txt')
    const script = join(parent, 'fail.mjs')
    writeFileSync(
      script,
      `import { writeFileSync } from 'node:fs'
import { createRunTmpRoot } from ${JSON.stringify(HELPER)}
writeFileSync(${JSON.stringify(marker)}, createRunTmpRoot().root)
process.exit(3)`
    )
    const env = freshEnv(parent)
    expect(() => execFileSync(process.execPath, [script], { env })).toThrow()
    const root = readFileSync(marker, 'utf8')
    expect(existsSync(root)).toBe(false)
  })
})
