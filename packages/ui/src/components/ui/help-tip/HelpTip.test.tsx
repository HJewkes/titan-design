import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { HelpTip, LabelWithHelp } from './HelpTip'

describe('HelpTip', () => {
  it('renders the help icon button', () => {
    render(<HelpTip content="Help text" />)
    expect(screen.getByRole('button', { name: 'Show help information' })).toBeInTheDocument()
  })

  it('shows tooltip content when pressed', () => {
    render(<HelpTip content="This is helpful" />)

    fireEvent.click(screen.getByRole('button', { name: 'Show help information' }))
    expect(screen.getByText('This is helpful')).toBeInTheDocument()
  })

  it('hides tooltip content when pressed again', () => {
    render(<HelpTip content="Toggle me" />)

    const button = screen.getByRole('button', { name: 'Show help information' })
    fireEvent.click(button)
    expect(screen.getByText('Toggle me')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.queryByText('Toggle me')).not.toBeInTheDocument()
  })

  it('renders custom ReactNode content', () => {
    render(
      <HelpTip content={<span data-testid="custom-content">Rich content</span>} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Show help information' }))
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
  })

  describe('controlled state', () => {
    it('shows tooltip when isOpen is true', () => {
      render(<HelpTip content="Always visible" isOpen />)
      expect(screen.getByText('Always visible')).toBeInTheDocument()
    })

    it('hides tooltip when isOpen is false', () => {
      render(<HelpTip content="Always hidden" isOpen={false} />)
      expect(screen.queryByText('Always hidden')).not.toBeInTheDocument()
    })

    it('does not toggle on press when controlled', () => {
      render(<HelpTip content="Controlled" isOpen={false} />)

      fireEvent.click(screen.getByRole('button', { name: 'Show help information' }))
      expect(screen.queryByText('Controlled')).not.toBeInTheDocument()
    })
  })

  describe('icon types', () => {
    it('renders help icon by default', () => {
      render(<HelpTip content="Help" />)
      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('renders info icon', () => {
      render(<HelpTip content="Info" icon="info" />)
      expect(screen.getByRole('button', { name: 'Show help information' })).toBeInTheDocument()
    })

    it('renders warning icon', () => {
      render(<HelpTip content="Warning" icon="warning" />)
      expect(screen.getByRole('button', { name: 'Show help information' })).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders with sm size', () => {
      render(<HelpTip content="Small" size="sm" />)
      expect(screen.getByRole('button', { name: 'Show help information' })).toBeInTheDocument()
    })

    it('renders with md size (default)', () => {
      render(<HelpTip content="Medium" size="md" />)
      expect(screen.getByRole('button', { name: 'Show help information' })).toBeInTheDocument()
    })

    it('renders with lg size', () => {
      render(<HelpTip content="Large" size="lg" />)
      expect(screen.getByRole('button', { name: 'Show help information' })).toBeInTheDocument()
    })
  })

  describe('colors', () => {
    it('renders with default color', () => {
      render(<HelpTip content="Default" color="default" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with primary color', () => {
      render(<HelpTip content="Primary" color="primary" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with secondary color', () => {
      render(<HelpTip content="Secondary" color="secondary" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with muted color', () => {
      render(<HelpTip content="Muted" color="muted" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('placement', () => {
    it('renders with top placement (default)', () => {
      render(<HelpTip content="Top" placement="top" isOpen />)
      expect(screen.getByText('Top')).toBeInTheDocument()
    })

    it('renders with bottom placement', () => {
      render(<HelpTip content="Bottom" placement="bottom" isOpen />)
      expect(screen.getByText('Bottom')).toBeInTheDocument()
    })

    it('renders with left placement', () => {
      render(<HelpTip content="Left" placement="left" isOpen />)
      expect(screen.getByText('Left')).toBeInTheDocument()
    })

    it('renders with right placement', () => {
      render(<HelpTip content="Right" placement="right" isOpen />)
      expect(screen.getByText('Right')).toBeInTheDocument()
    })
  })

  describe('arrow', () => {
    it('renders with arrow by default', () => {
      render(<HelpTip content="With arrow" isOpen />)
      expect(screen.getByText('With arrow')).toBeInTheDocument()
    })

    it('renders without arrow when hasArrow is false', () => {
      render(<HelpTip content="No arrow" hasArrow={false} isOpen />)
      expect(screen.getByText('No arrow')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<HelpTip content="Accessible help tip" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has correct accessibility label', () => {
      render(<HelpTip content="Help text" />)
      expect(screen.getByLabelText('Show help information')).toBeInTheDocument()
    })

    it('sets accessibility hint for string content', () => {
      render(<HelpTip content="This is a hint" />)
      const button = screen.getByRole('button', { name: 'Show help information' })
      expect(button).toBeInTheDocument()
    })
  })
})

describe('LabelWithHelp', () => {
  it('renders label text', () => {
    render(<LabelWithHelp label="API Key" helpContent="Found in settings" />)
    expect(screen.getByText('API Key')).toBeInTheDocument()
  })

  it('renders help icon alongside label', () => {
    render(<LabelWithHelp label="Field" helpContent="Help text" />)
    expect(screen.getByRole('button', { name: 'Show help information' })).toBeInTheDocument()
  })

  it('shows required indicator when isRequired is true', () => {
    render(<LabelWithHelp label="Email" helpContent="Help" isRequired />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show required indicator by default', () => {
    render(<LabelWithHelp label="Email" helpContent="Help" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <LabelWithHelp label="Username" helpContent="Choose a unique username" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
