import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ToolbarButton, ToolbarButtonGroup } from './ToolbarButton'
import { Surface } from '../surface'
import { getSemanticColors } from '../../../theme/tokens/semantic'

function faceColor(theme: 'dark' | 'light', isActive?: boolean): string {
  render(
    <Surface theme={theme}>
      <ToolbarButton label="Face" isActive={isActive} />
    </Surface>
  )
  return getComputedStyle(screen.getByRole('button', { name: 'Face' })).backgroundColor
}

function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

describe('ToolbarButton', () => {
  it('renders with label', () => {
    render(<ToolbarButton label="Settings" />)
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<ToolbarButton label="Settings" icon={<span data-testid="icon">gear</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('hides label when showLabel is false', () => {
    render(<ToolbarButton label="Settings" showLabel={false} />)
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  describe('press handling', () => {
    it('calls onPress when clicked', () => {
      const onPress = vi.fn()
      render(<ToolbarButton label="Action" onPress={onPress} />)

      fireEvent.click(screen.getByRole('button', { name: 'Action' }))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('does not call onPress when disabled', () => {
      const onPress = vi.fn()
      render(<ToolbarButton label="Disabled" isDisabled onPress={onPress} />)

      fireEvent.click(screen.getByRole('button', { name: 'Disabled' }))
      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('active state', () => {
    it('communicates selected state when isActive is true', () => {
      render(<ToolbarButton label="Active" isActive />)
      const button = screen.getByRole('button', { name: 'Active' })
      expect(button).toBeInTheDocument()
    })

    it('communicates unselected state when isActive is false', () => {
      render(<ToolbarButton label="Inactive" isActive={false} />)
      const button = screen.getByRole('button', { name: 'Inactive' })
      expect(button).toBeInTheDocument()
    })

    it('renders without explicit active state', () => {
      render(<ToolbarButton label="Default" />)
      expect(screen.getByRole('button', { name: 'Default' })).toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('renders as disabled when isDisabled is true', () => {
      render(<ToolbarButton label="Disabled" isDisabled />)
      const button = screen.getByRole('button', { name: 'Disabled' })
      expect(button).toBeDisabled()
    })

    it('communicates disabled state to assistive technology', () => {
      render(<ToolbarButton label="Disabled" isDisabled />)
      const button = screen.getByRole('button', { name: 'Disabled' })
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('sizes', () => {
    it('renders with sm size', () => {
      render(<ToolbarButton label="Small" size="sm" />)
      expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument()
    })

    it('renders with md size (default)', () => {
      render(<ToolbarButton label="Medium" size="md" />)
      expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument()
    })

    it('renders with lg size', () => {
      render(<ToolbarButton label="Large" size="lg" />)
      expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('renders with neumorphic variant (default)', () => {
      render(<ToolbarButton label="Neumorphic" variant="raised" />)
      expect(screen.getByRole('button', { name: 'Neumorphic' })).toBeInTheDocument()
    })

    it('renders with default variant', () => {
      render(<ToolbarButton label="Default" variant="default" />)
      expect(screen.getByRole('button', { name: 'Default' })).toBeInTheDocument()
    })
  })

  describe('control faces (TD-265)', () => {
    it('paints the light control-face on a light surface', () => {
      const light = getSemanticColors('light')['control-face']

      const face = faceColor('light', false)

      expect(face).toBe(hexToRgb(light))
      expect(light).not.toBe(getSemanticColors('dark')['control-face'])
    })

    it('paints the light control-face-active when pressed on a light surface', () => {
      expect(faceColor('light', true)).toBe(
        hexToRgb(getSemanticColors('light')['control-face-active'])
      )
    })

    it('keeps the dark faces it painted before the tokens', () => {
      expect(faceColor('dark', false)).toBe(hexToRgb('#424140'))
    })

    it('keeps the dark pressed face it painted before the tokens', () => {
      expect(faceColor('dark', true)).toBe(hexToRgb('#2C2A28'))
    })
  })

  describe('menu content', () => {
    it('shows menu when pressed with menuContent', () => {
      render(<ToolbarButton label="Options" menuContent={<span>Menu item</span>} />)

      fireEvent.click(screen.getByRole('button', { name: 'Options' }))
      expect(screen.getByText('Menu item')).toBeInTheDocument()
    })

    it('hides menu when pressed again', () => {
      render(<ToolbarButton label="Options" menuContent={<span>Menu item</span>} />)

      const button = screen.getByRole('button', { name: 'Options' })
      fireEvent.click(button)
      expect(screen.getByText('Menu item')).toBeInTheDocument()

      fireEvent.click(button)
      expect(screen.queryByText('Menu item')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ToolbarButton label="Accessible Button" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has correct accessibility label', () => {
      render(<ToolbarButton label="Settings" />)
      expect(screen.getByLabelText('Settings')).toBeInTheDocument()
    })

    it('applies tooltip as accessibility hint', () => {
      render(<ToolbarButton label="Help" tooltip="Show help panel" />)
      const button = screen.getByRole('button', { name: 'Help' })
      expect(button).toBeInTheDocument()
    })
  })
})

describe('ToolbarButtonGroup', () => {
  it('renders children', () => {
    render(
      <ToolbarButtonGroup>
        <ToolbarButton label="One" />
        <ToolbarButton label="Two" />
      </ToolbarButtonGroup>
    )
    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
  })

  it('has toolbar accessibility role', () => {
    render(
      <ToolbarButtonGroup>
        <ToolbarButton label="Action" />
      </ToolbarButtonGroup>
    )
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
  })

  it('renders with different orientations', () => {
    const { rerender } = render(
      <ToolbarButtonGroup orientation="horizontal">
        <ToolbarButton label="H" />
      </ToolbarButtonGroup>
    )
    expect(screen.getByRole('toolbar')).toBeInTheDocument()

    rerender(
      <ToolbarButtonGroup orientation="vertical">
        <ToolbarButton label="V" />
      </ToolbarButtonGroup>
    )
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
  })

  it('renders with different gap sizes', () => {
    const { rerender } = render(
      <ToolbarButtonGroup gap="none">
        <ToolbarButton label="A" />
      </ToolbarButtonGroup>
    )
    expect(screen.getByRole('toolbar')).toBeInTheDocument()

    rerender(
      <ToolbarButtonGroup gap="md">
        <ToolbarButton label="A" />
      </ToolbarButtonGroup>
    )
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ToolbarButtonGroup>
          <ToolbarButton label="Bold" />
          <ToolbarButton label="Italic" />
        </ToolbarButtonGroup>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
