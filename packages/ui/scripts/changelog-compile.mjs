/**
 * Folds the fragment files in `changelog.d/` into `CHANGELOG.md` under `## [Unreleased]`, then
 * deletes them. Run it in the release PR, before moving `[Unreleased]` under the version heading.
 *
 *   pnpm changelog:compile             # fold and delete the fragments
 *   pnpm changelog:compile --dry-run   # print the folded [Unreleased] section, write nothing
 *
 * A PR records its entry as `changelog.d/<TASK-ID>-<slug>.md` instead of editing CHANGELOG.md,
 * so two open PRs never edit the same hunk. A fragment is a `section:` front matter line and
 * the entry text:
 *
 *   ---
 *   section: Added
 *   ---
 *   `Foo` takes `bar` (TD-1).
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const SECTIONS = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
  'Internal',
]
const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FRAGMENTS_DIR = 'changelog.d'
const EX_USAGE = 64
const FRONT_MATTER = /^---\n(?:section: *(.+?)\n)?---\n+([\s\S]*?)\s*$/

/** The CHANGELOG bullet for one fragment's text; throws when the fragment is malformed. */
export function parseFragment(name, text) {
  const match = FRONT_MATTER.exec(text.replace(/\r\n/g, '\n'))
  if (!match || !SECTIONS.includes(match[1]) || match[2] === '') {
    throw new Error(
      `${name}: want "---", "section: <${SECTIONS.join('|')}>", "---", then the entry text`
    )
  }
  const lines = match[2].split('\n')
  const bullet = lines[0].startsWith('- ')
    ? lines.join('\n')
    : [`- ${lines[0]}`, ...lines.slice(1).map((line) => (line ? `  ${line}` : line))].join('\n')
  return { section: match[1], bullet }
}

function unreleasedRange(lines) {
  const start = lines.findIndex((line) => line === '## [Unreleased]')
  if (start === -1) throw new Error('CHANGELOG.md has no "## [Unreleased]" heading')
  const next = lines.findIndex((line, index) => index > start && line.startsWith('## '))
  return [start + 1, next === -1 ? lines.length : next]
}

function sectionHeading(lines, [from, to], section) {
  for (let i = from; i < to; i += 1) if (lines[i] === `### ${section}`) return i
  return -1
}

/** Adds an empty `### section` in canonical order and returns the index of its heading. */
function createSection(lines, range, section) {
  const later = SECTIONS.slice(SECTIONS.indexOf(section) + 1)
  const before = later.map((name) => sectionHeading(lines, range, name)).find((at) => at !== -1)
  if (before !== undefined) {
    lines.splice(before, 0, `### ${section}`, '', '')
    return before
  }
  let end = range[1]
  while (end > range[0] && lines[end - 1] === '') end -= 1
  lines.splice(end, 0, '', `### ${section}`, '')
  return end + 1
}

/** `changelog` text with each fragment's bullet added first in its section of `[Unreleased]`. */
export function foldFragments(changelog, fragments) {
  const lines = changelog.split('\n')
  for (const section of SECTIONS) {
    const bullets = fragments.filter((f) => f.section === section).map((f) => f.bullet)
    if (bullets.length === 0) continue
    const range = unreleasedRange(lines)
    const heading = sectionHeading(lines, range, section)
    const at = heading === -1 ? createSection(lines, range, section) : heading
    lines.splice(at + 2, 0, ...bullets)
  }
  return lines.join('\n')
}

function readFragments(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort()
    .map((name) => ({
      name,
      ...parseFragment(name, fs.readFileSync(path.join(dir, name), 'utf8')),
    }))
}

export const USAGE = `Usage: node scripts/changelog-compile.mjs [--dry-run]

Folds changelog.d/*.md into the [Unreleased] section of CHANGELOG.md, then deletes the fragments.

  --dry-run   print the [Unreleased] section that would be written; write and delete nothing
  -h, --help  print this message and exit 0

An unknown flag or argument prints this message to stderr and exits ${EX_USAGE}.
`

/** The `[Unreleased]` heading and body of `changelog`, as `--dry-run` prints it. */
export function unreleasedSection(changelog) {
  const lines = changelog.split('\n')
  const [from, to] = unreleasedRange(lines)
  const section = lines.slice(from - 1, to).join('\n')
  return `${section.trimEnd()}\n`
}

/** The mode `argv` asks for: 'compile', 'dry-run', 'help', or 'usage-error'. */
export function parseArgs(argv) {
  if (argv.some((arg) => arg === '--help' || arg === '-h')) return 'help'
  if (argv.some((arg) => arg !== '--dry-run')) return 'usage-error'
  return argv.length > 0 ? 'dry-run' : 'compile'
}

function compile(root, dryRun) {
  const dir = path.join(root, FRAGMENTS_DIR)
  const file = path.join(root, 'CHANGELOG.md')
  const fragments = readFragments(dir)
  const folded = foldFragments(fs.readFileSync(file, 'utf8'), fragments)
  if (dryRun) {
    process.stdout.write(unreleasedSection(folded))
    return
  }
  fs.writeFileSync(file, folded)
  for (const { name } of fragments) fs.rmSync(path.join(dir, name))
  process.stdout.write(`CHANGELOG.md: folded ${fragments.length} fragment(s)\n`)
}

function main(argv) {
  const mode = parseArgs(argv)
  if (mode === 'help') {
    process.stdout.write(USAGE)
  } else if (mode === 'usage-error') {
    process.stderr.write(USAGE)
    process.exitCode = EX_USAGE
  } else {
    // Tests point the script at a temp copy; nothing else sets this.
    compile(process.env.CHANGELOG_COMPILE_ROOT ?? PKG_ROOT, mode === 'dry-run')
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv.slice(2))
}
