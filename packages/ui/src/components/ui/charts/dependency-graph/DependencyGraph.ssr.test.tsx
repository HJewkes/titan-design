// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DependencyGraph } from './DependencyGraph'
import { architectureGraph } from './fixtures'

describe('DependencyGraph on the server', () => {
  it('renders every node and tier box with no window or document', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')

    const html = renderToString(
      <DependencyGraph
        graph={architectureGraph}
        accessibilityLabel="Package graph"
        width={800}
        height={480}
        defaultFocusedId="api"
      />
    )

    expect(html.match(/data-node="/g)).toHaveLength(12)
    expect(html).toContain('Services')
    expect(html).toContain('Depends on: @acme/schema, @acme/logger, @acme/config')
  })
})
