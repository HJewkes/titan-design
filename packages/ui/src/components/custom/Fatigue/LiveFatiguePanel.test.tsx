import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveFatiguePanel } from './LiveFatiguePanel'
import { Surface } from '../../ui/surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { buildMockPanelState } from './fatigue-mock'

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
