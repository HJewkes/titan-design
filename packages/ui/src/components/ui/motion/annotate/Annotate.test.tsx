import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Typography } from '../../typography'
import { Annotate } from './Annotate'
import { AnnotationMark } from './AnnotationMark'
import { ANNOTATION_DEFAULTS, type AnnotationKind } from './annotation-geometry'

const KINDS = Object.keys(ANNOTATION_DEFAULTS) as AnnotationKind[]
const box = { x: 10, y: 20, w: 120, h: 30 }

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const paths = (container: HTMLElement) => Array.from(container.querySelectorAll('path'))

describe('AnnotationMark', () => {
  // Mutation caught: a kind missing from the switch, which renders an empty layer.
  it.each(KINDS)('draws a %s', (kind) => {
    const { container } = render(<AnnotationMark kind={kind} box={box} />)
    expect(paths(container).length).toBeGreaterThan(0)
  })

  // Mutation caught: the seed default derived from Math.random() or the render count.
  it('renders identical path data on every render', () => {
    const first = render(<AnnotationMark kind="circle" box={box} seed="hero" />)
    const firstHtml = first.container.innerHTML
    first.rerender(<AnnotationMark kind="circle" box={box} seed="hero" progress={1} />)
    const second = render(<AnnotationMark kind="circle" box={box} seed="hero" />)
    expect(first.container.innerHTML).toBe(firstHtml)
    expect(second.container.innerHTML).toBe(firstHtml)
  })

  // Mutation caught: a seed that never reaches the stroke geometry.
  it('draws another wobble for another seed', () => {
    const d = (seed: string) =>
      paths(
        render(<AnnotationMark kind="circle" box={box} seed={seed} />).container
      )[0]?.getAttribute('d')
    expect(d('a')).not.toBe(d('b'))
  })

  // Mutation caught: drawing the box in world space rather than at the anchor box.
  it('places its layer at the anchor box', () => {
    const { container } = render(<AnnotationMark kind="box" box={box} />)
    expect(container.querySelector('svg')).toHaveStyle({ left: '10px', top: '20px' })
  })

  // Mutation caught: a reversed dash offset, which shows the mark full at progress 0.
  it('draws nothing at progress 0 and all of it at 1', () => {
    const { container, rerender } = render(
      <AnnotationMark kind="underline" box={box} progress={0} />
    )
    expect(paths(container)).toHaveLength(0)
    rerender(<AnnotationMark kind="underline" box={box} progress={1} />)
    for (const path of paths(container)) expect(path.style.strokeDashoffset).toBe('0')
  })

  // Mutation caught: drawing every stroke at once instead of one after another.
  it('finishes the first pass before starting the second', () => {
    const { container } = render(<AnnotationMark kind="underline" box={box} progress={0.4} />)
    const [first] = paths(container)
    expect(paths(container)).toHaveLength(1)
    expect(Number(first?.style.strokeDashoffset)).toBeGreaterThan(0)
  })

  // Mutation caught: ignoring reduced motion, so the first frame is not the final frame (F16).
  it('shows the finished mark under reduced motion', () => {
    mockReducedMotion(true)
    const { container } = render(<AnnotationMark kind="underline" box={box} progress={0} />)
    expect(paths(container)).toHaveLength(2)
    for (const path of paths(container)) expect(path.style.strokeDashoffset).toBe('0')
  })

  // Mutation caught: a pen colour for a strike that is not the error token.
  it('strikes in the error colour and marks in the muted step', () => {
    const strike = render(<AnnotationMark kind="strike-through" box={box} />)
    expect(paths(strike.container)[0]?.style.stroke).toBe('var(--color-status-error)')
    const marker = render(<AnnotationMark kind="highlight" box={box} />)
    expect(paths(marker.container)[0]?.style.stroke).toBe('var(--color-brand-primary-muted)')
  })

  // Mutation caught: dropping aria-hidden, or giving the layer role="img" with no name (svg-img-alt).
  it('has no accessibility violations', async () => {
    const { container } = render(<AnnotationMark kind="circle" box={box} />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Annotate', () => {
  // Mutation caught: rendering the mark in place of the children.
  it('renders its children and the mark round them', () => {
    const { container } = render(
      <Annotate kind="box" box={{ x: 0, y: 0, w: 80, h: 24 }}>
        <Typography>deterministic</Typography>
      </Annotate>
    )
    expect(screen.getByText('deterministic')).toBeInTheDocument()
    expect(container.querySelector('svg[data-kind="box"]')).not.toBeNull()
  })

  // Mutation caught: painting the highlight after the children, so it covers the text.
  it('paints a highlight behind the children and other marks over them', () => {
    const order = (kind: AnnotationKind) => {
      render(
        <Annotate kind={kind} box={{ x: 0, y: 0, w: 80, h: 24 }} testID={kind}>
          <Typography>word</Typography>
        </Annotate>
      )
      return Array.from(screen.getByTestId(kind).children, (child) => child.tagName.toLowerCase())
    }
    expect(order('highlight')[0]).toBe('svg')
    expect(order('underline')[0]).not.toBe('svg')
  })

  // Mutation caught: drawing before layout with a zero box, which paints a stray dot.
  it('draws no mark until the children have a size', () => {
    const unmeasured = render(
      <Annotate kind="circle">
        <Typography>word</Typography>
      </Annotate>
    )
    expect(unmeasured.container.querySelector('svg')).toBeNull()
    const empty = render(
      <Annotate kind="circle" box={{ x: 0, y: 0, w: 0, h: 0 }}>
        <Typography>word</Typography>
      </Annotate>
    )
    expect(empty.container.querySelector('svg')).toBeNull()
  })

  // Mutation caught: giving the layer role="img" with no name (axe svg-img-alt).
  it('has no accessibility violations', async () => {
    const { container } = render(
      <Annotate kind="highlight" box={{ x: 0, y: 0, w: 80, h: 24 }}>
        <Typography>word</Typography>
      </Annotate>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
