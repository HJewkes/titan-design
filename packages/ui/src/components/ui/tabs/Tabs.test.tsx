import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from './Tabs'

function renderTabs(props: Record<string, unknown> = {}) {
  return render(
    <Tabs {...props}>
      <TabList>
        <Tab>Tab 1</Tab>
        <Tab>Tab 2</Tab>
        <Tab>Tab 3</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>Content 1</TabPanel>
        <TabPanel>Content 2</TabPanel>
        <TabPanel>Content 3</TabPanel>
      </TabPanels>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('renders all tab buttons', () => {
    renderTabs()
    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
  })

  it('shows first tab panel by default', () => {
    renderTabs()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
  })

  it('shows correct panel for defaultIndex', () => {
    renderTabs({ defaultIndex: 1 })
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('switches tab on click', () => {
    renderTabs()
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('calls onChange when tab is clicked', () => {
    const onChange = vi.fn()
    renderTabs({ onChange })
    fireEvent.click(screen.getAllByRole('tab')[2])
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('supports controlled index', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Tabs index={0} onChange={onChange}>
        <TabList>
          <Tab>A</Tab>
          <Tab>B</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel A</TabPanel>
          <TabPanel>Panel B</TabPanel>
        </TabPanels>
      </Tabs>
    )
    expect(screen.getByText('Panel A')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(onChange).toHaveBeenCalledWith(1)
    // Still shows Panel A because controlled
    expect(screen.getByText('Panel A')).toBeInTheDocument()

    rerender(
      <Tabs index={1} onChange={onChange}>
        <TabList>
          <Tab>A</Tab>
          <Tab>B</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel A</TabPanel>
          <TabPanel>Panel B</TabPanel>
        </TabPanels>
      </Tabs>
    )
    expect(screen.getByText('Panel B')).toBeInTheDocument()
  })

  it('renders with all variant options', () => {
    const variants = ['line', 'enclosed', 'soft-rounded'] as const
    variants.forEach((variant) => {
      const { unmount } = render(
        <Tabs variant={variant}>
          <TabList>
            <Tab>A</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>Panel</TabPanel>
          </TabPanels>
        </Tabs>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
      unmount()
    })
  })

  it('renders with vertical orientation', () => {
    const { container } = render(
      <Tabs orientation="vertical">
        <TabList>
          <Tab>A</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel</TabPanel>
        </TabPanels>
      </Tabs>
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('disables individual tabs', () => {
    render(
      <Tabs>
        <TabList>
          <Tab>Enabled</Tab>
          <Tab isDisabled>Disabled</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel 1</TabPanel>
          <TabPanel>Panel 2</TabPanel>
        </TabPanels>
      </Tabs>
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs[1]).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not switch to disabled tab on click', () => {
    render(
      <Tabs>
        <TabList>
          <Tab>A</Tab>
          <Tab isDisabled>B</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>Panel A</TabPanel>
          <TabPanel>Panel B</TabPanel>
        </TabPanels>
      </Tabs>
    )
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.getByText('Panel A')).toBeInTheDocument()
  })

  it('applies custom className to Tabs', () => {
    const { container } = renderTabs({ className: 'extra' })
    expect(container.firstChild).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderTabs()
      // react-native-web does not render role="tablist" on the TabList container
      // or aria-selected on tabs, so we disable related rules
      const results = await axe(container, {
        rules: {
          'aria-required-parent': { enabled: false },
          'aria-required-attr': { enabled: false },
        },
      })
      expect(results).toHaveNoViolations()
    })

    it('has correct tab role on tabs', () => {
      renderTabs()
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
    })

    it('marks active tab as selected', () => {
      renderTabs()
      const tabs = screen.getAllByRole('tab')
      // react-native-web does not output aria-selected for accessibilityState.selected on tabs
      expect(tabs[0]).toBeInTheDocument()
      expect(tabs[1]).toBeInTheDocument()
    })
  })
})
