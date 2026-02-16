import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { FormField, FormSection, FormActions, FormRow } from './FormField'

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Email">
        <input type="email" placeholder="Enter email" />
      </FormField>
    )
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('renders without a label', () => {
    render(
      <FormField>
        <input placeholder="No label" />
      </FormField>
    )
    expect(screen.getByPlaceholderText('No label')).toBeInTheDocument()
  })

  describe('required indicator', () => {
    it('shows asterisk when isRequired is true', () => {
      render(
        <FormField label="Name" isRequired>
          <input />
        </FormField>
      )
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('does not show asterisk when isRequired is false', () => {
      render(
        <FormField label="Name">
          <input />
        </FormField>
      )
      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })
  })

  describe('helper and error text', () => {
    it('renders helper text', () => {
      render(
        <FormField label="Email" helperText="We will never share your email.">
          <input />
        </FormField>
      )
      expect(screen.getByText('We will never share your email.')).toBeInTheDocument()
    })

    it('renders error message', () => {
      render(
        <FormField label="Password" errorMessage="Password is too short.">
          <input />
        </FormField>
      )
      expect(screen.getByText('Password is too short.')).toBeInTheDocument()
    })

    it('shows error message instead of helper text when both are provided', () => {
      render(
        <FormField
          label="Email"
          helperText="Enter a valid email"
          errorMessage="Invalid email"
        >
          <input />
        </FormField>
      )
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
      expect(screen.queryByText('Enter a valid email')).not.toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('applies disabled styling when isDisabled is true', () => {
      const { container } = render(
        <FormField label="Name" isDisabled>
          <input />
        </FormField>
      )
      expect(container).toBeInTheDocument()
    })
  })

  describe('label sizes', () => {
    it('renders with sm label size', () => {
      render(
        <FormField label="Small Label" labelSize="sm">
          <input />
        </FormField>
      )
      expect(screen.getByText('Small Label')).toBeInTheDocument()
    })

    it('renders with md label size (default)', () => {
      render(
        <FormField label="Medium Label" labelSize="md">
          <input />
        </FormField>
      )
      expect(screen.getByText('Medium Label')).toBeInTheDocument()
    })

    it('renders with lg label size', () => {
      render(
        <FormField label="Large Label" labelSize="lg">
          <input />
        </FormField>
      )
      expect(screen.getByText('Large Label')).toBeInTheDocument()
    })
  })

  describe('orientation', () => {
    it('renders in vertical orientation (default)', () => {
      const { container } = render(
        <FormField label="Vertical" orientation="vertical">
          <input />
        </FormField>
      )
      expect(container).toBeInTheDocument()
    })

    it('renders in horizontal orientation', () => {
      const { container } = render(
        <FormField label="Horizontal" orientation="horizontal" labelWidth={120}>
          <input />
        </FormField>
      )
      expect(container).toBeInTheDocument()
    })
  })

  describe('help content', () => {
    it('renders help indicator when helpContent is provided', () => {
      render(
        <FormField label="API Key" helpContent="Found in settings">
          <input />
        </FormField>
      )
      expect(screen.getByText('API Key')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <FormField label="Email" isRequired helperText="Enter a valid email">
          <input type="email" aria-label="Email" />
        </FormField>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with error', async () => {
      const { container } = render(
        <FormField label="Password" errorMessage="Too short">
          <input type="password" aria-label="Password" />
        </FormField>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('FormSection', () => {
  it('renders title and description', () => {
    render(
      <FormSection title="Personal Info" description="Enter your details">
        <span>Form fields</span>
      </FormSection>
    )
    expect(screen.getByText('Personal Info')).toBeInTheDocument()
    expect(screen.getByText('Enter your details')).toBeInTheDocument()
    expect(screen.getByText('Form fields')).toBeInTheDocument()
  })

  it('renders without title and description', () => {
    render(
      <FormSection>
        <span>Just fields</span>
      </FormSection>
    )
    expect(screen.getByText('Just fields')).toBeInTheDocument()
  })

  it('has group accessibility role', () => {
    render(
      <FormSection title="Section">
        <span>Content</span>
      </FormSection>
    )
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <FormSection title="Section" description="Description">
          <span>Content</span>
        </FormSection>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('FormActions', () => {
  it('renders children', () => {
    render(
      <FormActions>
        <button>Cancel</button>
        <button>Submit</button>
      </FormActions>
    )
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('renders with different alignments', () => {
    const { rerender } = render(
      <FormActions align="left">
        <button>Action</button>
      </FormActions>
    )
    expect(screen.getByText('Action')).toBeInTheDocument()

    rerender(
      <FormActions align="center">
        <button>Action</button>
      </FormActions>
    )
    expect(screen.getByText('Action')).toBeInTheDocument()

    rerender(
      <FormActions align="between">
        <button>Action</button>
      </FormActions>
    )
    expect(screen.getByText('Action')).toBeInTheDocument()
  })
})

describe('FormRow', () => {
  it('renders children in a row', () => {
    render(
      <FormRow>
        <span>Field 1</span>
        <span>Field 2</span>
      </FormRow>
    )
    expect(screen.getByText('Field 1')).toBeInTheDocument()
    expect(screen.getByText('Field 2')).toBeInTheDocument()
  })

  it('renders with different gap sizes', () => {
    const { rerender } = render(
      <FormRow gap="sm">
        <span>Field</span>
      </FormRow>
    )
    expect(screen.getByText('Field')).toBeInTheDocument()

    rerender(
      <FormRow gap="lg">
        <span>Field</span>
      </FormRow>
    )
    expect(screen.getByText('Field')).toBeInTheDocument()
  })
})
