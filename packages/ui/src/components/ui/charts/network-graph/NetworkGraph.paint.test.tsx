// The painted markup of the existing layouts, pinned by hash. A painter change that is meant to be
// additive (a new node, edge or group shape) must leave every hash here unchanged.
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { networkGraphFixtures, type GraphFixture } from './fixtures'
import { clusteredLayout } from './layouts/clustered-layout-model'
import { egoLayout } from './layouts/ego-layout-model'
import { forceLayout } from './layouts/force-layout-model'
import { NetworkGraph } from './NetworkGraph'
import type { GraphLayout } from './types'

const fnv = (text: string) => {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(16)
}

/** The plot, group and node layers, with the per-render `useId` prefix taken out. */
function paintHash(fixture: GraphFixture, layout?: GraphLayout): string {
  const { container, unmount } = render(
    <NetworkGraph
      accessibilityLabel="Topology"
      nodes={fixture.nodes}
      edges={fixture.edges}
      nodeKinds={fixture.nodeKinds}
      edgeKinds={fixture.edgeKinds}
      layout={layout ?? fixture.layout}
      width={720}
      height={420}
    />
  )
  const markup = container.innerHTML.replace(/graph-[A-Za-z0-9]+(?=-)/g, 'graph-ID')
  unmount()
  return fnv(markup)
}

const groupedFixture = networkGraphFixtures['Grouped (40)']

describe('NetworkGraph paint', () => {
  // Mutation caught: any change to the dot, arc, horizontal-link, region or ring markup.
  it('paints every fixture on its own layout as before', () => {
    const hashes = Object.fromEntries(
      Object.entries(networkGraphFixtures).map(([key, fixture]) => [key, paintHash(fixture)])
    )
    expect(hashes).toMatchInlineSnapshot(`
      {
        "All equal": "6a3c73cc",
        "Deep chain": "d84a809c",
        "Directed chain": "351911ce",
        "Empty": "3efc4e99",
        "Grouped (40)": "852aa973",
        "Hostile": "c67b190e",
        "Hub and spokes": "f09a710e",
        "Large (150)": "49698ff7",
        "Long label": "c7878624",
        "Many groups": "9be8e761",
        "Many kinds": "403f3954",
        "Medium (30)": "fc01c789",
        "Missing values": "fab2395",
        "Mutual pair": "578c8b86",
        "No edges": "5a1335d3",
        "One group": "da6cb209",
        "One item": "97dc4a22",
        "Pulse": "5d5805f4",
        "Small (5)": "5d5805f4",
        "Supplied": "fe851967",
        "Two components": "a92e826b",
        "Wide fan-out": "bc8b8d99",
      }
    `)
  })

  // Mutation caught: a change to the free-form painters (arcs, regions, rings, decluttered labels).
  it('paints the force, ego and clustered layouts as before', () => {
    const hashes = {
      force: paintHash(groupedFixture, forceLayout({ seed: 1 })),
      ego: paintHash(groupedFixture, egoLayout({ focusId: groupedFixture.focusId ?? null })),
      clustered: paintHash(groupedFixture, clusteredLayout({ groups: groupedFixture.groups })),
    }
    expect(hashes).toMatchInlineSnapshot(`
      {
        "clustered": "726220e6",
        "ego": "e2ab10b0",
        "force": "c03359e0",
      }
    `)
  })
})
