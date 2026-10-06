import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/charts/gauge'
import * as legacy from './index'

describe('custom/Gauge migration shim (M8)', () => {
  it('re-exports Gauge as the ui/charts/gauge binding', () => {
    expect(legacy.Gauge).toBeDefined()
    expect(legacy.Gauge).toBe(moved.Gauge)
  })

  it('still exports Gauge from the package root', () => {
    expect(root.Gauge).toBe(moved.Gauge)
  })

  it('exports no value that ui/charts/gauge lacks', () => {
    expect(Object.keys(legacy).sort()).toEqual(Object.keys(moved).sort())
  })
})
