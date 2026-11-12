// @vitest-environment node
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BLOCKER_KINDS, CONTRAST_TOKEN_KIND, WARNING_KINDS } from './checks.mjs'
import { RULE_BY_AXE_RULE, RULE_BY_KIND, withRules } from './rules.mjs'

const doc = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/design-rules.md'),
  'utf8'
)
const documentedRules = new Set(
  [...doc.matchAll(/^\| (DR-[A-Z]{2}-\d\d(?:r\d+)?) \|/gm)].map((m) => m[1])
)

describe('audit:stories rule ids', () => {
  it('reads every registry row from design-rules.md', () => {
    expect(documentedRules.size).toBe(89)
  })

  it('emits only rule ids that design-rules.md lists', () => {
    const emitted = [...new Set(Object.values(RULE_BY_KIND))]

    const missing = emitted.filter((id) => !documentedRules.has(id))

    expect(missing).toEqual([])
  })

  it('maps only kinds the audit can report', () => {
    const kinds = new Set([...BLOCKER_KINDS, ...WARNING_KINDS, CONTRAST_TOKEN_KIND])

    expect(Object.keys(RULE_BY_KIND).filter((kind) => !kinds.has(kind))).toEqual([])
  })

  it('tags each finding with its rule and leaves unmapped kinds without one', () => {
    const entry = {
      id: 'components-atoms-sample--default',
      blockers: [{ kind: 'overflow', selector: '.a', detail: 'by 4px' }],
      warnings: [{ kind: 'stacked-inset', selector: '.b', detail: 'gap 20px' }],
      contrast_token: [{ kind: 'contrast-token', selector: '.c', detail: 'ratio 3:1' }],
    }

    const tagged = withRules(entry)

    expect(tagged.blockers[0]).not.toHaveProperty('rule')
    expect(tagged.warnings[0].rule).toBe('DR-LA-04')
    expect(tagged.contrast_token[0].rule).toBe('DR-CO-01')
  })

  it('cites the narrower rule for target-size and label, and DR-IX-14 for other axe rules', () => {
    const axe = (rule) => ({ kind: 'axe-violation', axe_rule: rule, selector: '.a', detail: 'x' })
    const entry = { warnings: [axe('target-size'), axe('label'), axe('list')] }

    const rules = withRules(entry).warnings.map((f) => f.rule)

    expect(rules).toEqual(['DR-IX-02', 'DR-IX-13', 'DR-IX-14'])
    expect(Object.values(RULE_BY_AXE_RULE).filter((id) => !documentedRules.has(id))).toEqual([])
  })

  it('leaves a frame that failed to render as it was', () => {
    const failed = { id: 'components-atoms-sample--default', rendered: false, error: 'boom' }

    expect(withRules(failed)).toEqual(failed)
  })
})
