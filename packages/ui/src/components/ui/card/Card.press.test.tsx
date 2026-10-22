import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Text, TextInput } from 'react-native'
import { Card } from './Card'
import { stubReducedMotion } from '../../../test/reduced-motion-stub'

// jsdom has no NativeWind transform, so surface className as data-cls for class-name assertions.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const Base = actual.Pressable as unknown as React.ComponentType<{
    className?: string
    dataSet?: Record<string, string>
  }>
  return {
    ...actual,
    Pressable: function PressableWithCls(props: {
      className?: string
      dataSet?: Record<string, string>
    }) {
      return <Base {...props} dataSet={{ ...props.dataSet, cls: props.className ?? '' }} />
    },
  }
})

const MOUSE = { button: 0, detail: 1 }
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

function renderCardWithField() {
  render(
    <Card onPress={() => {}} accessibilityLabel="Plan card">
      <Text>Synthetic plan</Text>
      <TextInput accessibilityLabel="Plan name" />
      <input type="radio" aria-label="Pick plan" />
    </Card>
  )
  return screen.getByRole('button', { name: 'Plan card' })
}

const classes = (el: HTMLElement) => (el.getAttribute('data-cls') ?? '').split(/\s+/)

afterEach(() => vi.unstubAllGlobals())

// TD-1012: :active holds on every ancestor, so a card pressed through its own form
// control scaled whole. The card's press is its own state, not CSS :active.
describe('Card press', () => {
  it('a press on the card itself sets data-pressed and the press scale', async () => {
    const card = renderCardWithField()
    fireEvent.mouseDown(screen.getByText('Synthetic plan'), MOUSE)
    await waitFor(() => expect(card).toHaveAttribute('data-pressed', 'true'))
    expect(classes(card)).toContain('scale-[0.99]')
  })

  it('a pressed child input does not set the card pressed state', async () => {
    const card = renderCardWithField()
    fireEvent.mouseDown(screen.getByLabelText('Plan name'), MOUSE)
    await settle()
    expect(card).not.toHaveAttribute('data-pressed')
    expect(classes(card)).not.toContain('scale-[0.99]')
  })

  it('a pressed child radio does not set the card pressed state', async () => {
    const card = renderCardWithField()
    fireEvent.mouseDown(screen.getByLabelText('Pick plan'), MOUSE)
    await settle()
    expect(card).not.toHaveAttribute('data-pressed')
  })

  it('never carries a CSS :active press, which a descendant would trigger', () => {
    const card = renderCardWithField()
    expect(classes(card).filter((c) => c.startsWith('active:'))).toEqual([])
  })

  it('reduced motion keeps the pressed state but drops the scale and hover lift', async () => {
    stubReducedMotion(true)
    const card = renderCardWithField()
    fireEvent.mouseDown(screen.getByText('Synthetic plan'), MOUSE)
    await waitFor(() => expect(card).toHaveAttribute('data-pressed', 'true'))
    expect(classes(card)).not.toContain('scale-[0.99]')
    expect(classes(card)).not.toContain('web:hover:-translate-y-0.5')
  })
})
