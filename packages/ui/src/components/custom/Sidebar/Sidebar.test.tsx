import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarDivider,
} from './Sidebar'
import { dividerClasses } from '../../../test/divider-rule'

function MockIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <span data-testid="mock-icon" data-size={size} className={className}>
      I
    </span>
  )
}

function renderSidebar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  return render(
    <Sidebar activeItem="home" onItemSelect={vi.fn()} {...props}>
      <SidebarHeader>
        <span>Logo</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection title="Main">
          <SidebarItem id="home" icon={MockIcon} label="Home" />
          <SidebarItem id="dashboard" icon={MockIcon} label="Dashboard" />
        </SidebarSection>
        <SidebarDivider />
        <SidebarSection title="Settings">
          <SidebarItem id="settings" icon={MockIcon} label="Settings" />
        </SidebarSection>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem id="logout" label="Logout" />
      </SidebarFooter>
    </Sidebar>
  )
}

describe('Sidebar', () => {
  it('renders with all sections', () => {
    renderSidebar()
    expect(screen.getByText('Logo')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('renders section titles', () => {
    renderSidebar()
    expect(screen.getByText('Main')).toBeInTheDocument()
  })

  it('hides section titles when collapsed', () => {
    renderSidebar({ isCollapsed: true })
    expect(screen.queryByText('Main')).not.toBeInTheDocument()
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('hides item labels when collapsed', () => {
    renderSidebar({ isCollapsed: true })
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('shows item labels when expanded', () => {
    renderSidebar({ isCollapsed: false })
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  describe('SidebarItem', () => {
    it('calls onItemSelect when item is pressed', () => {
      const onItemSelect = vi.fn()
      renderSidebar({ onItemSelect })

      fireEvent.click(screen.getByLabelText('Dashboard'))
      expect(onItemSelect).toHaveBeenCalledWith('dashboard')
    })

    it('highlights active item', () => {
      renderSidebar({ activeItem: 'home' })
      const homeItem = screen.getByLabelText('Home')
      expect(homeItem).toBeInTheDocument()
    })

    it('renders icon', () => {
      renderSidebar()
      const icons = screen.getAllByTestId('mock-icon')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('renders badge content', () => {
      render(
        <Sidebar>
          <SidebarContent>
            <SidebarItem id="inbox" label="Inbox" badge={<span>5</span>} />
          </SidebarContent>
        </Sidebar>
      )
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders expand indicator for items with children', () => {
      render(
        <Sidebar>
          <SidebarContent>
            <SidebarItem id="nav" label="Navigation" hasChildren isExpanded={false} />
          </SidebarContent>
        </Sidebar>
      )
      expect(screen.getByLabelText('Navigation')).toBeInTheDocument()
    })

    it('calls custom onPress handler alongside onItemSelect', () => {
      const onItemSelect = vi.fn()
      const onPress = vi.fn()
      render(
        <Sidebar onItemSelect={onItemSelect}>
          <SidebarContent>
            <SidebarItem id="custom" label="Custom" onPress={onPress} />
          </SidebarContent>
        </Sidebar>
      )

      fireEvent.click(screen.getByLabelText('Custom'))
      expect(onItemSelect).toHaveBeenCalledWith('custom')
      expect(onPress).toHaveBeenCalled()
    })
  })

  describe('rules', () => {
    const subtleRule = ['h-px', 'w-full', 'bg-hairline-subtle']

    it('draws a subtle Divider under the header and over the footer', () => {
      renderSidebar()
      const header = screen.getByText('Logo').parentElement
      const footer = screen.getByRole('button', { name: 'Logout' }).parentElement

      expect(dividerClasses(header?.nextElementSibling)).toEqual(subtleRule)
      expect(dividerClasses(footer?.previousElementSibling)).toEqual(subtleRule)
    })

    it('SidebarDivider is an inset subtle Divider', () => {
      renderSidebar()
      const mainSection = screen.getByRole('group', { name: 'Main' })

      expect(dividerClasses(mainSection.nextElementSibling)).toEqual([
        'h-px',
        'w-auto',
        'mx-4',
        'my-2',
        'bg-hairline-subtle',
      ])
    })
  })

  describe('width props', () => {
    it('uses default width', () => {
      renderSidebar()
      expect(screen.getByText('Logo')).toBeInTheDocument()
    })

    it('uses custom width', () => {
      renderSidebar({ width: 300 })
      expect(screen.getByText('Logo')).toBeInTheDocument()
    })

    it('uses collapsed width when collapsed', () => {
      renderSidebar({ isCollapsed: true, collapsedWidth: 80 })
      // Items still render but labels are hidden
      expect(screen.queryByText('Home')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderSidebar()
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('items have button role', () => {
      renderSidebar()
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('items have accessible labels', () => {
      renderSidebar()
      expect(screen.getByLabelText('Home')).toBeInTheDocument()
      expect(screen.getByLabelText('Dashboard')).toBeInTheDocument()
    })

    it('marks only the active item as the current page', () => {
      renderSidebar({ activeItem: 'home' })
      expect(screen.getByLabelText('Home')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByLabelText('Dashboard')).not.toHaveAttribute('aria-current')
    })

    it('wraps a text badge in a Text node rather than a bare child of the item', () => {
      render(
        <Sidebar>
          <SidebarItem id="inbox" label="Inbox" badge="5" />
        </Sidebar>
      )
      const badge = screen.getByText('5')
      const directText = (el: Element | null) =>
        Array.from(el?.childNodes ?? []).some((n) => n.nodeType === 3 && n.textContent?.trim())
      expect(directText(badge)).toBe(true)
      expect(badge.parentElement).not.toBe(screen.getByLabelText('Inbox'))
      expect(directText(badge.parentElement)).toBe(false)
    })

    it('renders nothing for a zero badge', () => {
      render(
        <Sidebar>
          <SidebarItem id="inbox" label="Inbox" badge={0} />
        </Sidebar>
      )
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('exposes aria-expanded matching isExpanded on parent items and hides the glyph', () => {
      const { rerender } = render(
        <Sidebar>
          <SidebarItem id="nav" label="Navigation" hasChildren isExpanded={false} />
          <SidebarItem id="leaf" label="Leaf" />
        </Sidebar>
      )
      expect(screen.getByLabelText('Navigation')).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByLabelText('Leaf')).not.toHaveAttribute('aria-expanded')
      expect(screen.getByText('▶')).toHaveAttribute('aria-hidden', 'true')
      rerender(
        <Sidebar>
          <SidebarItem id="nav" label="Navigation" hasChildren isExpanded />
        </Sidebar>
      )
      expect(screen.getByLabelText('Navigation')).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders the sidebar as a navigation landmark', () => {
      renderSidebar()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('labels a titled section as a group', () => {
      renderSidebar()
      const group = screen.getByRole('group', { name: 'Main' })
      expect(group).toContainElement(screen.getByLabelText('Dashboard'))
    })
  })
})
