import { describe, expect, it } from 'vitest'
import { View } from 'react-native'

import { expectBoundedMount } from './scale'

const ITEMS = Array.from({ length: 1000 }, (_, i) => i)
const ROW = '[data-testid="row"]'

function Row({ id }: { id: number }) {
  return <View testID="row" accessibilityLabel={`item ${id}`} />
}

function UnwindowedList() {
  return (
    <View>
      {ITEMS.map((id) => (
        <Row key={id} id={id} />
      ))}
    </View>
  )
}

function WindowedList({ first = 0, size = 20 }: { first?: number; size?: number }) {
  return (
    <View>
      {ITEMS.slice(first, first + size).map((id) => (
        <Row key={id} id={id} />
      ))}
    </View>
  )
}

describe('expectBoundedMount', () => {
  it('fails an unwindowed 1000-item list against a bound of 40', () => {
    expect(() =>
      expectBoundedMount({ render: () => <UnwindowedList />, selector: ROW, max: 40 })
    ).toThrow(/mounted 1000/)
  })

  it('passes a windowed list and returns how many rows mounted', () => {
    const mounted = expectBoundedMount({
      render: () => <WindowedList />,
      selector: ROW,
      max: 40,
    })

    expect(mounted).toBe(20)
  })

  it('passes a windowed list scrolled to the end of the data', () => {
    expect(() =>
      expectBoundedMount({ render: () => <WindowedList first={990} />, selector: ROW, max: 40 })
    ).not.toThrow()
  })

  it('fails when the selector matches nothing rather than passing vacuously', () => {
    expect(() =>
      expectBoundedMount({ render: () => <UnwindowedList />, selector: '.no-such-row', max: 40 })
    ).toThrow(/matched nothing/)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('rejects a bound of %s', (max) => {
    expect(() =>
      expectBoundedMount({ render: () => <WindowedList />, selector: ROW, max })
    ).toThrow(/max must be a finite number/)
  })
})
