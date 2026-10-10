import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App, Form } from '../page/App.tsx'
import { ReviewScreen } from '../page/ReviewScreen.tsx'
import { initialState, pagesFor } from '../page/state.ts'
import { buildFeedback, emptyDraft } from '../src/feedback.ts'
import { ManifestSchema, type Manifest } from '@titan-design/review-schema'
import { SHA, manifest, pagedImageInput, sectioned, sectionedInput } from './fixtures.ts'

const html = (m: Manifest) =>
  renderToStaticMarkup(createElement(App, { manifest: m, manifestSha256: SHA }))

/** The form as it stands with `active` as the active stop. */
const formAt = (m: Manifest, active: number) =>
  renderToStaticMarkup(
    createElement(Form, {
      manifest: m,
      state: { ...initialState(m), active },
      dispatch: () => {},
      onHitTesting: () => {},
    })
  )

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

  it('shows only the first section, with the pager, until the human pages on', () => {
    expect(markup).toContain('Section 1 of 3: Which card leads the page?')
    expect(markup).not.toContain('data-testid="variant-C"')
    expect(markup).not.toContain('data-testid="general"')
  })

  it('pages unsectioned frames into Other frames, then questions into Overall', () => {
    const m = sectioned()
    const [, other, overall] = pagesFor(m)
    const otherPage = formAt(m, other.first)
    expect(otherPage).toContain('data-testid="other-frames"')
    expect(otherPage).toContain('data-testid="variant-C"')
    expect(otherPage).not.toContain('data-testid="variant-A"')
    const [heading, q3, general] = orderOf(
      formAt(m, overall.first),
      'data-testid="overall"',
      'data-testid="question-q3"',
      'data-testid="general"'
    )
    expect(heading).toBeGreaterThan(-1)
    expect(heading).toBeLessThan(q3)
    expect(q3).toBeLessThan(general)
  })

  it('asks the section question once, not again on every frame', () => {
    expect(markup).not.toContain('Answers:')
  })

  it('links a see-also frame on another page instead of rendering it twice', () => {
    const input = sectionedInput()
    input.sections = [
      { id: 'one', title: 'One', questionIds: ['q1'], variantKeys: ['A'] },
      { id: 'two', title: 'Two', questionIds: ['q2'], variantKeys: ['B'], seeAlso: ['A'] },
    ]
    const m = ManifestSchema.parse(input)
    const two = formAt(m, pagesFor(m)[1].first)
    expect(two).toContain('href="#variant-A"')
    expect(two).not.toContain('data-testid="variant-A"')
  })
})

describe.each(['other', 'overall'])('a section whose id is %s', (sectionId) => {
  const build = () => {
    const input = sectionedInput()
    input.sections = [
      { id: sectionId, title: 'Mine', questionIds: ['q1'], variantKeys: ['A'] },
      { id: 'two', title: 'Two', questionIds: ['q2'], variantKeys: ['B'] },
    ]
    return ManifestSchema.parse(input)
  }

  it('renders once on its own page, and Overall shows only on the last page', () => {
    const m = build()
    const pages = pagesFor(m)
    const first = formAt(m, pages[0].first)
    expect(first.match(/data-testid="variant-A"/g)).toHaveLength(1)
    expect(first).toContain(`data-testid="section-${sectionId}"`)
    expect(first).not.toContain('data-testid="overall"')
    expect(first).not.toContain('data-testid="other-frames"')
    const last = formAt(m, pages[pages.length - 1].first)
    expect(last).toContain('data-testid="overall"')
    expect(last).not.toContain(`data-testid="section-${sectionId}"`)
  })
})

describe('a context-only section between two normal sections', () => {
  const build = () => {
    const input = sectionedInput()
    input.sections = [
      { id: 'one', title: 'One', questionIds: ['q1'], variantKeys: ['A'] },
      {
        id: 'notes',
        title: 'Read this first',
        context: 'Background before the next batch.',
        questionIds: [],
        variantKeys: [],
        seeAlso: ['A'],
      },
      { id: 'two', title: 'Two', questionIds: ['q2'], variantKeys: ['B'] },
    ]
    return ManifestSchema.parse(input)
  }

  it('renders its title, context and see-also link on a page of its own', () => {
    const m = build()
    const pages = pagesFor(m)
    expect(pages.map((p) => p.id)).toEqual(['one', 'notes', 'two', '#other', '#overall'])
    const notes = formAt(m, pages[1].first)
    expect(notes).toContain('Read this first')
    expect(notes).toContain('Background before the next batch.')
    expect(notes).toContain('href="#variant-A"')
    expect(notes).not.toContain('data-testid="variant-B"')
    expect(notes).not.toContain('data-testid="overall"')
  })

  it('keeps Overall on the last page only and counts the extra page', () => {
    const m = build()
    const pages = pagesFor(m)
    expect(formAt(m, pages[1].first)).toContain('Section 2 of 5: Read this first')
    expect(formAt(m, pages[pages.length - 1].first)).toContain('data-testid="overall"')
  })
})

