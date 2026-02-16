import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Input } from './Input'

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
    render(
      <Input
        isInvalid
        errorMessage="Invalid input"
        helperText="This should not show"
      />
    )
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

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Input label="Email" placeholder="Enter your email" />
      )

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
