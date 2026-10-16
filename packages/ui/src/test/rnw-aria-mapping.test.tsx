import { render } from '@testing-library/react'
import { View } from 'react-native'

describe('react-native-web accessibility prop mapping', () => {
  it('writes accessibilityLabel and aria-label to the aria-label attribute', () => {
    const { getByTestId } = render(
      <>
        <View testID="legacy" accessibilityLabel="Legacy label" />
        <View testID="aria" aria-label="Aria label" />
      </>
    )

    expect(getByTestId('legacy')).toHaveAttribute('aria-label', 'Legacy label')
    expect(getByTestId('aria')).toHaveAttribute('aria-label', 'Aria label')
  })

  it('drops accessibilityState and accessibilityHint', () => {
    const { getByTestId } = render(
      <View
        testID="probe"
        accessibilityRole="button"
        accessibilityState={{ expanded: true, selected: true, checked: true }}
        accessibilityHint="Opens the menu"
      />
    )
    const names = getByTestId('probe').getAttributeNames()

    expect(names.filter((n) => /^aria-(expanded|selected|checked)$/.test(n))).toEqual([])
    expect(names.join(' ')).not.toMatch(/hint|state/i)
  })

  it('writes the direct aria-* props', () => {
    const { getByTestId } = render(
      <View testID="probe" role="button" aria-expanded aria-selected />
    )

    expect(getByTestId('probe')).toHaveAttribute('aria-expanded', 'true')
    expect(getByTestId('probe')).toHaveAttribute('aria-selected', 'true')
  })
})
