import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { View } from 'react-native'
import { spacingClassesIn, spacingClassesOf, spacingClassesOn } from './spacing-resolver'

const CLASSES = 'p-1 -mt-2 flex-row'
const SOURCE = `function Probe() {
  return <View className="${CLASSES}" testID="probe" />
}`

describe('a negative spacing class resolves by magnitude on every read path', () => {
  it('reads -mt-2 from a source literal as mt-2', () => {
    expect(spacingClassesIn(SOURCE, 'Probe')).toEqual(['p-1', 'mt-2'])
    expect(spacingClassesOn(SOURCE, 'probe')).toEqual(['p-1', 'mt-2'])
  })

  it('reads -mt-2 from the render as mt-2', () => {
    render(<View className={CLASSES} testID="probe" />)

    expect(spacingClassesOf('probe')).toEqual(['p-1', 'mt-2'])
  })
})