describe('a 60-frame sectioned image round', () => {
  const m = ManifestSchema.parse(pagedImageInput(60))
  const frames = (markup: string) => markup.match(/data-testid="variant-F\d+"/g) ?? []

  it('renders one 28-frame section at a time, never all 60 frames', () => {
    const pages = pagesFor(m)
    expect(pages.map((p) => p.id)).toEqual(['batch-1', 'batch-2', 'batch-3', '#overall'])
    expect(pages.map((p) => frames(formAt(m, p.first)).length)).toEqual([28, 28, 4, 0])
  })

  it('names the page the human is on and offers the section keys', () => {
    expect(formAt(m, pagesFor(m)[1].first)).toContain('Section 2 of 4: Batch 2')
    expect(html(m)).toContain('<kbd>[</kbd> <kbd>]</kbd> section')
  })
})

describe('section navigation at both ends of a page', () => {
  const m = ManifestSchema.parse(pagedImageInput(60))
  const pages = pagesFor(m)
  const between = (markup: string, open: string, close: string) =>
    markup.slice(markup.indexOf(open), markup.indexOf(close, markup.indexOf(open)))

  it('states the position inside the page header', () => {
    const head = between(html(m), 'class="page-head"', '</header>')
    expect(head).toContain('Section 1 of 4: Batch 1')
  })

  it.each(pages.map((p, i) => [i, p.first]))(
    'closes page %i with previous, next and its position, after the last frame',
    (i, first) => {
      const markup = formAt(m, first)
      const end = between(markup, 'data-testid="pager-end"', '</nav>')
      expect(end).toContain(`Section ${i + 1} of 4`)
      expect(end).toContain('Previous')
      expect(end).toContain('Next')
      const frames = [...markup.matchAll(/data-testid="variant-F\d+"/g)]
      const lastFrame = frames.length ? frames[frames.length - 1].index : -1
      expect(markup.indexOf('data-testid="pager-end"')).toBeGreaterThan(lastFrame)
    }
  )

  it('makes Next the primary action until the last page, then Review answers', () => {
    const next = /<button[^>]*class="primary"[^>]*>Next/
    const review = /<button[^>]*class="primary"[^>]*>Review answers/
    expect(formAt(m, pages[0].first)).toMatch(next)
    expect(formAt(m, pages[0].first)).not.toMatch(review)
    expect(formAt(m, pages[3].first)).not.toMatch(next)
    expect(formAt(m, pages[3].first)).toMatch(review)
  })

  it('marks only the current section in the section list as the current step', () => {
    const list = between(html(m), 'class="prompts sections"', '</ol>')
    const items = [...list.matchAll(/<li[^>]*>/g)].map(([tag]) => tag)
    expect(items).toHaveLength(pages.length)
    expect(items.filter((tag) => tag.includes('aria-current="step"'))).toEqual([items[0]])
  })

  it('adds no pager to a round without sections', () => {
    expect(html(manifest())).not.toContain('pager')
  })
})

describe('the final check with questions unanswered', () => {
  const screen = (unanswered: string[], sendErrors: string[] = []) => {
    const m = manifest()
    return renderToStaticMarkup(
      createElement(ReviewScreen, {
        manifest: m,
        feedback: buildFeedback(m, SHA, emptyDraft(m), new Date(), true),
        problems: [],
        sendErrors,
        unanswered,
        sending: false,
        dispatch: () => {},
        onSubmit: () => {},
      })
    )
  }

  it('counts them and offers an explicit partial send with no shortcut', () => {
    const markup = screen(['q2', 'q4'])
    expect(markup).toContain('2 of 4 questions are unanswered')
    expect(markup).toMatch(/data-testid="send"[^>]*>Send partial: 2 unanswered<\/button>/)
    expect(markup).toMatch(/<button[^>]*class="primary"[^>]*>Back/)
  })

  it('shows a failed send as an alert and leaves Send enabled to retry', () => {
    const markup = screen([], ['HTTP 500'])
    expect(markup).toMatch(/role="alert"[^>]*><li>HTTP 500<\/li>/)
    expect(markup).not.toMatch(/<button[^>]*disabled[^>]*data-testid="send"/)
  })

  it('marks pending rows, and shows an optional blank as skipped', () => {
    const markup = screen(['q2'])
    expect(markup).toMatch(/data-testid="answer-q2"[^>]*data-unanswered="true"/)
    expect(markup).toContain('(skipped)')
    expect(markup).toContain('Show only unanswered')
    expect(markup).toContain('Next unanswered')
    expect(markup).not.toContain('Previous unanswered')
  })

  it('keeps the plain send when every question is answered', () => {
    const markup = screen([])
    expect(markup).not.toContain('unanswered')
    expect(markup).toContain('Send to the agent <kbd>⌘ Enter</kbd>')
  })
})

describe('a round served without the contrast gate', () => {
  it('shows the override reason as a banner, and none when the gate passed', () => {
    const overridden = renderToStaticMarkup(
      createElement(App, {
        manifest: {
          ...manifest(),
          contrastOverride: { reason: 'fixture', problem: 'p', failures: [] },
        },
        manifestSha256: SHA,
      })
    )
    expect(overridden).toContain('Contrast was not gated for this round: fixture')
    expect(overridden.indexOf('contrast-override')).toBeLessThan(overridden.indexOf('page-head'))
    expect(html(manifest())).not.toContain('contrast-override')
  })
})
