import { expectTypeOf, test } from 'vitest'
import { layeredLayout } from './layouts/layered-layout-model'
import { suppliedLayout } from './layouts/supplied-layout-model'
import type { GraphItemRef, GraphLayout, NetworkGraphProps } from './types'

type Layout = NonNullable<NetworkGraphProps['layout']>

test('layout accepts both factories and a layout written by hand', () => {
  expectTypeOf(layeredLayout()).toMatchTypeOf<Layout>()
  expectTypeOf(layeredLayout({ rankEdgeKinds: ['spawn'] })).toMatchTypeOf<Layout>()
  expectTypeOf(suppliedLayout({ a: { x: 0, y: 0 } })).toMatchTypeOf<Layout>()
  const own: GraphLayout = {
    key: 'own',
    compute: ({ nodes, width, height }) => ({
      positions: Object.fromEntries(nodes.map((node) => [node.id, { x: 0, y: 0 }])),
      order: nodes.map((node) => node.id),
      width,
      height,
    }),
  }
  expectTypeOf(own).toMatchTypeOf<Layout>()
  expectTypeOf<'layered'>().not.toMatchTypeOf<Layout>()
})

test('selection accepts null, a ref, and undefined for uncontrolled', () => {
  expectTypeOf<null>().toMatchTypeOf<NetworkGraphProps['selection']>()
  expectTypeOf<undefined>().toMatchTypeOf<NetworkGraphProps['selection']>()
  expectTypeOf<{ type: 'edge'; id: string }>().toMatchTypeOf<NetworkGraphProps['selection']>()
  expectTypeOf<NetworkGraphProps['onSelectionChange']>().toEqualTypeOf<
    ((selection: GraphItemRef | null) => void) | undefined
  >()
})

test("GraphItemRef['type'] is exactly 'node' | 'edge'", () => {
  expectTypeOf<GraphItemRef['type']>().toEqualTypeOf<'node' | 'edge'>()
})
