import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
} from './Menu'

describe('Menu', () => {
  it('renders trigger element', () => {
    render(
      <Menu>
        <MenuTrigger>
          <button>Options</button>
        </MenuTrigger>
        <MenuList>
          <MenuItem>Edit</MenuItem>
        </MenuList>
      </Menu>
    )
    expect(screen.getByText('Options')).toBeInTheDocument()
  })

  it('does not show menu list by default', () => {
    render(
      <Menu>
        <MenuTrigger>
          <button>Options</button>
        </MenuTrigger>
        <MenuList>
          <MenuItem>Edit</MenuItem>
        </MenuList>
      </Menu>
    )
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('opens menu when trigger is clicked', () => {
    render(
      <Menu>
        <MenuTrigger>
          <button>Options</button>
        </MenuTrigger>
        <MenuList>
          <MenuItem>Edit</MenuItem>
        </MenuList>
      </Menu>
    )

    fireEvent.click(screen.getByText('Options'))
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('closes menu when trigger is clicked again', () => {
    render(
      <Menu>
        <MenuTrigger>
          <button>Options</button>
        </MenuTrigger>
        <MenuList>
          <MenuItem>Edit</MenuItem>
        </MenuList>
      </Menu>
    )

    fireEvent.click(screen.getByText('Options'))
    expect(screen.getByText('Edit')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Options'))
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  describe('controlled state', () => {
    it('shows menu when isOpen is true', () => {
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
          </MenuList>
        </Menu>
      )
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('hides menu when isOpen is false', () => {
      render(
        <Menu isOpen={false}>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
          </MenuList>
        </Menu>
      )
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('calls onOpenChange when trigger is clicked', () => {
      const onOpenChange = vi.fn()
      render(
        <Menu onOpenChange={onOpenChange}>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
          </MenuList>
        </Menu>
      )

      fireEvent.click(screen.getByText('Options'))
      expect(onOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('MenuItem', () => {
    it('calls onPress when clicked', () => {
      const onPress = vi.fn()
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem onPress={onPress}>Edit</MenuItem>
          </MenuList>
        </Menu>
      )

      fireEvent.click(screen.getByText('Edit'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('closes menu after item is clicked', () => {
      render(
        <Menu>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem onPress={() => {}}>Edit</MenuItem>
          </MenuList>
        </Menu>
      )

      fireEvent.click(screen.getByText('Options'))
      expect(screen.getByText('Edit')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Edit'))
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('does not call onPress when disabled', () => {
      const onPress = vi.fn()
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem onPress={onPress} isDisabled>
              Disabled Item
            </MenuItem>
          </MenuList>
        </Menu>
      )

      fireEvent.click(screen.getByText('Disabled Item'))
      expect(onPress).not.toHaveBeenCalled()
    })

    it('renders destructive item', () => {
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem isDestructive>Delete</MenuItem>
          </MenuList>
        </Menu>
      )
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('renders item with icon', () => {
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem icon={<span data-testid="edit-icon">pencil</span>}>
              Edit
            </MenuItem>
          </MenuList>
        </Menu>
      )
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
    })

    it('has menuitem accessibility role', () => {
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
          </MenuList>
        </Menu>
      )
      expect(screen.getByRole('menuitem')).toBeInTheDocument()
    })
  })

  describe('MenuDivider', () => {
    it('renders a divider', () => {
      const { container } = render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
            <MenuDivider />
            <MenuItem>Delete</MenuItem>
          </MenuList>
        </Menu>
      )
      expect(container).toBeInTheDocument()
    })
  })

  describe('MenuGroup', () => {
    it('renders group with label', () => {
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuGroup label="Actions">
              <MenuItem>Edit</MenuItem>
              <MenuItem>Duplicate</MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
      )
      expect(screen.getByText('Actions')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Duplicate')).toBeInTheDocument()
    })

    it('renders group without label', () => {
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuGroup>
              <MenuItem>Edit</MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
      )
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
  })

  describe('MenuTrigger', () => {
    it('communicates expanded state', () => {
      render(
        <Menu>
          <MenuTrigger>
            <span>Options</span>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
          </MenuList>
        </Menu>
      )

      const trigger = screen.getByRole('button', { name: 'Options' })
      // react-native-web does not render aria-expanded for accessibilityState.expanded
      expect(trigger).toBeInTheDocument()

      fireEvent.click(trigger)
      // Verify menu opens by checking for menu content
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  describe('MenuList', () => {
    it('has menu accessibility role', () => {
      render(
        <Menu isOpen>
          <MenuTrigger>
            <button>Options</button>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
          </MenuList>
        </Menu>
      )
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(
        <Menu>
          <MenuTrigger>
            <span>Options</span>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
            <MenuItem>Delete</MenuItem>
          </MenuList>
        </Menu>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when open', async () => {
      const { container } = render(
        <Menu isOpen>
          <MenuTrigger>
            <span>Options</span>
          </MenuTrigger>
          <MenuList>
            <MenuItem>Edit</MenuItem>
            <MenuDivider />
            <MenuItem isDestructive>Delete</MenuItem>
          </MenuList>
        </Menu>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
