import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { capturedByNode } from '../../../../test/classname-capture'
import { Typography } from '../../typography'
import { blogHighlights, blogSchema } from './fixtures'
import { SchemaCard } from './SchemaCard'

const LABEL = 'Blog tables'

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function connectorStyle(container: HTMLElement, relation: string) {
  const path = container.querySelector(`[data-relation="${relation}"] [data-part="connector"]`)
  const style = path?.getAttribute('style') ?? ''
  const read = (name: string) => Number(new RegExp(`${name}:\\s*([\\d.]+)`).exec(style)?.[1])
  return { length: read('stroke-dasharray'), offset: read('stroke-dashoffset') }
}

function cardAt(t: number) {
  return (
    <SchemaCard data={blogSchema} highlights={blogHighlights} t={t} accessibilityLabel={LABEL} />
  )
}

describe('SchemaCard', () => {
  it('renders every table, field and type from data', () => {
    // Catches: a table or row dropped by the layout.
    render(<SchemaCard data={blogSchema} accessibilityLabel={LABEL} />)
    for (const name of ['authors', 'posts', 'comments', 'handle', 'title', 'post_id']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText('PK')).toHaveLength(3)
    expect(screen.getAllByText('FK')).toHaveLength(3)
  })

  it('draws no connector at 0 and every connector once settled', () => {
    // Catches: a reversed draw-on offset (a full line at 0, none at the end).
    const { container, rerender } = render(
      <SchemaCard data={blogSchema} t={0} accessibilityLabel={LABEL} />
    )
    const start = connectorStyle(container, 'post-author')
    expect(start.length).toBeGreaterThan(0)
    expect(start.offset).toBeCloseTo(start.length)
    rerender(<SchemaCard data={blogSchema} accessibilityLabel={LABEL} />)
    expect(connectorStyle(container, 'post-author').offset).toBe(0)
  })

  it('hides a table from assistive technology until it starts to show', () => {
    // Catches: invisible rows still read out at the start of the reveal.
    render(<SchemaCard data={blogSchema} t={0} accessibilityLabel={LABEL} />)
    expect(screen.getByTestId('schema-table-posts')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the settled card under reduced motion whatever t is', () => {
    // Catches: reduced motion ignored, so the first frame is blank.
    mockReducedMotion(true)
    const { container } = render(<SchemaCard data={blogSchema} t={0} accessibilityLabel={LABEL} />)
    expect(connectorStyle(container, 'comment-author').offset).toBe(0)
    expect(screen.getByTestId('schema-table-posts')).not.toHaveAttribute('aria-hidden')
  })

  it('names what a foreign key references', () => {
    // Catches: relations conveyed by the drawn line alone.
    render(<SchemaCard data={blogSchema} accessibilityLabel={LABEL} />)
    expect(
      screen.getByLabelText('author_id, uuid, foreign key, references authors.id', {
        selector: '[data-testid="schema-row-posts-author_id"]',
      })
    ).toBeInTheDocument()
  })

  it('fills the highlighted row while its window is open', () => {
    // Catches: the highlight painted on the wrong row.
    const { atS, durS } = blogHighlights[0]!
    render(
      <SchemaCard
        data={blogSchema}
        highlights={blogHighlights}
        t={atS + durS! / 2}
        accessibilityLabel={LABEL}
      />
    )
    expect(screen.getByTestId('schema-highlight-posts-author_id')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('schema-highlight-posts-id')).toHaveStyle({ opacity: '0' })
  })

  it('sets a lit row’s quiet text in primary so it keeps contrast on the fill', () => {
    // Catches: secondary text left on the selected fill (3.6:1 in dark, under 4.5:1).
    const { atS, durS } = blogHighlights[0]!
    render(
      <SchemaCard
        data={blogSchema}
        highlights={blogHighlights}
        t={atS + durS! / 2}
        accessibilityLabel={LABEL}
      />
    )
    const classesOf = (row: string, text: string) =>
      capturedByNode.get(within(screen.getByTestId(row)).getByText(text))?.split(' ')
    expect(classesOf('schema-row-posts-author_id', 'uuid')).toContain('text-text-primary')
    expect(classesOf('schema-row-posts-author_id', 'FK')).toContain('text-text-primary')
    expect(classesOf('schema-row-posts-title', 'text')).toContain('text-text-secondary')
  })

  it('renders the same frame at t whether swept there or rendered cold', () => {
    // Catches: any state carried between frames, such as a latch on the furthest t seen.
    const { container: sweptRoot, rerender } = render(cardAt(0))
    for (let t = 0; t <= 4; t += 1 / 60) rerender(cardAt(t))
    rerender(cardAt(2.4))
    const { container: coldRoot } = render(cardAt(2.4))
    expect(sweptRoot.innerHTML).toBe(coldRoot.innerHTML)
  })

  it('shows the default empty state for no tables, or the given one', () => {
    // Catches: an empty schema rendering a blank frame.
    const { rerender } = render(<SchemaCard data={{ tables: [] }} accessibilityLabel={LABEL} />)
    expect(screen.getByText('No tables')).toBeInTheDocument()
    rerender(
      <SchemaCard
        data={{ tables: [] }}
        emptyState={<Typography>Nothing yet</Typography>}
        accessibilityLabel={LABEL}
      />
    )
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
  })

  it('shows a placeholder while loading and no tables', () => {
    // Catches: loading falling through to the data.
    render(<SchemaCard data={blogSchema} isLoading accessibilityLabel={LABEL} />)
    expect(screen.queryByText('authors')).not.toBeInTheDocument()
    expect(screen.getByLabelText(LABEL)).toBeInTheDocument()
  })

  it.each([
    ['settled', { data: blogSchema }],
    ['mid-reveal', { data: blogSchema, t: 1.5, highlights: blogHighlights }],
    ['empty', { data: { tables: [] } }],
    ['loading', { data: blogSchema, isLoading: true }],
  ])('has no accessibility violations when %s', async (_name, props) => {
    const { container } = render(<SchemaCard {...props} accessibilityLabel={LABEL} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
