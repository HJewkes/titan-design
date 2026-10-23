import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import {
  MarkdownProse,
  ProseAnchor,
  parseProseBlocks,
  safeHref,
  slugify,
  type ProseBlock,
} from './MarkdownProse'
import { DOCS_FIXTURE } from './proseDocsFixture'

const blocks = parseProseBlocks(DOCS_FIXTURE)
const ofType = (type: ProseBlock['type'], list = blocks) => list.filter((b) => b.type === type)
const hrefs = () => screen.getAllByTestId('prose-link').map((a) => a.getAttribute('href'))

describe('parseProseBlocks on a docs page', () => {
  it('drops the frontmatter and comment-only lines', () => {
    const texts = JSON.stringify(blocks)
    expect(texts).not.toContain('title: Synthetic')
    expect(texts).not.toContain('generated:summary')
  })

  it('gives every heading its source level and a VitePress-style unique id', () => {
    const headings = blocks.filter((b) => b.level !== undefined)
    expect(headings.map((h) => [h.level, h.id])).toEqual([
      [1, 'guide'],
      [2, 'setup-steps'],
      [3, 'the-option-flag'],
      [2, 'setup-steps-1'],
      [3, 'again'],
      [4, 'deep-heading'],
    ])
    expect(headings[0]!.text).toBe('Widget guide')
  })

  it('numbers ordered items and nests what is indented under them', () => {
    const items = ofType('li')
    expect(items.map((i) => [i.n, i.text])).toEqual([
      [1, 'Install the widget.'],
      [2, 'Configure it:'],
      [3, 'Run it:'],
    ])
    expect(items[1]!.children!.map((c) => [c.type, c.ordered, c.text])).toEqual([
      ['li', undefined, 'set `size`'],
      ['li', undefined, 'set **colour**'],
    ])
    expect(items[2]!.children!.map((c) => c.type)).toEqual(['code', 'p'])
  })

  it('keeps a number other than 1 inside the paragraph it continues', () => {
    expect(ofType('p').map((p) => p.text)).toContain(
      'The total was 60. A line that only looks like a list item.'
    )
  })

  it('reads containers with their kind, title and nested blocks', () => {
    expect(ofType('callout').map((c) => [c.kind, c.title, c.children!.map((b) => b.type)])).toEqual(
      [
        ['tip', 'Before you start', ['p']],
        ['warning', '', ['p', 'code']],
      ]
    )
    expect(ofType('callout')[1]!.children![1]!.text).toBe('echo none\n:::')
  })
})

