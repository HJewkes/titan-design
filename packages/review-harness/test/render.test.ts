import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from '../page/App.tsx'
import { ManifestSchema, type Manifest } from '../src/schema.ts'
import { SHA, manifest, sectioned, sectionedInput } from './fixtures.ts'

const html = (m: Manifest) =>
  renderToStaticMarkup(createElement(App, { manifest: m, manifestSha256: SHA }))

const orderOf = (markup: string, ...needles: string[]) => needles.map((n) => markup.indexOf(n))

describe('a round without sections', () => {
  const markup = html(manifest())

  it('renders the frames grid first, then the questions, with no section chrome', () => {
    const [variants, question, general] = orderOf(
      markup,
      'class="variants"',
      'data-testid="question-q1"',
      'data-testid="general"'
    )
    expect(variants).toBeGreaterThan(-1)
    expect(variants).toBeLessThan(question)
    expect(question).toBeLessThan(general)
    expect(markup).not.toContain('round-section')
    expect(markup).not.toContain('Other frames')
  })

  it('still lists every prompt in the header and every frame as a card', () => {
    expect(markup).toContain('Which one leads the page?')
    for (const key of ['A', 'B', 'C']) expect(markup).toContain(`data-testid="variant-${key}"`)
  })

  it('shows no per-frame question line, because no question owns a frame', () => {
    expect(markup).not.toContain('variant-question')
  })
})

describe('a sectioned round', () => {
  const markup = html(sectioned())

  it('puts the section question above the frames it is asked about', () => {
    const [section, question, variant] = orderOf(
      markup,
      'data-testid="section-lead"',
      'data-testid="question-q1"',
      'data-testid="variant-A"'
    )
    expect(section).toBeGreaterThan(-1)
    expect(section).toBeLessThan(question)
    expect(question).toBeLessThan(variant)
  })

  it('gathers unsectioned frames and questions into Other frames and Overall', () => {
    const [other, c, overall, q3] = orderOf(
      markup,
      'data-testid="other-frames"',
      'data-testid="variant-C"',
      'data-testid="overall"',
      'data-testid="question-q3"'
    )
    expect(other).toBeLessThan(c)
    expect(c).toBeLessThan(overall)
    expect(overall).toBeLessThan(q3)
  })

  it('tells each frame which question it belongs to', () => {
    expect(markup).toContain('Answers: Which one leads the page?')
  })

  it('links a see-also frame instead of rendering it twice', () => {
    const input = sectionedInput()
    input.sections = [
      { id: 'one', title: 'One', questionIds: ['q1'], variantKeys: ['A'] },
      { id: 'two', title: 'Two', questionIds: ['q2'], variantKeys: ['B'], seeAlso: ['A'] },
    ]
    const linked = html(ManifestSchema.parse(input))
    expect(linked).toContain('href="#variant-A"')
    expect(linked.match(/data-testid="variant-A"/g)).toHaveLength(1)
  })
})
