/**
 * Checks the packages/ui version bump against the API report diff (TD-27 S2).
 *
 *   node scripts/check-release-bump.mjs --base <ref>
 *
 * Reads api/<entry>.api.md and package.json at <ref> with `git show`, compares them with the
 * working tree, and fails when the version bump is smaller than the API diff requires. Skips when
 * the version is unchanged or <ref> has no reports (v0.21.2 predates them).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { isEntryPoint } from './lib/entry.mjs'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PKG_PATH_IN_REPO = 'packages/ui'
const REPORT_DIR = 'api'
const REPORT_SUFFIX = '.api.md'
const EX_USAGE = 64

const BUMP_RANK = { none: 0, patch: 1, minor: 2, major: 3 }

// Owner decision TD-27 Q1 (2026-10-03). In 0.x a breaking change ships in a minor. From 1.0 on,
// breaking needs a major; additive follows semver and needs a minor.
export const BUMP_RULES = {
  zero: { breaking: 'minor', additive: 'patch', none: 'none' },
  stable: { breaking: 'major', additive: 'minor', none: 'none' },
}

/** True when every line of `base` appears in `head` in order, so `head` only adds lines. */
function onlyAdds(base, head) {
  const headLines = head.split('\n')
  let next = 0
  for (const line of base.split('\n')) {
    while (next < headLines.length && headLines[next] !== line) next += 1
    if (next === headLines.length) return false
    next += 1
  }
  return true
}

/**
 * 'none' when the reports are identical, 'additive' when every changed line is an addition or a
 * report is new, 'breaking' when any line is removed or modified or a report disappears.
 * Each argument maps a report name to its text.
 */
export function classifyApiDiff(baseReports, headReports) {
  let kind = 'none'
  for (const [name, base] of Object.entries(baseReports)) {
    const head = headReports[name]
    if (head === undefined || !onlyAdds(base, head)) return 'breaking'
    if (head !== base) kind = 'additive'
  }
  const added = Object.keys(headReports).some((name) => !(name in baseReports))
  return added ? 'additive' : kind
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (!match) throw new Error(`not a semver version: ${version}`)
  return match.slice(1, 4).map(Number)
}

/** The smallest bump the API diff `kind` needs when releasing from `version`. */
export function requiredBump(kind, version) {
  const [major] = parseVersion(version)
  return BUMP_RULES[major === 0 ? 'zero' : 'stable'][kind]
}

/** The bump from `baseVersion` to `headVersion`, or 'downgrade'. Prerelease suffixes are ignored. */
export function versionBump(baseVersion, headVersion) {
  const base = parseVersion(baseVersion)
  const head = parseVersion(headVersion)
  const levels = ['major', 'minor', 'patch']
  for (const [index, level] of levels.entries()) {
    if (head[index] > base[index]) return level
    if (head[index] < base[index]) return 'downgrade'
  }
  return 'none'
}

/** The breaking report names, for the failure message. */
function breakingReports(baseReports, headReports) {
  return Object.keys(baseReports).filter(
    (name) => classifyApiDiff({ [name]: baseReports[name] }, headReports) === 'breaking'
  )
}

/** Decides the check: { status: 'skip' | 'pass' | 'fail', message }. */
export function checkReleaseBump({ baseRef, baseReports, headReports, baseVersion, headVersion }) {
  const bump = versionBump(baseVersion, headVersion)
  if (bump === 'none') {
    return { status: 'skip', message: `version ${headVersion} is unchanged from ${baseRef}` }
  }
  if (Object.keys(baseReports).length === 0) {
    return { status: 'skip', message: `${baseRef} has no API reports in ${REPORT_DIR}/` }
  }
  const kind = classifyApiDiff(baseReports, headReports)
  const required = requiredBump(kind, baseVersion)
  const delta = `${baseVersion} -> ${headVersion}`
  if (bump !== 'downgrade' && BUMP_RANK[bump] >= BUMP_RANK[required]) {
    return { status: 'pass', message: `${kind} API diff, ${bump} bump (${delta})` }
  }
  const reports =
    kind === 'breaking' ? ` in ${breakingReports(baseReports, headReports).join(', ')}` : ''
  return {
    status: 'fail',
    message:
      `the API diff against ${baseRef} is ${kind}${reports}, which needs at least a ` +
      `${required} bump from ${baseVersion}; package.json bumps ${bump} (${delta})`,
  }
}

function gitShow(ref, file) {
  return execFileSync('git', ['show', `${ref}:${PKG_PATH_IN_REPO}/${file}`], {
    cwd: PKG_ROOT,
    encoding: 'utf8',
  })
}

function readBaseReports(ref) {
  const listing = execFileSync(
    'git',
    ['ls-tree', '--full-tree', '--name-only', ref, `${PKG_PATH_IN_REPO}/${REPORT_DIR}/`],
    { cwd: PKG_ROOT, encoding: 'utf8' }
  )
  const files = listing.split('\n').filter((file) => file.endsWith(REPORT_SUFFIX))
  const names = files.map((file) => path.basename(file, REPORT_SUFFIX))
  return Object.fromEntries(
    names.map((name) => [name, gitShow(ref, `${REPORT_DIR}/${name}${REPORT_SUFFIX}`)])
  )
}

function readHeadReports() {
  const dir = path.join(PKG_ROOT, REPORT_DIR)
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(REPORT_SUFFIX))
  return Object.fromEntries(
    files.map((file) => [
      path.basename(file, REPORT_SUFFIX),
      fs.readFileSync(path.join(dir, file), 'utf8'),
    ])
  )
}

function main(argv) {
  const baseIndex = argv.indexOf('--base')
  const baseRef = baseIndex === -1 ? undefined : argv[baseIndex + 1]
  if (!baseRef) {
    process.stderr.write('usage: check-release-bump.mjs --base <ref>\n')
    process.exitCode = EX_USAGE
    return
  }
  const result = checkReleaseBump({
    baseRef,
    baseReports: readBaseReports(baseRef),
    headReports: readHeadReports(),
    baseVersion: JSON.parse(gitShow(baseRef, 'package.json')).version,
    headVersion: JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')).version,
  })
  const stream = result.status === 'fail' ? process.stderr : process.stdout
  stream.write(`check-release-bump: ${result.status}: ${result.message}\n`)
  if (result.status === 'fail') process.exitCode = 1
}

if (isEntryPoint(import.meta.url, process.argv[1])) {
  main(process.argv.slice(2))
}