describe('MarkdownProse on a docs page', () => {
  it('renders headings as levelled headings carrying their ids', () => {
    const { container } = render(<MarkdownProse body={DOCS_FIXTURE} />)
    const deep = container.querySelector('#deep-heading')!
    expect(deep).toHaveAttribute('role', 'heading')
    expect(deep).toHaveAttribute('aria-level', '4')
    expect(container.querySelector('#the-option-flag')!.textContent).toBe('The option flag')
  })

  it('links safe targets, routes nothing else, and keeps a refused link as text', () => {
    render(<MarkdownProse body={DOCS_FIXTURE} />)
    expect(hrefs()).toEqual([
      '/guides/other#part',
      '#widget-guide',
      'https://example.com/docs',
      './overview',
      '/ref/sizes',
    ])
    expect(screen.getAllByTestId('prose-link')[2]).toHaveAttribute('target', '_blank')
    expect(screen.getByTestId('prose-link-refused')).toHaveTextContent('bad one')
    expect(document.querySelector('a[href^="javascript"]')).toBeNull()
  })

  it('renders italic, bold and code spans without their markers', () => {
    render(<MarkdownProse body={DOCS_FIXTURE} />)
    expect(screen.getAllByTestId('prose-em').map((em) => em.textContent)).toEqual([
      'italic',
      'also italic',
    ])
    expect(screen.getByText('bold with', { exact: false }).textContent).toBe('bold with code')
    expect(document.body.textContent).not.toMatch(/\*\*|`|<!--/)
    expect(screen.getByText(/The count is/).textContent).toBe('The count is three widgets.')
  })

  it('groups items into lists, nested lists inside their item', () => {
    render(<MarkdownProse body={DOCS_FIXTURE} />)
    const [outer, inner] = screen.getAllByRole('list')
    expect(within(outer!).getAllByRole('listitem')).toHaveLength(5)
    expect(within(inner!).getAllByRole('listitem')).toHaveLength(2)
    expect(outer!.textContent).toContain('2.Configure it:')
  })

  it('renders containers as status notes with a default title', () => {
    render(<MarkdownProse body={DOCS_FIXTURE} />)
    const tip = screen.getByTestId('prose-callout-tip')
    expect(tip).toHaveAttribute('role', 'note')
    expect(tip).toHaveTextContent('Before you start')
    expect(screen.getByTestId('prose-callout-warning')).toHaveTextContent(/^\W*WARNING/)
  })

  it('passes each fence to the highlight seam and renders what it returns', () => {
    const highlight = vi.fn((code: string, lang: string) =>
      lang === 'sh' ? <Text testID="hl">{code.toUpperCase()}</Text> : null
    )
    render(<MarkdownProse body={DOCS_FIXTURE} highlight={highlight} />)
    expect(highlight).toHaveBeenCalledWith('widget run', 'sh')
    expect(screen.getByTestId('hl')).toHaveTextContent('WIDGET RUN')
    expect(screen.getAllByTestId('prose-code')[1]).toHaveTextContent('echo none')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<MarkdownProse body={DOCS_FIXTURE} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('MarkdownProse link slot', () => {
  it('hands each safe link to renderLink and lets ProseAnchor route a plain click', () => {
    const navigate = vi.fn()
    const seen: string[] = []
    render(
      <MarkdownProse
        body="Go [**home**](/home) or [out](https://example.com)."
        renderLink={(link) => {
          seen.push(`${link.label}|${link.href}|${link.isExternal}`)
          return (
            <ProseAnchor
              {...link}
              onPress={link.isExternal ? undefined : () => navigate(link.href)}
            />
          )
        }}
      />
    )
    expect(seen).toEqual(['home|/home|false', 'out|https://example.com|true'])
    const home = screen.getAllByTestId('prose-link')[0]!
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    fireEvent(home, click)
    expect(navigate).toHaveBeenCalledWith('/home')
    expect(click.defaultPrevented).toBe(true)
  })
})

describe('MarkdownProse inline mode', () => {
  it('renders spans with no block wrapper and reads block markup as text', () => {
    const { container } = render(
      <MarkdownProse inline body={'# not a heading with *em*\nand [a link](/x)'} />
    )
    expect(container.children).toHaveLength(1)
    expect(container.firstElementChild!.querySelector('div')).toBeNull()
    expect(screen.queryByRole('heading')).toBeNull()
    expect(container.textContent).toBe('# not a heading with em and a link')
    expect(screen.getByTestId('prose-link')).toHaveAttribute('href', '/x')
  })
})

describe('safeHref', () => {
  it.each([
    ['https://example.com/a?b#c', true],
    ['HTTP://example.com', true],
    ['mailto:someone@example.com', true],
    ['/guides/a', true],
    ['./b', true],
    ['../c.md', true],
    ['#anchor', true],
    ['?q=1', true],
    ['plain/path', true],
    ['javascript:alert(1)', false],
    ['JavaScript:alert(1)', false],
    ['data:text/html,x', false],
    ['vbscript:x', false],
    ['java\tscript:alert(1)', false],
    ['jav&x:alert', false],
    ['', false],
  ])('%s passes: %s', (url, passes) => {
    expect(safeHref(url) !== null).toBe(passes)
  })
})

describe('slugify', () => {
  it.each([
    ['Webhook ingress', 'webhook-ingress'],
    ['gate resolve', 'gate-resolve'],
    ['What’s new?', 'what-s-new'],
    ['1. Intro', '_1-intro'],
    ['Café crème', 'cafe-creme'],
    ['A -- B', 'a-b'],
  ])('%s becomes %s', (text, id) => {
    expect(slugify(text)).toBe(id)
  })
})

describe('parseProseBlocks on unclosed markup', () => {
  it('stays linear on unclosed comments, containers and nested items', () => {
    const lines = 4_000
    const body = [
      '<!-- open\n'.repeat(lines),
      '::: tip\n'.repeat(lines),
      '- a\n  '.repeat(lines),
    ].join('')
    const started = performance.now()
    parseProseBlocks(body)
    render(<MarkdownProse body={'[a('.repeat(lines) + '<!--'.repeat(lines) + '*a'.repeat(lines)} />)
    expect(performance.now() - started).toBeLessThan(1500)
  })
})
