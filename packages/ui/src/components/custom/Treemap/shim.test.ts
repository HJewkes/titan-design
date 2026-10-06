import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/charts/treemap'
import * as legacy from './index'

describe('custom/Treemap migration shim (M8)', () => {
  it('re-exports Treemap as the ui/charts/treemap binding', () => {
    expect(legacy.Treemap).toBeDefined()
    expect(legacy.Treemap).toBe(moved.Treemap)
  })

  it('still exports Treemap from the package root', () => {
    expect(root.Treemap).toBe(moved.Treemap)
  })

  it('exports no value that ui/charts/treemap lacks', () => {
    expect(Object.keys(legacy).sort()).toEqual(Object.keys(moved).sort())
  })
})
