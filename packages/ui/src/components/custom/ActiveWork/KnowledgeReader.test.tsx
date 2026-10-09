import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { KnowledgeReader, type KnowledgeReaderProps } from './KnowledgeReader'
import { NOTE_KINDS, NOTE_KIND_LABEL } from './knowledge-class'
import { KNOWLEDGE_NOW } from './knowledge-fixture'
import {
  DOCUMENT_BINARY,
  DOCUMENT_EMPTY_BODY,
  DOCUMENT_JSON,
  DOCUMENT_TRUNCATED,
  NOTE_DOCUMENT,
  SOURCE_DOCUMENT_LONG,
  SOURCE_DOCUMENT_TABLES,
} from './knowledge-document-fixture'

const renderReader = (props: Partial<KnowledgeReaderProps> = {}) =>
  render(<KnowledgeReader document={NOTE_DOCUMENT} now={KNOWLEDGE_NOW} {...props} />)

describe('KnowledgeReader', () => {
  it('orders the header: title, then the eyebrow, then date and tags on one line', () => {
    renderReader()
    const title = screen.getByText(NOTE_DOCUMENT.item.title)
    const eyebrow = screen.getByTestId('knowledge-meta')
    const dateTags = screen.getByTestId('knowledge-date-tags')
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(follows(title, eyebrow)).toBe(true)
    expect(follows(eyebrow, dateTags)).toBe(true)
    expect(within(eyebrow).getByText('garden')).toBeInTheDocument()
    expect(within(eyebrow).getByText('Note')).toBeInTheDocument()
    expect(within(dateTags).getByText('Sep 28, 2026')).toBeInTheDocument()
    expect(within(dateTags).getAllByText(/soil|water|beds/)).toHaveLength(3)
    expect(within(eyebrow).queryByText('Sep 28, 2026')).toBeNull()
  })

  it('shows a note kind as an icon and a label, not a pill', () => {
    renderReader()
    const kind = screen.getByTestId('knowledge-kind')
    expect(kind).toHaveTextContent('Gotcha')
    expect(kind.querySelector('svg')).not.toBeNull()
    expect(within(screen.getByTestId('knowledge-meta')).queryByText('Note')).not.toBe(kind)
  })

  it('gives every note kind its own icon', () => {
    const paths = NOTE_KINDS.map((noteKind) => {
      const item = { ...NOTE_DOCUMENT.item, noteKind }
      const { container, unmount } = renderReader({ document: { ...NOTE_DOCUMENT, item } })
      const svg = container.querySelector('[data-testid="knowledge-kind"] svg')!
      const html = svg.innerHTML
      expect(screen.getByTestId('knowledge-kind')).toHaveTextContent(NOTE_KIND_LABEL[noteKind])
      unmount()
      return html
    })
    expect(new Set(paths).size).toBe(NOTE_KINDS.length)
  })

  it('shows a source type as its label with no icon', () => {
    renderReader({ document: SOURCE_DOCUMENT_TABLES })
    const kind = screen.queryByTestId('knowledge-kind')
    if (kind) expect(kind.querySelector('svg')).toBeNull()
    expect(within(screen.getByTestId('knowledge-meta')).getByText('Source')).toBeInTheDocument()
  })

  it('the split layout puts the date after the tags, at the right edge', () => {
    const { unmount } = renderReader()
    const inline = screen.getByTestId('knowledge-date-tags')
    expect(inline.firstElementChild).not.toBe(screen.getByTestId('knowledge-tags'))
    unmount()
    renderReader({ metaLayout: 'split' })
    const dateTags = screen.getByTestId('knowledge-date-tags')
    expect(dateTags.firstElementChild).toBe(screen.getByTestId('knowledge-tags'))
    expect(dateTags.lastElementChild).toHaveTextContent('Sep 28, 2026')
    expect(within(screen.getByTestId('knowledge-meta')).getByText('Gotcha')).toBeInTheDocument()
  })

  it('does not print the title twice', () => {
    renderReader()
    expect(screen.getAllByText(NOTE_DOCUMENT.item.title)).toHaveLength(1)
    expect(screen.getByTestId('knowledge-body')).toHaveTextContent('After the October rain')
  })

  it('routes in-body references to the host', () => {
    const onPressTask = vi.fn()
    const onPressLink = vi.fn()
    const onPressPr = vi.fn()
    renderReader({ onPressTask, onPressLink, onPressPr })
    fireEvent.click(screen.getAllByTestId('prose-ref-task')[0]!)
    expect(onPressTask).toHaveBeenCalledWith('GD-12')
    fireEvent.click(screen.getByTestId('prose-ref-wiki'))
    expect(onPressLink).toHaveBeenCalledWith('bed-layout')
    fireEvent.click(screen.getByTestId('prose-ref-pr'))
    expect(onPressPr).toHaveBeenCalledWith(41)
  })

  it('the initiative name is a link only with a handler', () => {
    const { unmount } = renderReader()
    expect(within(screen.getByTestId('knowledge-meta')).queryByRole('link')).toBeNull()
    unmount()
    const onPressInitiative = vi.fn()
    renderReader({ onPressInitiative })
    fireEvent.click(within(screen.getByTestId('knowledge-meta')).getByRole('link'))
    expect(onPressInitiative).toHaveBeenCalledWith('garden')
  })

  it('tags are buttons only with a handler', () => {
    const { unmount } = renderReader()
    expect(within(screen.getByTestId('knowledge-tags')).queryByRole('button')).toBeNull()
    unmount()
    const onPressTag = vi.fn()
    renderReader({ onPressTag })
    fireEvent.click(
      within(screen.getByTestId('knowledge-tags')).getByRole('button', { name: 'water' })
    )
    expect(onPressTag).toHaveBeenCalledWith('water')
  })

  it('renders the tables and code of a source as blocks, not paragraphs', () => {
    renderReader({ document: SOURCE_DOCUMENT_TABLES })
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText(/segment 2: ramp 60 to 1220/)).toBeInTheDocument()
  })

  it('shows the truncation notice with the byte count', () => {
    renderReader({ document: DOCUMENT_TRUNCATED })
    const notice = screen.getByTestId('knowledge-truncated')
    expect(notice).toHaveTextContent('Only the start of this file is shown')
    expect(notice).toHaveTextContent('2 MB')
  })

  it('shows no truncation notice for a complete read', () => {
    renderReader()
    expect(screen.queryByTestId('knowledge-truncated')).toBeNull()
  })

  it('shows a JSON source as plain text', () => {
    renderReader({ document: DOCUMENT_JSON })
    expect(screen.getByTestId('knowledge-body')).toHaveTextContent('"status": "ordered"')
    expect(screen.queryByTestId('prose-ref-task')).toBeNull()
  })

  it('a binary path shows no preview and no body', () => {
    renderReader({ document: DOCUMENT_BINARY })
    expect(screen.getByText('This file type has no preview')).toBeInTheDocument()
    expect(screen.getByText(DOCUMENT_BINARY.item.path)).toBeInTheDocument()
    expect(screen.queryByTestId('knowledge-body')).toBeNull()
  })

  it('says so when the file has no text', () => {
    renderReader({ document: DOCUMENT_EMPTY_BODY })
    expect(screen.getByText('This file has no text')).toBeInTheDocument()
    expect(screen.queryByTestId('knowledge-body')).toBeNull()
  })

  it('shows the nothing-selected state, or the host’s own', () => {
    const { unmount } = renderReader({ document: undefined })
    expect(screen.getByText('Select a note or source')).toBeInTheDocument()
    unmount()
    renderReader({ document: undefined, emptyState: <p>Pick something</p> })
    expect(screen.getByText('Pick something')).toBeInTheDocument()
  })

  it('shows skeleton lines while loading, hiding the document', () => {
    renderReader({ isLoading: true })
    expect(screen.getByTestId('knowledge-reader-loading')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(NOTE_DOCUMENT.item.title)).toBeNull()
  })

  it('renders header actions beside the title', () => {
    renderReader({ actions: <button type="button">Open file</button> })
    expect(screen.getByRole('button', { name: 'Open file' })).toBeInTheDocument()
  })

  it('renders a 5,000-line document', () => {
    renderReader({ document: SOURCE_DOCUMENT_LONG })
    expect(screen.getByTestId('knowledge-body')).toHaveTextContent('Pool 4999')
  })

  describe('accessibility', () => {
    const cases: Array<[string, Partial<KnowledgeReaderProps>]> = [
      ['document', { onPressInitiative: () => {}, onPressTag: () => {} }],
      ['split layout', { metaLayout: 'split' }],
      ['tables', { document: SOURCE_DOCUMENT_TABLES }],
      ['loading', { isLoading: true }],
      ['nothing selected', { document: undefined }],
      ['truncated', { document: DOCUMENT_TRUNCATED }],
      ['unsupported', { document: DOCUMENT_BINARY }],
      ['empty body', { document: DOCUMENT_EMPTY_BODY }],
    ]
    it.each(cases)('has no violations: %s', async (_name, props) => {
      const { container } = renderReader(props)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
