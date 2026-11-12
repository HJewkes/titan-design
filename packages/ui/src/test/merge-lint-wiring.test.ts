import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

/**
 * Wiring of the logged-wrapper lint (TP-3104): `.github/merge-lint.json` is a valid warn-level rule
 * file with an empty allowlist, and CI runs the exact-pinned bin in a `merge-lint` job that the
 * required `check` aggregator waits on.
 */

const REPO_ROOT = path.resolve(__dirname, '../../../..')
const RULES_PATH = path.join(REPO_ROOT, '.github/merge-lint.json')
const CI_PATH = path.join(REPO_ROOT, '.github/workflows/ci.yml')
const EXACT_PIN_RUN = /npx --yes -p @titan-design\/tool-guard@\d+\.\d+\.\d+ titan-merge-lint\s*$/m

interface MergeLintRules {
  $schema: string
  level: string
  scan: { include: string[]; brief: string[] }
  exclude: string[]
  allow: unknown[]
}

function readRules(): MergeLintRules {
  return JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8')) as MergeLintRules
}

/** The text of one top-level job in ci.yml, from its `  <name>:` line to the next job's. */
function jobBlock(ci: string, name: string): string | undefined {
  const lines = ci.split('\n')
  const start = lines.indexOf(`  ${name}:`)
  if (start === -1) return undefined
  const end = lines.findIndex((line, i) => i > start && /^ {2}[\w-]+:\s*$/.test(line))
  return lines.slice(start, end === -1 ? undefined : end).join('\n')
}

function needsOf(job: string): string[] {
  const list = /^ {4}needs: \[([^\]]*)\]/m.exec(job)?.[1] ?? ''
  return list
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

describe('merge-lint wiring', () => {
  it('the rule file is a warn-level merge-lint/1 file with an empty allowlist', () => {
    const rules = readRules()

    expect(rules.$schema).toBe('merge-lint/1')
    expect(rules.level).toBe('warn')
    expect(rules.scan.include).toContain('**/*')
    expect(rules.scan.brief).toContain('**/CLAUDE.md')
    expect(rules.allow).toEqual([])
  })

  it('CI runs the exact-pinned lint bin in a merge-lint job that cannot be skipped past', () => {
    const ci = fs.readFileSync(CI_PATH, 'utf-8')

    const job = jobBlock(ci, 'merge-lint')

    expect(job).toBeDefined()
    expect(job).toMatch(EXACT_PIN_RUN)
    expect(job).not.toMatch(/continue-on-error/)
  })

  it('the required check job waits on merge-lint', () => {
    const ci = fs.readFileSync(CI_PATH, 'utf-8')

    const check = jobBlock(ci, 'check')

    expect(check).toBeDefined()
    expect(needsOf(check ?? '')).toContain('merge-lint')
  })
})
