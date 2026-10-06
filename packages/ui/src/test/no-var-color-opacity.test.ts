/* eslint-disable titan/no-var-color-opacity --
 * The dead classes below are the probes this test feeds the rule.
 */
import { createRequire } from 'node:module'
import type { Rule } from 'eslint'
import { lintMessages } from './lint-rule-messages'

const rule = createRequire(import.meta.url)(
  '../../eslint-rules/no-var-color-opacity'
) as Rule.RuleModule

const reportFor = (code: string) => lintMessages('no-var-color-opacity', rule, code)[0]

describe('no-var-color-opacity messages', () => {
  it('lists the rungs a token publishes', () => {
    const report = reportFor("const c = 'bg-hairline/20'")
    expect(report.messageId).toBe('deadClass')
    expect(report.message).toContain('`bg-hairline-subtle`')
    expect(report.message).toContain('`bg-hairline-strong`')
  })

  it('says a token with no rung has none and names alpha()', () => {
    const report = reportFor("const c = 'bg-divider/50'")
    expect(report.messageId).toBe('deadClassNoRung')
    expect(report.message).toContain('publishes no wash rung')
    expect(report.message).toContain('`alpha(color, a)`')
    expect(report.message).not.toMatch(/`bg-divider-/)
  })

  it('still reports nothing for a literal-valued colour with an opacity modifier', () => {
    expect(reportFor("const c = 'bg-black/50'")).toBeUndefined()
  })
})
