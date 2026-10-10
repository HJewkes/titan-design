import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Input } from './Input'
import { capturedByNode } from '../../../test/classname-capture'
import { resolveAll, siblingSource, sizeClasses } from '../../../test/spacing-resolver'

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('displays label when provided', () => {
    render(<Input label="Email" placeholder="Enter email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('displays required indicator when isRequired', () => {
    render(<Input label="Email" isRequired />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('displays helper text when provided', () => {
    render(<Input helperText="This is helper text" />)
    expect(screen.getByText('This is helper text')).toBeInTheDocument()
  })

  it('displays error message when isInvalid', () => {
    render(<Input isInvalid errorMessage="Invalid input" helperText="This should not show" />)
    expect(screen.getByText('Invalid input')).toBeInTheDocument()
    expect(screen.queryByText('This should not show')).not.toBeInTheDocument()
  })

  it('handles text changes', () => {
    const onChangeText = vi.fn()
    render(<Input onChangeText={onChangeText} placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here')
    // react-native-web renders as HTML input, use change event
    fireEvent.change(input, { target: { value: 'Hello' } })

    expect(onChangeText).toHaveBeenCalled()
  })

  it('respects isDisabled prop', () => {
    render(<Input isDisabled placeholder="Disabled" />)
    const input = screen.getByPlaceholderText('Disabled')
    // react-native-web renders isDisabled as readonly, not disabled
    expect(input).toHaveAttribute('readonly')
  })

  it('respects isReadOnly prop', () => {
    render(<Input isReadOnly defaultValue="Read only" />)
    const input = screen.getByDisplayValue('Read only')
    expect(input).toHaveAttribute('readonly')
  })

  it('draws the focus ring on the rounded field box, not the bare text element', () => {
    render(<Input placeholder="Search" />)
    const input = screen.getByPlaceholderText('Search')
    const classesOf = (node: Element) => (capturedByNode.get(node) ?? '').split(/\s+/)
    expect(classesOf(input.parentElement!)).not.toContain('focus-ring')

    fireEvent.focus(input)

    expect(classesOf(input.parentElement!)).toContain('focus-ring')
    expect(classesOf(input)).toContain('web:outline-none')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Input label="Email" placeholder="Enter your email" />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('associates label with input', () => {
      render(<Input label="Username" placeholder="Enter username" />)
      const input = screen.getByPlaceholderText('Enter username')
      expect(input).toHaveAccessibleName('Username')
    })

    it('communicates disabled state', () => {
      render(<Input isDisabled placeholder="Disabled input" />)
      const input = screen.getByPlaceholderText('Disabled input')
      // react-native-web renders isDisabled as readonly
      expect(input).toHaveAttribute('readonly')
    })
  })
})

/**
 * Input's field stack, pinned (AW-142 wave two).
 *
 * Label, control and helper were spaced by three separate 6px margins. The
 * root owns one 8px stack gap instead — 6 is not on the ramp, and 8 against
 * FormSection's 16 between fields is the 1:2 the proximity rule wants.
 */
describe('Input geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'Input.tsx')

  it.each([['the field root', 'w-full gap-stack-md', ['100%', '8px']]] as const)(
    '%s ships `%s`',
    (_label, classes, pixels) => {
      expect(source).toContain(classes)
      const spacing = classes.split(' ').filter((c) => resolveAll([c])[0] !== undefined)
      expect(resolveAll(spacing)).toEqual([...pixels])
    }
  )
})

/**
 * Input's single-line heights sit on Button's control tokens (TD-275), so an
 * Input and a Button of the same size line up in one row. Horizontal padding
 * stays at 12/16/16, narrower than Button's, by the Gate 2 decision.
 */
describe('Input single-line sizes', () => {
  const source = siblingSource(import.meta.url, 'Input.tsx')
  const buttonSource = siblingSource(import.meta.url, '../button/Button.tsx')
  const geometryFor = (level: string) =>
    sizeClasses(source, 'sizeStyles', level).filter((c) => resolveAll([c])[0] !== undefined)
  const heightKey = (classes: string[]) =>
    classes.find((c) => /^(min-)?h-/.test(c))?.replace(/^(min-)?h-/, '')

  const shipped = [
    ['sm', ['h-control-sm', 'px-3'], ['32px', '12px']],
    ['md', ['h-control-md', 'px-4'], ['40px', '16px']],
    ['lg', ['h-control-lg', 'px-4'], ['48px', '16px']],
  ] as const

  it.each(shipped)('%s pins its height and padding', (level, classes, pixels) => {
    expect(geometryFor(level)).toEqual([...classes])
    expect(resolveAll(geometryFor(level))).toEqual([...pixels])
  })

  it.each(['sm', 'md', 'lg'])('%s shares its control height token with Button', (level) => {
    const buttonHeight = heightKey(sizeClasses(buttonSource, 'sizeStyles', level))
    expect(buttonHeight).toBe(`control-${level}`)
    expect(heightKey(geometryFor(level))).toBe(buttonHeight)
  })
})
