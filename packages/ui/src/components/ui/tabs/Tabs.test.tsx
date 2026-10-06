import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Tabs, TabList, Tab, TabPanels, TabPanel, type TabsProps } from './Tabs'

function renderTabs(props: TabsProps = {}) {
  return render(<TabsFixture {...props} />)
}

function TabsFixture(props: TabsProps) {
  return (
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

  it('seeds the selected tab from defaultValue', () => {
    renderTabs({ defaultValue: 2 })
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Content 3')).toBeInTheDocument()
  })

  it('fires onValueChange with the pressed tab index', () => {
    const onValueChange = vi.fn()
    renderTabs({ onValueChange })
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(onValueChange).toHaveBeenCalledWith(1)
  })

  it('lets a controlled value drive the selected tab', () => {
    const onValueChange = vi.fn()
    const { rerender } = render(<TabsFixture value={0} onValueChange={onValueChange} />)
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(onValueChange).toHaveBeenCalledWith(1)
    expect(screen.getByText('Content 1')).toBeInTheDocument()

    rerender(<TabsFixture value={2} onValueChange={onValueChange} />)
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Content 3')).toBeInTheDocument()
  })

  it('prefers value over the deprecated index and fires both change callbacks', () => {
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    render(<TabsFixture value={2} index={0} onValueChange={onValueChange} onChange={onChange} />)
    expect(screen.getByText('Content 3')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('tab')[1])
    expect(onValueChange).toHaveBeenCalledWith(1)
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('prefers defaultValue over the deprecated defaultIndex', () => {
    renderTabs({ defaultValue: 2, defaultIndex: 1 })
    expect(screen.getByText('Content 3')).toBeInTheDocument()
  })

  it('shows correct panel for the deprecated defaultIndex', () => {
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

  it('calls the deprecated onChange when a tab is clicked', () => {
    const onChange = vi.fn()
    renderTabs({ onChange })
    fireEvent.click(screen.getAllByRole('tab')[2])
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('supports the deprecated controlled index', () => {
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
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('exposes a tablist with its orientation', () => {
      renderTabs()
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal')
    })

    it('reports vertical orientation on the tablist', () => {
      renderTabs({ orientation: 'vertical' })
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
    })

    it('links each tab to its panel and back', () => {
      renderTabs({ defaultIndex: 1 })
      const tab = screen.getAllByRole('tab')[1]
      const panel = screen.getByRole('tabpanel')
      expect(tab).toHaveAttribute('id')
      expect(panel).toHaveAttribute('id')
      expect(tab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'))
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.getAttribute('id'))
    })

    it('moves selection with ArrowRight and wraps at the end', () => {
      renderTabs({ defaultIndex: 2 })
      fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('moves selection with ArrowLeft and wraps at the start', () => {
      renderTabs()
      fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })
      expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true')
    })

    it('has correct tab role on tabs', () => {
      renderTabs()
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
    })

    it('marks active tab as selected', () => {
      renderTabs()
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
    })
  })
})
