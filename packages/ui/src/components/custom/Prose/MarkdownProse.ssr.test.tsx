// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MarkdownProse } from './MarkdownProse'
import { DOCS_FIXTURE } from './proseDocsFixture'

describe('MarkdownProse on a server', () => {
  it('renders a docs page to HTML with no window or document', () => {
    expect(typeof window).toBe('undefined')
    const html = renderToString(<MarkdownProse body={DOCS_FIXTURE} />)
    expect(html).toContain('id="deep-heading"')
    expect(html).toContain('href="/guides/other#part"')
    expect(html).toContain('role="note"')
    expect(html).not.toContain('javascript:')
  })
})
