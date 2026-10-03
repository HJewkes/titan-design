import { describe, expect, it } from 'vitest'
import * as root from '../../../index'
import * as moved from '../../ui/file-path-label'
import * as legacy from './FilePathLabel'

describe('custom/ActiveWork FilePathLabel migration shim (M6)', () => {
  it('re-exports FilePathLabel and splitPath as the ui/file-path-label bindings', () => {
    expect(legacy.FilePathLabel).toBeDefined()
    expect(legacy.FilePathLabel).toBe(moved.FilePathLabel)
    expect(legacy.splitPath).toBe(moved.splitPath)
  })

  it('still exports FilePathLabel from the package root', () => {
    expect(root.FilePathLabel).toBe(moved.FilePathLabel)
  })

  it('exports no value that ui/file-path-label lacks', () => {
    expect(Object.keys(legacy).sort()).toEqual(Object.keys(moved).sort())
  })
})
