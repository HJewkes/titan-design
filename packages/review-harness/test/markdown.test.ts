import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from '../page/App.tsx'
import { Markdown, safeUrl } from '../page/Markdown.tsx'
import { initialState } from '../page/state.ts'
import { QuestionBlock } from '../page/QuestionBlock.tsx'
import { ManifestSchema, type Manifest } from '@titan-design/review-schema'
import { SHA, sectionedInput } from './fixtures.ts'

const block = (source: string) =>
  renderToStaticMarkup(createElement(Markdown, { children: source }))
const inline = (source: string) =>
  renderToStaticMarkup(
    createElement('h3', null, createElement(Markdown, { inline: true, children: source }))
  )

describe('markdown constructs', () => {
  it.each([
    ['a heading', '## Options', '<h2>Options</h2>'],
    ['paragraphs', 'One.\n\nTwo.', '<p>One.</p>\n<p>Two.</p>'],
    ['a single newline as a line break', 'One\nTwo', '<p>One<br/>\nTwo</p>'],
    ['an unordered list', '- red\n- blue', '<ul>\n<li>red</li>\n<li>blue</li>\n</ul>'],
    ['an ordered list', '1. first\n2. second', '<ol>\n<li>first</li>\n<li>second</li>\n</ol>'],
    ['inline code', 'Set `isDisabled`.', '<p>Set <code>isDisabled</code>.</p>'],
    ['a fenced code block', '```ts\nconst a = 1\n```', '<pre><code class="language-ts">'],
    ['emphasis', '**bold** and *soft*', '<strong>bold</strong> and <em>soft</em>'],
    [
      'a GFM table',
      '| Option | Cost |\n| --- | --- |\n| A | low |',
      '<table><thead><tr><th>Option</th><th>Cost</th></tr></thead><tbody><tr><td>A</td><td>low</td></tr></tbody></table>',
    ],
  ])('renders %s', (_name, source, expected) => {
    expect(block(source)).toContain(expected)
  })

  it('renders a link that opens beside the review', () => {
    expect(block('[spec](https://example.test/spec)')).toContain(
      '<a href="https://example.test/spec" target="_blank" rel="noreferrer noopener">spec</a>'
    )
  })

  it('turns a bare URL into a link', () => {
    expect(block('See https://example.test/pull/1')).toContain('href="https://example.test/pull/1"')
  })

  it('renders a plain string as the one paragraph it always was', () => {
    expect(block('Same data in both.')).toBe('<div class="md"><p>Same data in both.</p></div>')
  })

  it('keeps phrasing and drops block boxes when inline, so a heading stays valid', () => {
    const markup = inline('Pick `A` or **B**\n\n- one')
    expect(markup).toContain('Pick <code>A</code> or <strong>B</strong>')
    expect(markup).not.toMatch(/<(p|ul|li|div)\b/)
  })
})

describe('hostile markdown', () => {
  it.each([
    ['a script tag', '<script>alert(1)</script>', /<script\b/],
    ['an img onerror tag', '<img src=x onerror="alert(1)">', /<img\b/],
    ['a raw iframe', '<iframe src="https://example.test"></iframe>', /<iframe\b/],
  ])('renders %s as text, never as an element', (_name, source, element) => {
    const markup = block(source)
    expect(markup).not.toMatch(element)
    expect(markup).not.toContain('onerror="')
    expect(markup).toContain('&lt;')
  })

  it.each([
    ['javascript', '[click](javascript:alert(1))'],
    ['mixed-case javascript', '[click](JaVaScRiPt:alert(1))'],
    ['data', '[click](data:text/html,<b>hi</b>)'],
  ])('renders a %s: link inert, with no href', (_name, source) => {
    const markup = block(source)
    expect(markup).toContain('>click</a>')
    expect(markup).not.toContain('href=')
  })

  it('shows a markdown image as its alt text and loads nothing', () => {
    const markup = block('![the wall](https://example.test/wall.png)')
    expect(markup).not.toMatch(/<img\b/)
    expect(markup).toContain('the wall')
  })

  it.each([
    ['https://example.test', 'https://example.test'],
    ['mailto:owner@example.test', 'mailto:owner@example.test'],
    ['./notes/a.md', './notes/a.md'],
    ['#section-lead', '#section-lead'],
    ['notes/a:b', 'notes/a:b'],
    ['vbscript:x', undefined],
  ])('safeUrl(%s)', (url, expected) => {
    expect(
      safeUrl(url, 'href', { type: 'element', tagName: 'a', properties: {}, children: [] })
    ).toBe(expected)
  })
})

describe('round text on the page', () => {
  const markdownRound = (): Manifest => {
    const input = sectionedInput()
    input.context = 'Round intro.\n\n- first point'
    input.sections = [
      {
        id: 'lead',
        title: 'Which card leads the page?',
        context: '## Background\n\n| A | B |\n| --- | --- |\n| 1 | 2 |',
        questionIds: ['q1', 'q2'],
        variantKeys: ['A', 'B'],
      },
    ]
    return ManifestSchema.parse(input)
  }

  it('renders the round and section context as markdown', () => {
    const markup = renderToStaticMarkup(
      createElement(App, { manifest: markdownRound(), manifestSha256: SHA })
    )
    expect(markup).toContain('<li>first point</li>')
    expect(markup).toContain('<h2>Background</h2>')
    expect(markup).toContain('<table>')
    expect(markup).not.toContain('## Background')
  })

  it('renders a question prompt and its recommendation as markdown', () => {
    const m = markdownRound()
    const question = {
      id: 'q1',
      kind: 'pick-one' as const,
      prompt: 'Keep `Chip`?',
      options: ['A', 'B'],
      recommendation: {
        answer: 'A',
        rationale: 'Because:\n\n- cheaper',
        confidence: 0.8,
        by: 'agent',
      },
    }
    const markup = renderToStaticMarkup(
      createElement(QuestionBlock, {
        manifest: { ...m, recommendations: 'shown' },
        question,
        draft: initialState(m).draft.answers.q1,
        index: 0,
        active: false,
        follow: false,
        dispatch: () => {},
      })
    )
    expect(markup).toContain('Keep <code>Chip</code>?')
    expect(markup).toContain('<li>cheaper</li>')
  })
})
