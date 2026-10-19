/**
 * The markdown digest of the visual router, written to `docs/visual-router.md`.
 *
 *   node scripts/visual-router-digest.mjs   rewrite the digest from dist/visual-router.mjs
 *
 * Reads the built entry, as generate-tokens-css.mjs does, so run it after `pnpm build`.
 * `renderVisualRouterDigest` is a pure function of the router module; the drift test
 * (src/visual/router/catalogue-drift.test.ts) renders it from src and fails on a stale file.
 * The digest carries no counts or timestamps, so a slice that flips one type's status
 * rewrites only that type's rows.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { isEntryPoint } from './lib/entry.mjs'

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DIGEST_PATH = path.join(PKG_ROOT, 'docs/visual-router.md')
const EMPTY = '—'

const STATUS_LEGEND = [
  ['have', 'a component on main renders the type'],
  ['in-flight', 'a contract or model is on main and another task owns the component'],
  ['ng', 'to be built on NetworkGraph: a layout, the map suite or node shapes'],
  ['new', 'a new component with its own computed geometry'],
  ['template', 'a preset over existing components that adds no geometry'],
  ['skip', 'not planned'],
]

/** A table cell: one line, `|` escaped so it cannot split the row. */
function cell(text) {
  const flat = String(text ?? '')
    .replace(/\s*\r?\n\s*/g, ' ')
    .trim()
  return flat === '' ? EMPTY : flat.replace(/\|/g, '\\|')
}

function table(columns, rows) {
  return [
    `| ${columns.join(' | ')} |`,
    `|${columns.map(() => ' --- |').join('')}`,
    ...rows.map((values) => `| ${values.map(cell).join(' | ')} |`),
  ]
}

const code = (text) => `\`${text}\``

/** What to render for a type today: its own component, or the closest available one. */
function rendersNow(routeVisual, typeId) {
  const { render, closest } = routeVisual({ type: typeId })
  if (render) return render.preset ? `${render.component} (${render.preset})` : render.component
  return `gap: closest ${code(closest.type)}, ${closest.component}`
}

function patternRows({ PATTERNS, TYPE_BY_ID, routeVisual }) {
  return PATTERNS.map((pattern) => [
    `${pattern.name} (${code(pattern.id)})`,
    pattern.trigger,
    code(pattern.nearestType),
    TYPE_BY_ID.get(pattern.nearestType).status,
    rendersNow(routeVisual, pattern.nearestType),
  ])
}

function patternCard(pattern) {
  return [
    `### ${pattern.name} (${code(pattern.id)})`,
    '',
    pattern.trigger,
    '',
    `- **Show:** ${pattern.primitives.join('; ')}.`,
    `- **Budget:** ${pattern.budget}`,
    `- **Draw with:** ${code(pattern.nearestType)}`,
    '',
  ]
}

function typeRow(routeVisual, entry) {
  const notThis = entry.notThis.map(({ when, use }) => `${when}: ${code(use)}`).join('; ')
  return [
    `${entry.name} (${code(entry.id)})`,
    entry.status,
    rendersNow(routeVisual, entry.id),
    entry.bestFor,
    notThis,
    entry.patterns.map(code).join(', '),
    entry.budget,
  ]
}

/** The digest as written to `docs/visual-router.md`, from the visual-router entry module. */
export function renderVisualRouterDigest(router) {
  const { CATALOGUE, PATTERNS, routeVisual } = router
  return [
    '# Visual router',
    '',
    'Generated from `src/visual/router/` by `pnpm visual-router:digest`. Do not edit by hand.',
    '',
    'Pick a pattern first when behaviour, risk or enforcement is the point of the picture, and draw it',
    'with the pattern’s type. Otherwise pick a type by what it is best for, and check its “not this”',
    'list. `routeVisual({ pattern, type, need })` from `@titan-design/react-ui/visual-router` returns',
    'the same answer as these tables, including the closest available type for a gap.',
    '',
    ...STATUS_LEGEND.map(([status, meaning]) => `- ${code(status)}: ${meaning}.`),
    '',
    '## Patterns',
    '',
    ...table(['Pattern', 'When', 'Draw with', 'Status', 'Renders now'], patternRows(router)),
    '',
    ...PATTERNS.flatMap(patternCard),
    '## Types',
    '',
    ...table(
      ['Type', 'Status', 'Renders now', 'Best for', 'Not this', 'Patterns', 'Budget'],
      CATALOGUE.map((entry) => typeRow(routeVisual, entry))
    ),
    '',
    '## Attribution',
    '',
    'Routing by semantic pattern before type, the type list, the “not this” lists and complexity',
    'budgets are ideas from cathrynlavery/diagram-design (MIT, © 2025 Cathryn Lavery). All wording,',
    'budgets and titan mappings here are titan’s own.',
    '',
  ].join('\n')
}

async function main() {
  const router = await import('../dist/visual-router.mjs')
  const digest = renderVisualRouterDigest(router)
  await writeFile(DIGEST_PATH, digest, 'utf8')
  console.log(
    `Wrote ${path.relative(process.cwd(), DIGEST_PATH)} (${Buffer.byteLength(digest)} bytes)`
  )
}

if (isEntryPoint(import.meta.url, process.argv[1])) await main()
