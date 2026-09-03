import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MarkdownProse, parseProseBlocks, type ProseLinker } from './MarkdownProse'

const taskLinker: ProseLinker = { id: 'task', pattern: /\b[A-Z]{2,}-\d+\b/, tone: 'brand' }
const wikiLinker: ProseLinker = {
  id: 'wiki',
  pattern: /\[\[[^\]]+\]\]/,
  tone: 'link',
  label: (ref) => ref.slice(2, -2),
}

describe('parseProseBlocks', () => {
  it('joins consecutive lines into one paragraph and splits on blank lines', () => {
    const blocks = parseProseBlocks('one\ntwo\n\nthree')
    expect(blocks).toEqual([
      { type: 'p', text: 'one two' },
      { type: 'p', text: 'three' },
    ])
  })

  it('reads headings and bullets, flattening deep headings to h3', () => {
    const blocks = parseProseBlocks('# Title\n## Section\n#### Deep\n- item\n* other')
    expect(blocks.map((b) => b.type)).toEqual(['h1', 'h2', 'h3', 'li', 'li'])
    expect(blocks[2]!.text).toBe('Deep')
    expect(blocks[4]!.text).toBe('other')
  })

  it('renders nothing for an empty body', () => {
    expect(parseProseBlocks('')).toEqual([])
  })
})

describe('MarkdownProse', () => {
  it('renders bold and code spans without their markers', () => {
    render(<MarkdownProse body="a **bold** and `code` span" />)
    expect(screen.getByText('bold')).toBeInTheDocument()
    expect(screen.getByText('code')).toBeInTheDocument()
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
  })

  it('auto-links each linker in its tone and applies the label', () => {
    render(
      <MarkdownProse body="See AW-22 and [[memory-note]]." linkers={[taskLinker, wikiLinker]} />
    )
    expect(screen.getByTestId('prose-ref-task')).toHaveTextContent('AW-22')
    expect(screen.getByTestId('prose-ref-wiki')).toHaveTextContent('memory-note')
    expect(screen.queryByText('[[memory-note]]')).not.toBeInTheDocument()
  })

  it('makes a reference pressable only when its linker has a handler', () => {
    const onPress = vi.fn()
    render(
      <MarkdownProse body="AW-1 then [[note]]" linkers={[{ ...taskLinker, onPress }, wikiLinker]} />
    )
    fireEvent.click(screen.getByTestId('prose-ref-task'))
    expect(onPress).toHaveBeenCalledWith('AW-1')
    expect(screen.getByTestId('prose-ref-task')).toHaveAttribute('role', 'link')
    expect(screen.getByTestId('prose-ref-wiki')).not.toHaveAttribute('role')
  })

  it('lets the first matching linker win when two patterns overlap', () => {
    const broad: ProseLinker = { id: 'broad', pattern: /\b[A-Z]+-\d+\b/ }
    render(<MarkdownProse body="AW-9" linkers={[taskLinker, broad]} />)
    expect(screen.getByTestId('prose-ref-task')).toBeInTheDocument()
    expect(screen.queryByTestId('prose-ref-broad')).not.toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <MarkdownProse
        body="# Head\n\nBody with AW-3.\n\n- a bullet"
        linkers={[{ ...taskLinker, onPress: () => {} }]}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
