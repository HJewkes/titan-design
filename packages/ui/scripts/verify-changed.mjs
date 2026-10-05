/**
 * Pre-push gate (TD-646): `pnpm verify:changed` from the repo root.
 *
 * Takes the files changed against the merge-base with origin/main (committed, staged, unstaged
 * and untracked), picks the checks CI would fail on for them (`verify-changed-plan.mjs`), and
 * runs them one process at a time, stopping at the first failure. CI does not run it.
 * Run `git fetch origin main` first if the base may have moved; the script never fetches.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { parseNameList, planSteps, splitByPackage } from './verify-changed-plan.mjs'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = path.resolve(PKG_ROOT, '../..')
const BASE_REF = 'origin/main'

const git = (...args) => execFileSync('git', ['-C', REPO_ROOT, ...args], { encoding: 'utf8' })

function changedFiles() {
  const base = git('merge-base', 'HEAD', BASE_REF).trim()
  const tracked = git('diff', '--name-only', '--diff-filter=d', base)
  const untracked = git('ls-files', '--others', '--exclude-standard')
  return parseNameList(`${tracked}\n${untracked}`)
}

function runStep({ name, args }) {
  const started = Date.now()
  console.log(`\n▶ ${name}`)
  const { status } = spawnSync('pnpm', args, { cwd: PKG_ROOT, stdio: 'inherit' })
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  console.log(status === 0 ? `✔ ${name} (${seconds}s)` : `✖ ${name} failed (${seconds}s)`)
  return status === 0
}

function main() {
  const started = Date.now()
  const { inUi, outside } = splitByPackage(changedFiles())
  if (inUi.length === 0) {
    console.log(`verify:changed: nothing changed in packages/ui against ${BASE_REF}${outside ? ` (${outside} file(s) elsewhere are not checked)` : ''}.`)
    return 0
  }
  console.log(`verify:changed: ${inUi.length} changed file(s) in packages/ui against ${BASE_REF}`)
  for (const step of planSteps(inUi)) {
    if (step.skip) console.log(`\n– ${step.name}: skipped, ${step.skip}`)
    else if (!runStep(step)) return 1
  }
  console.log(`\nverify:changed passed in ${((Date.now() - started) / 1000).toFixed(1)}s`)
  return 0
}

process.exit(main())
