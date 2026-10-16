/**
 * Shrink-only ratchet on `(undocumented)` exports in the API reports (TD-27 S5).
 *
 * api/undocumented-baseline.json maps each report name to the sorted `(undocumented)` names in
 * api/<name>.api.md: `Button` for an export, `ButtonProps.isLoading` for one of its members.
 * `api-report.mjs --local` calls `updateBaseline`, which refuses growth without --allow-increase.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'api')
export const BASELINE_PATH = path.join(API_DIR, 'undocumented-baseline.json')
const REPORT_SUFFIX = '.api.md'

const MARKER = /^(\s*)\/\/ (?:@\w+ )*\(undocumented\)$/
const DECLARATION =
  /^export (?:declare )?(?:default )?(?:abstract )?(?:function|const|let|var|interface|type|class|enum|namespace)\s+([\w$]+)/
const MEMBER =
  /^\s*(?:(?:readonly|static|get|set|abstract|private|protected)\s+)*('[^']*'|"[^"]*"|[\w$]+|\[[^\]]*\])/

function nextCodeLine(lines, from) {
  let i = from
  while (i < lines.length && /^\s*\/\//.test(lines[i])) i += 1
  return lines[i] ?? ''
}

/** Sorted, de-duplicated `(undocumented)` names found in one report's text. */
export function parseUndocumented(text) {
  const lines = text.split(/\r?\n/)
  const names = new Set()
  let owner = ''
  lines.forEach((line, index) => {
    // Members belong to the last declaration, documented or not.
    owner = DECLARATION.exec(line)?.[1] ?? owner
    const marker = MARKER.exec(line)
    if (!marker) return
    const code = nextCodeLine(lines, index + 1)
    if (marker[1] === '') {
      names.add(DECLARATION.exec(code)?.[1] ?? code.trim())
      return
    }
    names.add(`${owner}.${MEMBER.exec(code)?.[1] ?? code.trim()}`)
  })
  return [...names].sort()
}

/** `reports` maps a report name to its text; returns the baseline-shaped object. */
export function collectUndocumented(reports) {
  const sorted = Object.keys(reports).sort()
  return Object.fromEntries(sorted.map((name) => [name, parseUndocumented(reports[name])]))
}

/** Names undocumented but unbaselined (`added`), and baselined but no longer undocumented (`stale`). */
export function diffBaseline(current, baseline) {
  const added = []
  const stale = []
  for (const name of new Set([...Object.keys(current), ...Object.keys(baseline)])) {
    const now = new Set(current[name] ?? [])
    const before = new Set(baseline[name] ?? [])
    added.push(...[...now].filter((n) => !before.has(n)).map((n) => `${name}: ${n}`))
    stale.push(...[...before].filter((n) => !now.has(n)).map((n) => `${name}: ${n}`))
  }
  return { added, stale }
}

/** The baseline to write for `reports`; throws when it would grow and `allowIncrease` is off. */
export function nextBaseline(reports, baseline, allowIncrease) {
  const current = collectUndocumented(reports)
  const { added } = diffBaseline(current, baseline)
  if (added.length > 0 && !allowIncrease) {
    throw new Error(
      `${added.length} new (undocumented) export(s); document them, or pass --allow-increase:\n  ` +
        added.join('\n  ')
    )
  }
  return current
}

export function readReports() {
  const files = fs.readdirSync(API_DIR).filter((f) => f.endsWith(REPORT_SUFFIX))
  return Object.fromEntries(
    files.map((f) => [
      f.slice(0, -REPORT_SUFFIX.length),
      fs.readFileSync(path.join(API_DIR, f), 'utf8'),
    ])
  )
}

export function readBaseline() {
  return fs.existsSync(BASELINE_PATH) ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) : {}
}

/** Rewrites the baseline from the committed reports. */
export function updateBaseline({ allowIncrease }) {
  const next = nextBaseline(readReports(), readBaseline(), allowIncrease)
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`)
}
