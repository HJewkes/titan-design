import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, ButtonText, type ButtonColor, type ButtonVariant } from './Button'
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
    Pressable: function PressableWithCls(props: { className?: string }) {
      return <Base {...props} dataSet={{ cls: props.className ?? '' }} />
    },
  }
})

const VARIANTS: ButtonVariant[] = ['solid', 'outline', 'ghost']
const COLORS: ButtonColor[] = ['primary', 'secondary', 'success', 'error', 'warning', 'info']

function classesOf(props: React.ComponentProps<typeof Button>) {
  render(
    <Button {...props}>
      <ButtonText>Save</ButtonText>
    </Button>
  )
  return (screen.getByRole('button').getAttribute('data-cls') ?? '').split(/\s+/)
}

const scales = (classes: string[]) => classes.filter((c) => c.includes('scale'))

afterEach(() => vi.unstubAllGlobals())

// TD-1012: a one-percent press over 100 ms, the same on every variant and colour.
describe('Button press', () => {
  it.each(VARIANTS.flatMap((variant) => COLORS.map((color) => [variant, color] as const)))(
    '%s %s presses with one 0.99 scale over 100 ms',
    (variant, color) => {
      const classes = classesOf({ variant, color })
      expect(scales(classes)).toEqual(['active:scale-[0.99]'])
      expect(classes).toContain('duration-100')
    }
  )

  it('an icon button presses the same way', () => {
    expect(scales(classesOf({ isIconButton: true }))).toEqual(['active:scale-[0.99]'])
  })

  it('a link does not move', () => {
    expect(scales(classesOf({ variant: 'link' }))).toEqual([])
  })

  it('a disabled or loading button does not move', () => {
    expect(scales(classesOf({ isDisabled: true }))).toEqual([])
  })

  it('reduced motion keeps the colour step and drops the scale', () => {
    stubReducedMotion(true)
    const classes = classesOf({ variant: 'solid', color: 'primary' })
    expect(scales(classes)).toEqual([])
    expect(classes).toContain('active:bg-brand-primary-active')
  })
})
