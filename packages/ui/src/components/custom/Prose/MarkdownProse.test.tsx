import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Children, type ReactElement, type ReactNode } from 'react'
import { CodeBlock } from './ProseBlocks'
import { MarkdownProse, parseProseBlocks, type ProseLinker } from './MarkdownProse'

const taskLinker: ProseLinker = { id: 'task', pattern: /\b[A-Z]{2,}-\d+\b/, tone: 'brand' }
const wikiLinker: ProseLinker = {
  id: 'wiki',
  pattern: /\[\[[^\]]+\]\]/,
  tone: 'link',
  label: (ref) => ref.slice(2, -2),
}

interface ElementProps {
  testID?: string
  className?: string
  children?: ReactNode
  raise?: number
  pressed?: boolean
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

  it('folds an indented continuation line into the bullet above it', () => {
    const blocks = parseProseBlocks('- first `code\n  span` continues\nnot indented')
    expect(blocks).toEqual([
      { type: 'li', text: 'first `code span` continues' },
      { type: 'p', text: 'not indented' },
    ])
  })

  it('renders nothing for an empty body', () => {
    expect(parseProseBlocks('')).toEqual([])
  })
})

describe('MarkdownProse', () => {
  it('puts the rule on a raised header View and the code in an inset body', () => {
    const root = CodeBlock({ code: 'const a = 1', lang: 'ts' })
    const [header, body] = Children.toArray(root.props.children) as ReactElement<ElementProps>[]
    const [label] = Children.toArray(header.props.children) as ReactElement<ElementProps>[]
    expect(header.props.testID).toBe('prose-code-header')
    expect(header.props.raise).toBe(1)
    expect(header.props.className).toContain('border-border-subtle')
    expect(label.props.className).not.toMatch(/\bborder/)
    expect(body.props.testID).toBe('prose-code-body')
    expect(body.props.pressed).toBe(true)
  })

  it('insets the code even when the fence has no language', () => {
    const root = CodeBlock({ code: 'x', lang: '' })
    const [body] = Children.toArray(root.props.children) as ReactElement<ElementProps>[]
    expect(body.props.pressed).toBe(true)
  })

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

describe('MarkdownProse linker flags', () => {
  it('warns that a flagged linker pattern loses its flags', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const linker: ProseLinker = { id: 'flagged-td', pattern: /td-\d+/i }
    render(<MarkdownProse body="see TD-12 and td-13" linkers={[linker]} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"flagged-td" has flags "i"'))
    expect(screen.getAllByTestId('prose-ref-flagged-td')).toHaveLength(1)
    warn.mockRestore()
  })

  it('stays quiet for a linker without flags', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<MarkdownProse body="see AW-1" linkers={[taskLinker]} />)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('MarkdownProse fenced code', () => {
  const FENCED = 'before\n\n```ts\nconst a = 1\n  const b = 2\n```\n\nafter'

  it('renders the code verbatim in a scrollable block with the language label', () => {
    render(<MarkdownProse body={FENCED} />)
    expect(screen.getByTestId('prose-code-lang').textContent).toBe('ts')
    expect(screen.getByTestId('prose-code').textContent).toContain('const a = 1\n  const b = 2')
    expect(screen.getByText('after')).toBeTruthy()
  })

  it('omits the label when the fence names no language', () => {
    render(<MarkdownProse body={'```\nplain\n```'} />)
    expect(screen.queryByTestId('prose-code-lang')).toBeNull()
    expect(screen.getByTestId('prose-code').textContent).toBe('plain')
  })

  it('renders the rest of the body as code when the fence never closes', () => {
    const blocks = parseProseBlocks('```sh\nls\n\n- not a bullet')
    expect(blocks).toEqual([{ type: 'code', text: 'ls\n\n- not a bullet', lang: 'sh' }])
    expect(() => render(<MarkdownProse body={'```sh\nls\n\n- not a bullet'} />)).not.toThrow()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<MarkdownProse body={FENCED} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('MarkdownProse pipe tables', () => {
  const TABLE =
    '| Name | Qty | Note |\n| :--- | ---: | :---: |\n| bolt | 4 | `m6` |\n| nut | 12 | ok |'

  it('parses header, rows and alignment from the delimiter row', () => {
    const [block] = parseProseBlocks(TABLE)
    expect(block).toMatchObject({
      type: 'table',
      header: ['Name', 'Qty', 'Note'],
      align: ['left', 'right', 'center'],
      rows: [
        ['bolt', '4', '`m6`'],
        ['nut', '12', 'ok'],
      ],
    })
  })

  it('renders a header row and one row per body line', () => {
    render(<MarkdownProse body={TABLE} />)
    expect(screen.getAllByRole('columnheader')).toHaveLength(3)
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByText('m6')).toBeTruthy()
  })

  it('pads short rows and truncates long ones to the header count', () => {
    const [block] = parseProseBlocks('| a | b |\n|---|---|\n| 1 |\n| 1 | 2 | 3 |')
    expect(block!.rows).toEqual([
      ['1', ''],
      ['1', '2'],
    ])
  })

  it('leaves a pipe line with no delimiter row as a paragraph', () => {
    expect(parseProseBlocks('a | b\nc | d').map((b) => b.type)).toEqual(['p'])
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<MarkdownProse body={TABLE} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
