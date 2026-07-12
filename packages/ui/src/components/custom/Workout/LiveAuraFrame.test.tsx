import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { LiveAuraFrame, liveAuraColor, type LiveAuraCategory } from './LiveAuraFrame'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'

const t = getSemanticColors('dark')

describe('LiveAuraFrame', () => {
  it('renders the frame and passes children through', () => {
    render(
      <LiveAuraFrame category="productive">
        <Text>Cable Row</Text>
      </LiveAuraFrame>
    )
    expect(screen.getByTestId('live-aura-frame')).toBeInTheDocument()
    expect(screen.getByText('Cable Row')).toBeInTheDocument()
  })

  it('sits on the charcoal base surface', () => {
    render(<LiveAuraFrame category="productive" />)
    expect(screen.getByTestId('live-aura-frame')).toHaveStyle({
      backgroundColor: t['background-base'],
    })
  })

  it('renders no flood overlay for the productive (quiet) category', () => {
    render(<LiveAuraFrame category="productive" />)
    expect(screen.queryByTestId('live-aura-flood')).not.toBeInTheDocument()
  })

  const floods: Array<{
    category: LiveAuraCategory
    token: 'status-warning' | 'status-error'
    opacity: number
  }> = [
    { category: 'threshold', token: 'status-warning', opacity: 0.12 },
    { category: 'stop', token: 'status-error', opacity: 0.18 },
  ]

  floods.forEach(({ category, token, opacity }) => {
    it(`floods ${category} with the ${token} token`, () => {
      render(<LiveAuraFrame category={category} />)
      expect(screen.getByTestId('live-aura-flood')).toHaveStyle({
        backgroundColor: alpha(t[token], opacity),
      })
    })
  })

  it('exposes the resolved flood color via liveAuraColor', () => {
    expect(liveAuraColor('productive')).toBeNull()
    expect(liveAuraColor('threshold')).toBe(t['status-warning'])
    expect(liveAuraColor('stop')).toBe(t['status-error'])
  })

  it('renders the flood for stop when pulse is disabled', () => {
    render(<LiveAuraFrame category="stop" pulse={false} />)
    expect(screen.getByTestId('live-aura-flood')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <LiveAuraFrame category="stop">
        <Text>Set 4/5</Text>
      </LiveAuraFrame>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
