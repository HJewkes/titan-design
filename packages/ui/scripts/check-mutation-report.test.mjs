import { describe, expect, it } from 'vitest'
import { check, summarize } from './check-mutation-report.mjs'

const mutants = (...statuses) => statuses.map((status, i) => ({ id: String(i), status }))

describe('check-mutation-report', () => {
  it('fails a report whose mutate globs matched nothing', () => {
    const summary = summarize({ files: {} })

    expect(check(summary)).toMatch(/no mutants/)
  })

  it('fails a report with mutants elsewhere but none in carouselMath', () => {
    const summary = summarize({ files: { 'src/utils/cn.ts': { mutants: mutants('Killed') } } })

    expect(check(summary)).toMatch(/carouselMath/)
  })

  it('scores killed and timed-out mutants as detected and ignores compile errors', () => {
    const report = {
      files: {
        'src/components/ui/carousel/carouselMath.ts': {
          mutants: mutants('Killed', 'Timeout', 'Survived', 'NoCoverage', 'CompileError'),
        },
      },
    }

    const summary = summarize(report)

    expect(check(summary)).toBeNull()
    expect(summary.sentinel).toMatchObject({ total: 5, detected: 2, valid: 4, percent: 50 })
  })
})
