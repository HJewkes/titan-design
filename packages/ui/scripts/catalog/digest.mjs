/**
 * The markdown digest of `component-catalog.json`: one table row per entry, a pure function of the
 * JSON. Rows sort by name and the file carries no counts or timestamps, so a change to one entry
 * rewrites only that entry's row and two PRs that touch different components do not conflict.
 */

const COLUMNS = ['Name', 'Status', 'Family', 'Purpose', 'Composes', 'First story']
const EMPTY = '—'

const byNameThenFile = (a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : a.file < b.file ? -1 : a.file > b.file ? 1 : 0

/** A table cell: one line, `|` escaped so it cannot split the row. */
export function cell(text) {
  const flat = String(text ?? '')
    .replace(/\s*\r?\n\s*/g, ' ')
    .trim()
  return flat === '' ? EMPTY : flat.replace(/\|/g, '\\|')
}

function row(entry) {
  const values = [
    entry.name,
    entry.status,
    entry.family,
    entry.purpose,
    entry.composes.join(', '),
    entry.storyIds[0],
  ]
  return `| ${values.map(cell).join(' | ')} |`
}

/** The digest as written to `docs/component-catalog.md`. */
export function renderDigest(catalog) {
  const header = [`| ${COLUMNS.join(' | ')} |`, `|${COLUMNS.map(() => ' --- |').join('')}`]
  const rows = [...catalog.entries].sort(byNameThenFile).map(row)
  return [
    '# Component catalog',
    '',
    'Generated from `src/arch/component-catalog.json` by `pnpm catalog`. Do not edit by hand.',
    '',
    ...header,
    ...rows,
    '',
  ].join('\n')
}
