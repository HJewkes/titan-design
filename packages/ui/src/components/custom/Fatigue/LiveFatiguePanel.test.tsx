import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveFatiguePanel } from './LiveFatiguePanel'
import { Surface } from '../../ui/surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { buildMockPanelState } from './fatigue-mock'
import { resolveAll, siblingSource, spacingClassesIn } from '../../../test/spacing-resolver'
import { PANEL_BREAKPOINTS, CARD_WIDTH_BASE, panelLayout } from './panel-layout'

const { model, velocity } = buildMockPanelState(3)

const dark = getSemanticColors('dark')
const light = getSemanticColors('light')

describe('LiveFatiguePanel', () => {
  it('composes the aura frame, the velocity hero and the fatigue card', () => {
    render(<LiveFatiguePanel model={model} velocity={velocity} />)
    expect(screen.getByTestId('live-fatigue-panel')).toBeInTheDocument()
    expect(screen.getByTestId('live-fatigue-card')).toBeInTheDocument()
    expect(screen.getByText('VELOCITY · this set')).toBeInTheDocument()
  })

  // The wall display is the only surface this ships on today, so a colour move here is a
  // regression, not an improvement. Outside any Surface the context defaults to dark.
  it('resolves dark on-surface colours with no enclosing Surface', () => {
    render(<LiveFatiguePanel model={model} velocity={velocity} />)
    expect(screen.getByTestId('live-fatigue-eyebrow')).toHaveStyle({
      color: dark['text-tertiary'],
    })
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({
      borderTopColor: dark['hairline-default'],
      backgroundColor: dark['surface-base'],
    })
  })

  it('resolves the same dark colours inside a dark Surface', () => {
    render(
      <Surface level="background" theme="dark">
        <LiveFatiguePanel model={model} velocity={velocity} />
      </Surface>
    )
    expect(screen.getByTestId('live-fatigue-eyebrow')).toHaveStyle({
      color: dark['text-tertiary'],
    })
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({
      borderTopColor: dark['hairline-default'],
      backgroundColor: dark['surface-base'],
    })
  })

  // The point of TD-03.59: a light surface used to render dark-pinned text on a light plane.
  it('follows a light Surface instead of staying pinned to dark', () => {
    render(
      <Surface level="background" theme="light">
        <LiveFatiguePanel model={model} velocity={velocity} />
      </Surface>
    )
    expect(screen.getByTestId('live-fatigue-eyebrow')).toHaveStyle({
      color: light['text-tertiary'],
    })
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({
      borderTopColor: light['hairline-default'],
      backgroundColor: light['surface-base'],
    })
    expect(light['text-tertiary']).not.toBe(dark['text-tertiary'])
  })
})

// `onLayout` never fires under jsdom (SIZE-D01 / gotcha 6), so the panel takes an explicit
// `containerWidth` override and these drive the live wiring through it. The breakpoint
// arithmetic itself is covered in `panel-layout.test.ts`.
describe('LiveFatiguePanel responsiveness (TD-03.58)', () => {
  it('renders the shipped row geometry at the md and lg tiers', () => {
    for (const width of [1000, 1440]) {
      const { unmount } = render(
        <LiveFatiguePanel model={model} velocity={velocity} containerWidth={width} />
      )
      expect(screen.getByTestId('live-fatigue-body')).toHaveStyle({
        flexDirection: 'row',
        padding: '24px 24px 24px 24px',
      })
      expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({
        width: `${CARD_WIDTH_BASE}px`,
      })
      unmount()
    }
  })

  it('stacks the card under the hero below the md edge', () => {
    render(
      <LiveFatiguePanel
        model={model}
        velocity={velocity}
        containerWidth={PANEL_BREAKPOINTS.md - 1}
      />
    )
    expect(screen.getByTestId('live-fatigue-body')).toHaveStyle({ flexDirection: 'column' })
  })

  it('gives the stacked card the full content width instead of the 318 column', () => {
    const width = 720
    render(<LiveFatiguePanel model={model} velocity={velocity} containerWidth={width} />)
    const { padding } = panelLayout(width)
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({
      width: `${width - padding * 2}px`,
    })
  })

  it('expands the card column at wall width', () => {
    render(<LiveFatiguePanel model={model} velocity={velocity} containerWidth={1920} />)
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({
      width: `${panelLayout(1920).cardWidth}px`,
    })
    expect(panelLayout(1920).cardWidth).toBeGreaterThan(CARD_WIDTH_BASE)
  })

  it('still honours an explicit cardWidth over the tier', () => {
    render(
      <LiveFatiguePanel model={model} velocity={velocity} containerWidth={1920} cardWidth={280} />
    )
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({ width: '280px' })
  })

  // TD-03.60 through the rendered tree, not just the pure split.
  it('moves the rendered card height when bodyHeight changes', () => {
    const { rerender } = render(
      <LiveFatiguePanel model={model} velocity={velocity} containerWidth={1440} bodyHeight={400} />
    )
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({ height: '400px' })
    rerender(
      <LiveFatiguePanel model={model} velocity={velocity} containerWidth={1440} bodyHeight={700} />
    )
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({ height: '700px' })
  })
})

/**
 * The hero column's spacing, pinned (AW-142 wave three).
 *
 * The eyebrow sits above the velocity plot on the stack ramp's 8px rung. The body's own
 * padding and gap stay computed — they come from `panelLayout` per tier, which is the one
 * place in the repo where spacing is a function of viewport.
 */
describe('LiveFatiguePanel geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'LiveFatiguePanel.tsx')

  it('spaces the eyebrow from the plot by gap-stack-md', () => {
    expect(spacingClassesIn(source, 'LiveFatiguePanel')).toEqual(['gap-stack-md'])
    expect(resolveAll(['gap-stack-md'])).toEqual(['8px'])
  })

  it('keeps the body inset responsive rather than fixed', () => {
    expect(source).toContain('padding: layout.padding')
    expect(source).toContain('gap: layout.gap')
  })
})
