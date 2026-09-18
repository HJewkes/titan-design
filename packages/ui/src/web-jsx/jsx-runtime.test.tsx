import { render, screen } from '@testing-library/react'
import { Text, type TextProps } from 'react-native'
import { cn } from '../utils/cn'
import { jsx } from './jsx-runtime'

const BODY_VARIANT = 'font-body text-base font-normal leading-normal'
const HERO_OVERRIDE = 'font-heading font-bold text-[40px] leading-[44px]'

// Shaped like Typography: merges its variant with the caller's className, spreads the rest.
function VariantText({ className, ...props }: TextProps & { className?: string }) {
  return jsx(Text, { className: cn(BODY_VARIANT, className), ...props })
}

function classesOf(testID: string): string[] {
  return screen.getByTestId(testID).className.split(/\s+/)
}

describe('dist web JSX runtime', () => {
  it('lets a titan caller override a variant through className on a titan component', () => {
    render(jsx(VariantText, { className: HERO_OVERRIDE, testID: 'hero', children: '+16 lb' }))

    const classes = classesOf('hero')
    expect(classes).toEqual(
      expect.arrayContaining(['font-heading', 'font-bold', 'text-[40px]', 'leading-[44px]'])
    )
    expect(classes).not.toContain('font-body')
    expect(classes).not.toContain('text-base')
    expect(classes).not.toContain('font-normal')
    expect(classes).not.toContain('leading-normal')
  })

  it('keeps the caller inline style beside the merged classes', () => {
    render(
      jsx(VariantText, { className: 'font-bold', style: { color: 'rgb(1, 2, 3)' }, testID: 'hero' })
    )

    const hero = screen.getByTestId('hero')
    expect(hero).toHaveStyle({ color: 'rgb(1, 2, 3)' })
    expect(classesOf('hero')).toContain('font-bold')
    expect(classesOf('hero')).not.toContain('font-normal')
  })

  it('keeps variant classes the caller did not override', () => {
    render(jsx(VariantText, { className: 'text-[40px]', testID: 'hero' }))

    expect(classesOf('hero')).toEqual(
      expect.arrayContaining(['font-body', 'font-normal', 'text-[40px]'])
    )
  })

  it('passes a primitive its own className and inline style unchanged', () => {
    render(jsx(Text, { className: 'text-base', style: { color: 'rgb(1, 2, 3)' }, testID: 'plain' }))

    expect(classesOf('plain')).toContain('text-base')
    expect(screen.getByTestId('plain')).toHaveStyle({ color: 'rgb(1, 2, 3)' })
  })
})
