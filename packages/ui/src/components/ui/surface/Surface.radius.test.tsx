import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Surface } from './Surface'
import { primitiveBorderRadius } from '../../../theme/tokens/primitives'

// jsdom has no NativeWind transform, so surface className as data-cls for class-name assertions.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const Base = actual.View as React.ComponentType<{
    className?: string
    dataSet?: Record<string, string>
  }>
  return {
    ...actual,
    View: function ViewWithCls(props: { className?: string }) {
      return <Base {...props} dataSet={{ cls: props.className ?? '' }} />
    },
  }
})

const classes = (testID: string) =>
  (screen.getByTestId(testID).getAttribute('data-cls') ?? '').split(/\s+/)

// TD-279: rounded-2xl moved to 24px; the owner kept Surface's corners at 16px.
describe('Surface corner radius', () => {
  it('draws the default corner and pressed wells at the 16px xl radius', () => {
    render(
      <Surface level="base">
        <Surface raise={1} testID="lifted" />
        <Surface pressed testID="well" />
      </Surface>
    )

    for (const testID of ['lifted', 'well']) {
      expect(classes(testID), testID).toContain('rounded-xl')
      expect(classes(testID), testID).not.toContain('rounded-2xl')
    }
    expect(primitiveBorderRadius.xl).toBe('16px')
  })

  it('leaves an absolute plane square', () => {
    render(<Surface level="base" testID="plane" />)

    expect(classes('plane').filter((c) => c.startsWith('rounded'))).toEqual([])
  })
})
