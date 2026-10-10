import { fireEvent, render, screen } from '@testing-library/react'
import { memo, type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { smallFixture } from './fixtures'
import { NetworkGraph } from './NetworkGraph'

const counted = vi.hoisted(() => ({ renders: [] as string[] }))

// Wraps the real NodeButton so each render of its inner function is recorded by node id.
vi.mock('./NetworkGraphParts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./NetworkGraphParts')>()
  type Props = ComponentProps<typeof actual.NodeButton>
  const Inner = (actual.NodeButton as unknown as { type: (props: Props) => JSX.Element }).type
  const NodeButton = memo(function CountedNodeButton(props: Props) {
    counted.renders.push(props.node.id)
    return <Inner {...props} />
  })
  return { ...actual, NodeButton }
})

const edgeTarget = (name: RegExp) => screen.getByRole('button', { name })

beforeEach(() => {
  counted.renders.length = 0
})

describe('NodeButton memoisation', () => {
  it('re-renders only the nodes whose props change when an edge becomes active', () => {
    const { nodes, edges, nodeKinds, edgeKinds } = smallFixture
    render(
      <NetworkGraph
        accessibilityLabel="Topology"
        nodes={nodes}
        edges={edges}
        nodeKinds={nodeKinds}
        edgeKinds={edgeKinds}
        width={720}
        height={420}
      />
    )
    expect(counted.renders).toHaveLength(5)
    counted.renders.length = 0

    fireEvent.pointerEnter(edgeTarget(/^lead-01 to worker-01, Spawned/))
    // The two ends keep every prop; the three other nodes dim.
    expect([...counted.renders].sort()).toEqual(['worker-02', 'worker-03', 'worker-04'])
  })
})
