// @vitest-environment node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  describeShadow,
  findRawShadows,
  // @ts-expect-error — plain-ESM build tooling, shared with the arch ratchets
} from '../../scripts/raw-shadow.mjs'
import { readComponentTree } from '../../scripts/component-anatomy.mjs'

interface Hit {
  file: string
  line: number
  match: string
}

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const scan = (source: string, file = 'ui/box/Box.tsx'): Hit[] => findRawShadows({ [file]: source })

describe('raw Tailwind shadows', () => {
  it('finds none in the component tree', () => {
    const hits = (findRawShadows(readComponentTree(PKG_ROOT)) as Hit[]).map(describeShadow)

    expect(hits).toEqual([])
  })

  it('finds shadow-md in a ui tsx', () => {
    const hits = scan('<View className="p-2 shadow-md" />')

    expect(hits).toEqual([{ file: 'ui/box/Box.tsx', line: 1, match: 'shadow-md' }])
  })

  it('finds a variant-prefixed shadow', () => {
    expect(scan('<View className="web:shadow-lg" />').map((h) => h.match)).toEqual([
      'web:shadow-lg',
    ])
  })

  it('finds an arbitrary shadow', () => {
    expect(scan('<View className="shadow-[0_0_4px_red]" />').map((h) => h.match)).toEqual([
      'shadow-[0_0_4px_red]',
    ])
  })

  it('reports the line of a hit past the first', () => {
    expect(scan('const a = 1\nconst b = "shadow-inner"')[0].line).toBe(2)
  })

  it('ignores glow tokens and the prose word shadow', () => {
    const source = '// the shadow falls here\n<View className="shadow-glow-primary" />'

    expect(scan(source)).toEqual([])
  })

  it('skips non-source files', () => {
    expect(scan('shadow-md', 'ui/box/README.md')).toEqual([])
  })

  it('names file, line and the lift recipe in the failure message', () => {
    const message = describeShadow({ file: 'ui/modal/Modal.tsx', line: 12, match: 'shadow-md' })

    expect(message).toContain('ui/modal/Modal.tsx:12')
    expect(message).toContain('theme/lift')
  })
})
