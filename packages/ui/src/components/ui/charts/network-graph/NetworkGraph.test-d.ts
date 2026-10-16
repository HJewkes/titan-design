import { expectTypeOf, test } from 'vitest'
import { clusteredLayout } from './layouts/clustered-layout-model'
import { egoLayout, type EgoLayoutOptions } from './layouts/ego-layout-model'
import { forceLayout } from './layouts/force-layout-model'
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

test('layout accepts the force, ego and clustered factories', () => {
  expectTypeOf(forceLayout()).toMatchTypeOf<Layout>()
  expectTypeOf(forceLayout({ seed: 2, iterations: 50 })).toMatchTypeOf<Layout>()
  expectTypeOf(egoLayout({ focusId: 'a' })).toMatchTypeOf<Layout>()
  expectTypeOf(egoLayout({ focusId: null, hops: 1, direction: 'incoming' })).toMatchTypeOf<Layout>()
  expectTypeOf(clusteredLayout()).toMatchTypeOf<Layout>()
  expectTypeOf(
    clusteredLayout({ seed: 1, groups: [{ id: 'a', label: 'A' }], ungroupedLabel: 'Other' })
  ).toMatchTypeOf<Layout>()
})

test('egoLayout needs a focusId and takes no seed; direction is exactly its three members', () => {
  // @ts-expect-error focusId is required, even as null
  egoLayout()
  // @ts-expect-error focusId is required, even as null
  egoLayout({ hops: 2 })
  // @ts-expect-error the ego layout draws no random number
  egoLayout({ focusId: 'a', seed: 1 })
  expectTypeOf<EgoLayoutOptions['direction']>().toEqualTypeOf<
    'both' | 'outgoing' | 'incoming' | undefined
  >()
  // @ts-expect-error not a direction
  egoLayout({ focusId: 'a', direction: 'sideways' })
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
