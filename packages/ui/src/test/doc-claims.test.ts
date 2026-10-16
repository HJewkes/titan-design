import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  REPO_ROOT,
  collectDeadClaims,
  compareToBaseline,
  checkedText,
  deadClaims,
  extractClaims,
  importedPackages,
  isScopedDoc,
  loadRepoContext,
  pathCandidate,
  pnpmScripts,
  readBaseline,
  updatedBaseline,
  type ClaimsByDoc,
  type RepoContext,
} from '../../scripts/doc-claims.mjs'

const CONTROLS_DOC = 'packages/ui/src/test/fixtures/docs-controls.md'
const DEAD_PATH = 'packages/ui/src/theme/tokens/no-such-file.ts'

let context: RepoContext
let findings: ClaimsByDoc

beforeAll(() => {
  context = loadRepoContext()
  findings = collectDeadClaims(context)
})

function readDoc(doc: string) {
  return fs.readFileSync(path.join(REPO_ROOT, doc), 'utf8')
}

describe('doc claims', () => {
  it('lists every dead claim of a scoped doc in the baseline', () => {
    const { unlisted } = compareToBaseline(findings, readBaseline())

    expect(
      unlisted,
      'Fix the doc, or seed with `node scripts/doc-claims.mjs --update --allow-increase`'
    ).toEqual([])
  })

  it('holds no baseline row whose dead claim is gone', () => {
    const { stale } = compareToBaseline(findings, readBaseline())

    expect(stale, 'shrink the baseline: `node scripts/doc-claims.mjs --update`').toEqual([])
  })
})

describe('planted controls', () => {
  it('reports both dead claims in the controls fixture and nothing else', () => {
    const dead = deadClaims(CONTROLS_DOC, readDoc(CONTROLS_DOC), context)

    expect(dead).toEqual([`path:${DEAD_PATH}`, 'script:no-such-script'])
  })

  // The cases below take today's findings as the baseline, so each fails only on its own control.
  it('fails a scoped doc that gains a dead backticked path', () => {
    const planted = `${readDoc('CLAUDE.md')}\nSee \`${DEAD_PATH}\`.\n`
    const withPlant = { ...findings, 'CLAUDE.md': deadClaims('CLAUDE.md', planted, context) }

    const { unlisted, stale } = compareToBaseline(withPlant, findings)

    expect({ unlisted, stale }).toEqual({ unlisted: [`CLAUDE.md path:${DEAD_PATH}`], stale: [] })
  })

  it('fails when a baseline row whose claim still exists is deleted', () => {
    const [doc, [claim, ...rest]] = Object.entries(findings)[0]

    const { unlisted, stale } = compareToBaseline(findings, { ...findings, [doc]: rest })

    expect({ unlisted, stale }).toEqual({ unlisted: [`${doc} ${claim}`], stale: [] })
  })

  it('reports a baseline row whose claim is gone as stale', () => {
    const gone = 'path:gone/long/ago.md'
    const baseline = { ...findings, 'README.md': [...(findings['README.md'] ?? []), gone] }

    const { unlisted, stale } = compareToBaseline(findings, baseline)

    expect({ unlisted, stale }).toEqual({ unlisted: [], stale: [`README.md ${gone}`] })
  })
})

describe('released changelog sections', () => {
  const CHANGELOG = 'packages/ui/CHANGELOG.md'
  const changelog = (unreleased: string, released: string) =>
    `# Changelog\n\n## [Unreleased]\n\n${unreleased}\n\n## 0.1.0\n\n${released}\n`

  it('ignores a dead file name under a released heading', () => {
    const text = changelog('- Nothing.', `- Moved \`${DEAD_PATH}\`.`)

    expect(deadClaims(CHANGELOG, text, context)).toEqual([])
  })

  it('reports a dead file name under Unreleased', () => {
    const text = changelog(`- Moved \`${DEAD_PATH}\`.`, '- Nothing.')

    expect(deadClaims(CHANGELOG, text, context)).toEqual([`path:${DEAD_PATH}`])
  })

  it('checks a released heading in any other doc', () => {
    const text = `## 0.1.0\n\n- \`${DEAD_PATH}\`\n`

    expect(checkedText('CLAUDE.md', text)).toBe(text)
  })
})

describe('updatedBaseline', () => {
  const found = { 'a.md': ['path:x/y.ts', 'retired:Gluestack'] }
  const baseline = { 'a.md': ['path:x/y.ts', 'path:fixed.ts'], 'b.md': ['script:old'] }

  it('drops rows that no longer find a dead claim and never adds one', () => {
    expect(updatedBaseline(found, baseline)).toEqual({ 'a.md': ['path:x/y.ts'] })
  })

  it('adds new dead claims only when allowed to increase', () => {
    expect(updatedBaseline(found, baseline, { allowIncrease: true })).toEqual(found)
  })
})

describe('isScopedDoc', () => {
  it('takes the root docs, docs/, packages/ui docs and agents, not skills or source', () => {
    const scoped = [
      'CLAUDE.md',
      'docs/decisions/README.md',
      'packages/ui/TOKENS.md',
      'packages/ui/docs/audits/a.md',
      '.claude/agents/test-writer.md',
    ]
    const unscoped = [
      '.claude/skills/titan-design/SKILL.md',
      'packages/ui/src/components/ui/README.md',
      'packages/ui/changelog.d/x.md',
      CONTROLS_DOC,
    ]

    expect(scoped.filter(isScopedDoc)).toEqual(scoped)
    expect(unscoped.filter(isScopedDoc)).toEqual([])
  })
})

describe('claim extraction', () => {
  it('reads repo paths and drops line refs, globs, placeholders, URLs and class names', () => {
    const spans = [
      'src/theme/global.css:12-30',
      'tailwind.config.js',
      'ui/charts/kit/',
      'src/**/*.test.ts',
      'src/components/ui/<name>/',
      '@titan-design/react-ui/theme',
      'https://example.com/a',
      'w-1/2',
      'Foundations/Spacing',
      'titan/no-raw-color',
      'dist/index.mjs',
      'bg-surface-base',
    ]

    expect(spans.map(pathCandidate).filter(Boolean)).toEqual([
      'src/theme/global.css',
      'tailwind.config.js',
      'ui/charts/kit/',
    ])
  })

  it('reads the script pnpm runs past its flags', () => {
    const text =
      'pnpm test -- -- --run; pnpm --filter @titan-design/react-ui run size; pnpm -r lint'

    expect(pnpmScripts(text)).toEqual(['test', 'size', 'lint'])
  })

  it('reads imported package names and skips relative, alias and node imports', () => {
    const code = [
      "import { a } from '@scope/pkg/sub'",
      "import b from 'lib/deep'",
      "import './local'",
      "import c from '@/utils/cn'",
      "import fs from 'node:fs'",
      "const d = require('path')",
    ].join('\n')

    expect(importedPackages(code)).toEqual(['@scope/pkg', 'lib'])
  })

  it('reads imports only from code fences and retired terms anywhere', () => {
    const doc = [
      "Prose naming from 'prose-only' is not an import; built on gluestack.",
      '```ts',
      "import { x } from 'fenced'",
      '```',
    ].join('\n')

    expect(extractClaims(doc, [{ term: 'Gluestack', why: '' }])).toEqual([
      'import:fenced',
      'retired:Gluestack',
    ])
  })
})
