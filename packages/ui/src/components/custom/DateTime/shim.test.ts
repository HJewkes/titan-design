import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/date-time'
import * as legacy from './index'

describe('custom/DateTime migration shim (M7)', () => {
  it('re-exports DateTime and formatDateTime as the ui/date-time bindings', () => {
    expect(legacy.DateTime).toBeDefined()
    expect(legacy.DateTime).toBe(moved.DateTime)
    expect(legacy.formatDateTime).toBe(moved.formatDateTime)
  })

  it('still exports DateTime from the package root', () => {
    expect(root.DateTime).toBe(moved.DateTime)
    expect(root.formatDateTime).toBe(moved.formatDateTime)
  })

  it('exports no value that ui/date-time lacks', () => {
    expect(Object.keys(legacy).sort()).toEqual(Object.keys(moved).sort())
  })
})
