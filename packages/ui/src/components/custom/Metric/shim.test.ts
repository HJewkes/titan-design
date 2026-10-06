import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/metric'
import * as legacy from './index'

describe('custom/Metric migration shim (M6)', () => {
  it('re-exports Metric and MetricGroup as the ui/metric bindings', () => {
    expect(legacy.Metric).toBeDefined()
    expect(legacy.Metric).toBe(moved.Metric)
    expect(legacy.MetricGroup).toBe(moved.MetricGroup)
  })

  it('still exports Metric from the package root', () => {
    expect(root.Metric).toBe(moved.Metric)
    expect(root.MetricGroup).toBe(moved.MetricGroup)
  })

  it('exports no value that ui/metric lacks', () => {
    expect(Object.keys(legacy).sort()).toEqual(Object.keys(moved).sort())
  })
})
