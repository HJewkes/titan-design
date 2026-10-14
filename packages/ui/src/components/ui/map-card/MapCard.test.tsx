import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Typography } from '../typography'
import { MapCard } from './MapCard'
import { mapCardFrame } from './map-card-motion'
import { MAP_CARD_KEEP_OUT, mapCardPlacement } from './map-card-placement'

const viewport = { width: 1280, height: 720 }
const size = { width: 320, height: 180 }

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  )
}

const boxOf = (el: HTMLElement) => {
  const px = (v: string) => Number.parseFloat(v)
  return { x: px(el.style.left), y: px(el.style.top), h: px(el.style.height) }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('mapCardPlacement', () => {
  // Mutation caught: the inverted flip condition (`<` for `>`) keeps this card on the right.
  it('flips the card left of an anchor near the right edge', () => {
    const placement = mapCardPlacement({ anchor: { x: 1180, y: 300 }, viewport, size })
    expect(placement.side).toBe('left')
    expect(placement.box.x + placement.box.width).toBeLessThan(1180)
  })

  // Mutation caught: a flip that always fires sends this card left too.
  it('keeps the card right of an anchor with room on the right', () => {
    const placement = mapCardPlacement({ anchor: { x: 400, y: 300 }, viewport, size })
    expect(placement.side).toBe('right')
    expect(placement.box.x).toBeGreaterThan(400)
  })

  // Mutation caught: clamping to the viewport bottom instead of the keep-out lets the box into the captions.
  it('keeps the card above the 83% caption keep-out for an anchor inside it', () => {
    const placement = mapCardPlacement({ anchor: { x: 400, y: 690 }, viewport, size })
    expect(placement.box.y + placement.box.height).toBeLessThanOrEqual(
      MAP_CARD_KEEP_OUT * viewport.height
    )
  })

  // Mutation caught: a leader that ends at the box's far edge would cross the card.
  it('ends the leader on the near edge of the card', () => {
    const right = mapCardPlacement({ anchor: { x: 400, y: 300 }, viewport, size })
    const left = mapCardPlacement({ anchor: { x: 1180, y: 300 }, viewport, size })
    expect(right.leader.to.x).toBe(right.box.x)
    expect(left.leader.to.x).toBe(left.box.x + left.box.width)
  })

  // Mutation caught: ignoring `side` lets auto placement override an explicit choice.
  it('honours an explicit side', () => {
    const placement = mapCardPlacement({ anchor: { x: 400, y: 300 }, viewport, size, side: 'left' })
    expect(placement.side).toBe('left')
  })
})

describe('mapCardFrame', () => {
  // Mutation caught: fading the card in from enter 0 shows it before its leader reaches it.
  it('draws the leader before the card appears', () => {
    const early = mapCardFrame(0.2, 0)
    expect(early.leaderDraw).toBeGreaterThan(0)
    expect(early.cardOpacity).toBe(0)
  })

  it('is fully in at enter 1 and gone at exit 1', () => {
    expect(mapCardFrame(1, 0)).toMatchObject({ leaderDraw: 1, cardOpacity: 1, cardOffset: 0 })
    expect(mapCardFrame(1, 1)).toMatchObject({ leaderOpacity: 0, cardOpacity: 0 })
  })
})

describe('MapCard', () => {
  it('renders its title and content', () => {
    render(
      <MapCard anchor={{ x: 400, y: 300 }} viewport={viewport} title="Router">
        <Typography>Content</Typography>
      </MapCard>
    )
    expect(screen.getByText('Router')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  // Mutation caught: the render ignoring the placement's keep-out clamp.
  it('renders its box above the keep-out', () => {
    render(
      <MapCard anchor={{ x: 400, y: 700 }} viewport={viewport}>
        <Typography>Content</Typography>
      </MapCard>
    )
    const { y, h } = boxOf(screen.getByTestId('map-card-box'))
    expect(y + h).toBeLessThanOrEqual(MAP_CARD_KEEP_OUT * viewport.height)
  })

  it('hides from assistive tech before it enters', () => {
    render(
      <MapCard anchor={{ x: 400, y: 300 }} viewport={viewport} enter={0}>
        <Typography>Content</Typography>
      </MapCard>
    )
    expect(screen.getByTestId('map-card-box')).toHaveAttribute('aria-hidden', 'true')
  })

  // Mutation caught: running the entrance under reduced motion leaves a half-faded card.
  it('shows the final card at once with reduced motion', () => {
    mockReducedMotion(true)
    render(
      <MapCard anchor={{ x: 400, y: 300 }} viewport={viewport} enter={0.1}>
        <Typography>Content</Typography>
      </MapCard>
    )
    expect(screen.getByTestId('map-card-box')).toHaveStyle({ opacity: '1' })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MapCard
        anchor={{ x: 400, y: 300 }}
        viewport={viewport}
        title="Router"
        accessibilityLabel="Router file"
      >
        <Typography>Content</Typography>
      </MapCard>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
