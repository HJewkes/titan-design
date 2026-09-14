import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Drawer, DrawerBody, DrawerHeader, DrawerFooter } from './Drawer'
import { resolveAll, siblingSource } from '../../../test/spacing-resolver'

function renderDrawer(props: Partial<React.ComponentProps<typeof Drawer>> = {}) {
  return render(
    <Drawer isOpen onClose={vi.fn()} title="Test Drawer" {...props}>
      <DrawerBody>Drawer body content</DrawerBody>
      <DrawerFooter>
        <button>Save</button>
      </DrawerFooter>
    </Drawer>
  )
}

describe('Drawer', () => {
  it('renders when isOpen is true', () => {
    renderDrawer({ isOpen: true })
    expect(screen.getByText('Test Drawer')).toBeInTheDocument()
    expect(screen.getByText('Drawer body content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    renderDrawer({ isOpen: false })
    expect(screen.queryByText('Test Drawer')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is pressed', () => {
    const onClose = vi.fn()
    renderDrawer({ isOpen: true, onClose })

    const closeButton = screen.getByLabelText('Close drawer')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('hides close button when showCloseButton is false', () => {
    renderDrawer({ isOpen: true, showCloseButton: false })
    expect(screen.queryByLabelText('Close drawer')).not.toBeInTheDocument()
  })

  it('renders title', () => {
    renderDrawer({ isOpen: true, title: 'Settings' })
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders without title', () => {
    renderDrawer({ isOpen: true, title: undefined, showCloseButton: false })
    expect(screen.getByText('Drawer body content')).toBeInTheDocument()
  })

  describe('placements', () => {
    const placements = ['left', 'right', 'top', 'bottom'] as const
    placements.forEach((placement) => {
      it(`renders with placement ${placement}`, () => {
        renderDrawer({ isOpen: true, placement })
        expect(screen.getByText('Test Drawer')).toBeInTheDocument()
      })
    })
  })

  describe('sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const
    sizes.forEach((size) => {
      it(`renders with size ${size}`, () => {
        renderDrawer({ isOpen: true, size })
        expect(screen.getByText('Test Drawer')).toBeInTheDocument()
      })
    })
  })

  describe('overlay click behavior', () => {
    it('calls onClose when overlay is clicked with closeOnOverlayClick true', () => {
      const onClose = vi.fn()
      renderDrawer({ isOpen: true, onClose, closeOnOverlayClick: true })
      // The backdrop Pressable triggers onClose
    })

    it('does not call onClose when closeOnOverlayClick is false', () => {
      const onClose = vi.fn()
      renderDrawer({ isOpen: true, onClose, closeOnOverlayClick: false })
      // Clicking backdrop should not call onClose
    })
  })

  describe('DrawerBody', () => {
    it('renders body content', () => {
      renderDrawer({ isOpen: true })
      expect(screen.getByText('Drawer body content')).toBeInTheDocument()
    })

    it('renders scrollable body by default', () => {
      render(
        <Drawer isOpen onClose={vi.fn()}>
          <DrawerBody scrollable>Scrollable content</DrawerBody>
        </Drawer>
      )
      expect(screen.getByText('Scrollable content')).toBeInTheDocument()
    })

    it('renders non-scrollable body', () => {
      render(
        <Drawer isOpen onClose={vi.fn()}>
          <DrawerBody scrollable={false}>Non-scrollable content</DrawerBody>
        </Drawer>
      )
      expect(screen.getByText('Non-scrollable content')).toBeInTheDocument()
    })
  })

  describe('DrawerHeader', () => {
    it('renders custom header content', () => {
      render(
        <Drawer isOpen onClose={vi.fn()} showCloseButton={false}>
          <DrawerHeader>Custom Header</DrawerHeader>
        </Drawer>
      )
      expect(screen.getByText('Custom Header')).toBeInTheDocument()
    })
  })

  describe('DrawerFooter', () => {
    it('renders footer content', () => {
      renderDrawer({ isOpen: true })
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderDrawer({ isOpen: true })
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('close button has accessible label', () => {
      renderDrawer({ isOpen: true })
      expect(screen.getByLabelText('Close drawer')).toBeInTheDocument()
    })
  })
})

/**
 * Drawer's bands, pinned (AW-142 wave two).
 *
 * Drawer shipped 16/12 on its header and footer and 16/16 on its body. All
 * three are 24/16 now, the band Modal and Card already used.
 */
describe('Drawer geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'Drawer.tsx')

  it.each([
    ['the header', 'px-inset-xl py-inset-lg border-b border-hairline', ['24px', '16px']],
    ['the body', 'flex-1 px-inset-xl py-inset-lg', ['24px', '16px']],
    ['the footer', 'px-inset-xl py-inset-lg border-t border-hairline', ['24px', '16px']],
  ] as const)('%s ships `%s`', (_label, classes, pixels) => {
    expect(source).toContain(classes)
    const spacing = classes.split(' ').filter((c) => resolveAll([c])[0] !== undefined)
    expect(resolveAll(spacing)).toEqual([...pixels])
  })
})
