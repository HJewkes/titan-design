import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/charts/spark-bars'
import * as legacy from '.'

describe('custom/charts migration shim (M5)', () => {
  it('re-exports SparkBars as the ui/charts/spark-bars binding', () => {
    expect(legacy.SparkBars).toBeDefined()
    expect(legacy.SparkBars).toBe(moved.SparkBars)
  })

  it('still exports SparkBars from the package root', () => {
    expect(root.SparkBars).toBe(moved.SparkBars)
  })

  it('exports no value from custom/charts that ui/charts/spark-bars lacks', () => {
    expect(Object.keys(legacy)).toEqual(Object.keys(moved))
  })
})
