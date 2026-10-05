import type { ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import type { TreeNode, TreeRenderSlot, TreeRow } from './types'
import { useTreeNavigation, type TreeRowProps } from './useTreeNavigation'

interface Metric {
  loc: number
}

function useMetricTree(nodes: TreeNode<Metric>[]) {
  return useTreeNavigation({ nodes })
}

type Navigation = ReturnType<typeof useMetricTree>
type RowNode = ReturnType<Navigation['getRowProps']>['node']

describe('TreeView types', () => {
  it('infers T from nodes into the rows and the row props', () => {
    expectTypeOf<Navigation['rows'][number]>().toEqualTypeOf<TreeRow<Metric>>()
    expectTypeOf<Navigation['getRowProps']>().parameter(0).toEqualTypeOf<TreeRow<Metric>>()
    expectTypeOf<ReturnType<Navigation['getRowProps']>>().toEqualTypeOf<TreeRowProps<Metric>>()
    expectTypeOf<RowNode>().toEqualTypeOf<TreeNode<Metric>>()
  })

  it('carries T from the row props into both render slots', () => {
    const renderLeading: TreeRenderSlot<Metric> = (node) => node.kind ?? null
    const renderTrailing: TreeRenderSlot<Metric> = (node) => {
      expectTypeOf(node.data).toEqualTypeOf<Metric | undefined>()
      // @ts-expect-error Metric has no `fanIn` field
      return node.data?.fanIn
    }

    expectTypeOf(renderLeading).parameter(0).toEqualTypeOf<RowNode>()
    expectTypeOf(renderTrailing).parameter(0).toEqualTypeOf<RowNode>()
    expectTypeOf(renderTrailing).returns.toEqualTypeOf<ReactNode>()
  })
})
