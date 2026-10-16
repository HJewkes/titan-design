import { describe, expectTypeOf, it } from 'vitest'
import { formatDateTime } from './DateTime'

describe('formatDateTime types', () => {
  it('accepts the options form and the positional form', () => {
    expectTypeOf(
      formatDateTime(0, 'date', { isUTC: true, fallback: 'n/a' })
    ).toEqualTypeOf<string>()
    expectTypeOf(formatDateTime(0, 'date', true, 'n/a')).toEqualTypeOf<string>()
  })

  it('rejects an options object followed by a positional fallback', () => {
    // @ts-expect-error the fallback belongs inside the options object
    formatDateTime(0, 'date', { isUTC: true }, 'n/a')
  })
})
