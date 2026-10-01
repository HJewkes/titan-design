import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'

import { resolveAll, spacingClassesOf } from '../../../test/spacing-resolver'
import { StatCard, StatCardHeader, type StatCardProps } from './StatCard'

function renderCard(props: Partial<StatCardProps> = {}) {
  return render(
    <StatCard
      testID="card"
      header={<StatCardHeader title="Bodyweight" trailing={<Text>On track</Text>} />}
      figure={<Text>196.8 lb</Text>}
      caption={<Text>Rate: -0.6%/wk</Text>}
      body={<Text>Track</Text>}
      {...props}
    />
  )
}

function follows(earlier: HTMLElement, later: HTMLElement): boolean {
  return Boolean(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('StatCard', () => {
  it('renders header, figure and body in that order', () => {
    renderCard()
    const header = screen.getByTestId('card-stat-card-header')
    const figure = screen.getByTestId('card-stat-card-figure')
    const body = screen.getByTestId('card-stat-card-body')
    expect(header).toHaveTextContent('Bodyweight')
    expect(figure).toHaveTextContent('196.8 lb')
    expect(body).toHaveTextContent('Track')
    expect(follows(header, figure)).toBe(true)
    expect(follows(figure, body)).toBe(true)
  })

  it('raises the header over the figure row, and both over the body', () => {
    renderCard()
    expect(screen.getByTestId('card-stat-card-header')).toHaveStyle({ zIndex: '20' })
    expect(screen.getByTestId('card-stat-card-figure')).toHaveStyle({ zIndex: '10' })
    expect(screen.getByTestId('card-stat-card-header').parentElement).toHaveStyle({
      zIndex: '10',
    })
  })

  it('pins the body to the bottom of the card', () => {
    renderCard()
    expect(screen.getByTestId('card-stat-card-body')).toHaveStyle({ marginTop: 'auto' })
  })

  it('lets a tip escape the card', () => {
    renderCard()
    expect(screen.getByTestId('card').getAttribute('style')).toContain('overflow-y: visible')
  })

  describe('caption placement', () => {
    it('puts the caption on the figure row by default', () => {
      renderCard()
      const row = screen.getByTestId('card-stat-card-figure')
      expect(row).toHaveTextContent('Rate: -0.6%/wk')
      expect(row).toHaveStyle({ flexDirection: 'row', flexWrap: 'wrap' })
    })

    it('stacks the caption under the figure when placed below', () => {
      renderCard({ captionPlacement: 'below' })
      const column = screen.getByTestId('card-stat-card-figure')
      expect(column).toHaveTextContent('Rate: -0.6%/wk')
      expect(column).not.toHaveStyle({ flexDirection: 'row' })
      expect(follows(screen.getByText('196.8 lb'), screen.getByText('Rate: -0.6%/wk'))).toBe(true)
    })
  })

  describe('inset', () => {
    it('defaults to the large inset', () => {
      renderCard()
      expect(spacingClassesOf('card')).toEqual(['p-inset-lg'])
      expect(resolveAll(spacingClassesOf('card'))).toEqual(['16px'])
    })

    it('takes the medium inset', () => {
      renderCard({ inset: 'md' })
      expect(spacingClassesOf('card')).toEqual(['p-inset-md'])
      expect(resolveAll(spacingClassesOf('card'))).toEqual(['12px'])
    })
  })

  it('follows the header with the body when there is no figure', () => {
    renderCard({ figure: undefined, caption: undefined })
    expect(screen.queryByTestId('card-stat-card-figure')).toBeNull()
    expect(
      follows(
        screen.getByTestId('card-stat-card-header'),
        screen.getByTestId('card-stat-card-body')
      )
    ).toBe(true)
  })

  it('draws no body wrapper without a body', () => {
    renderCard({ body: undefined })
    expect(screen.queryByTestId('card-stat-card-body')).toBeNull()
  })

  it('names its parts from a default prefix without a testID', () => {
    renderCard({ testID: undefined })
    expect(screen.getByTestId('stat-card-header')).toBeInTheDocument()
  })

  it('shows the card skeleton instead of its slots while loading', () => {
    renderCard({ isLoading: true })
    expect(screen.queryByText('196.8 lb')).toBeNull()
    expect(screen.queryByTestId('card-stat-card-header')).toBeNull()
    expect(spacingClassesOf('card')).toEqual([])
  })

  it('has no accessibility violations', async () => {
    const { container } = renderCard()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('StatCardHeader', () => {
  it('renders a string title as the overline and a node as given', () => {
    const { rerender } = render(<StatCardHeader title="Sessions" testID="h" />)
    expect(screen.getByTestId('h')).toHaveTextContent('Sessions')
    rerender(<StatCardHeader title={<Text accessibilityRole="header">Bench</Text>} testID="h" />)
    expect(screen.getByRole('heading', { name: 'Bench' })).toBeInTheDocument()
  })

  it('places the trailing marks after the title', () => {
    render(<StatCardHeader title="Bodyweight" trailing={<Text>Behind</Text>} />)
    expect(follows(screen.getByText('Bodyweight'), screen.getByText('Behind'))).toBe(true)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <StatCardHeader title="Bodyweight" trailing={<Text>On track</Text>} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
