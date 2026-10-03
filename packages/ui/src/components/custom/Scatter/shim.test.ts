import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/charts/scatter'
import * as legacy from './index'

describe('custom/Scatter migration shim (M8)', () => {
  it('re-exports Scatter as the ui/charts/scatter binding', () => {
    expect(legacy.Scatter).toBeDefined()
    expect(legacy.Scatter).toBe(moved.Scatter)
  })

  it('still exports Scatter from the package root', () => {
    expect(root.Scatter).toBe(moved.Scatter)
  })

  it('exports no value that ui/charts/scatter lacks', () => {
    expect(Object.keys(legacy).sort()).toEqual(Object.keys(moved).sort())
  })
})
