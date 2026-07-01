import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RhfContactForm } from './RhfContactForm'

describe('react-hook-form integration', () => {
  it('submits the collected values from every controlled component', async () => {
    // Arrange
    const onSubmit = vi.fn()
    render(<RhfContactForm onSubmit={onSubmit} />)

    // Act
    fireEvent.change(screen.getByPlaceholderText('Ada Lovelace'), {
      target: { value: 'Grace Hopper' },
    })
    fireEvent.click(screen.getByText('Select a role...'))
    fireEvent.click(screen.getByText('Designer'))
    fireEvent.click(screen.getByText('Pro'))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('Submit'))

    // Assert
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toEqual({
      fullName: 'Grace Hopper',
      role: 'designer',
      plan: 'pro',
      acceptedTerms: true,
    })
  })

  it('surfaces validation errors and blocks submit when required fields are empty', async () => {
    // Arrange
    const onSubmit = vi.fn()
    render(<RhfContactForm onSubmit={onSubmit} />)

    // Act
    fireEvent.click(screen.getByText('Submit'))

    // Assert
    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
    expect(screen.getByText('Please choose a role')).toBeInTheDocument()
    expect(screen.getByText('Please pick a plan')).toBeInTheDocument()
    expect(screen.getByText('You must accept the terms')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears a field error once the value becomes valid', async () => {
    // Arrange
    render(<RhfContactForm />)
    fireEvent.click(screen.getByText('Submit'))
    expect(await screen.findByText('Full name is required')).toBeInTheDocument()

    // Act
    fireEvent.change(screen.getByPlaceholderText('Ada Lovelace'), {
      target: { value: 'Katherine Johnson' },
    })

    // Assert
    await waitFor(() => expect(screen.queryByText('Full name is required')).not.toBeInTheDocument())
  })
})
