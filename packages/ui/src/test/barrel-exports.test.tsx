import { describe, it, expect, expectTypeOf } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { Card, CardInset, type CardInsetProps } from '../components/ui/card'
import type { ScatterProps, ScatterReferenceLine } from '../components/ui/charts/scatter'

// DEPRECATIONS.md and Card's docs send consumers to these names; each must be
// reachable from its family barrel, not only by a deep import.
describe('family barrels', () => {
  it('render a CardInset imported from the card barrel without axe violations', async () => {
    const { container } = render(
      <Card>
        <CardInset testID="well">
          <Text>Inset content</Text>
        </CardInset>
      </Card>
    )

    expect(screen.getByTestId('well')).toHaveTextContent('Inset content')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('expose the CardInset props type from the card barrel', () => {
    expectTypeOf<CardInsetProps>().toHaveProperty('className')
  })

  it('expose ScatterReferenceLine as the type of Scatter reference lines', () => {
    expectTypeOf<ScatterReferenceLine[] | undefined>().toEqualTypeOf<
      ScatterProps['referenceLines']
    >()
  })
})
