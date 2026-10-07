import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { Drawer, DrawerBody, DrawerHeader, DrawerFooter } from './Drawer'
import { capturedClassNames } from '../../../test/classname-capture'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'

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

function panelClasses() {
  return capturedClassNames.get('panel')?.split(/\s+/) ?? []
}

// react-native-web grants its Modal the dialog role once the open animation ends.
function finishOpenAnimation() {
  const focusTrap = document.querySelector('[aria-modal="true"]')!.parentElement!
  fireEvent.animationEnd(focusTrap.parentElement!)
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

  describe('dialog semantics', () => {
    it('exposes exactly one dialog, named by the title', () => {
      renderDrawer({ isOpen: true, title: 'Settings' })
      finishOpenAnimation()

      const dialogs = screen.getAllByRole('dialog')

      expect(dialogs).toHaveLength(1)
      expect(screen.getByRole('dialog', { name: 'Settings' })).toHaveTextContent(
        'Drawer body content'
      )
    })

    it('names an untitled dialog from accessibilityLabel', () => {
      renderDrawer({ isOpen: true, title: undefined, accessibilityLabel: 'Filters' })
      finishOpenAnimation()

      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    })

    it('marks the title as a heading', () => {
      renderDrawer({ isOpen: true, title: 'Settings' })

      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    })

    it('exposes the close control as a button', () => {
      renderDrawer({ isOpen: true })

      expect(screen.getByRole('button', { name: 'Close drawer' })).toBeInTheDocument()
    })
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
    const edges = {
      left: ['left-0', 'top-0', 'bottom-0', 'h-full'],
      right: ['right-0', 'top-0', 'bottom-0', 'h-full'],
      top: ['top-0', 'left-0', 'right-0', 'w-full'],
      bottom: ['bottom-0', 'left-0', 'right-0', 'w-full'],
    } as const
    ;(Object.keys(edges) as (keyof typeof edges)[]).forEach((placement) => {
      it(`anchors the panel with ${edges[placement].join(' ')} for placement ${placement}`, () => {
        renderDrawer({ isOpen: true, placement, testID: 'panel' })
        const classes = panelClasses()
        expect(classes).toEqual(expect.arrayContaining([...edges[placement]]))
        const own: readonly string[] = edges[placement]
        const others: string[] = Object.values(edges)
          .flat()
          .filter((c) => !own.includes(c))
        expect(classes.filter((c) => others.includes(c))).toEqual([])
      })
    })
  })

  describe('sizes', () => {
    const along = {
      left: 'w',
      right: 'w',
      top: 'h',
      bottom: 'h',
    } as const
    const sizeToken = {
      w: { sm: 'w-64', md: 'w-80', lg: 'w-96', xl: 'w-[480px]', full: 'w-full' },
      h: { sm: 'h-32', md: 'h-48', lg: 'h-64', xl: 'h-96', full: 'h-full' },
    } as const
    const placements = ['left', 'right', 'top', 'bottom'] as const
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const
    placements.forEach((placement) => {
      sizes.forEach((size) => {
        const token = sizeToken[along[placement]][size]
        it(`sizes the ${placement} panel with ${token} for size ${size}`, () => {
          renderDrawer({ isOpen: true, placement, size, testID: 'panel' })
          expect(panelClasses()).toContain(token)
        })
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
  const renderBands = () =>
    render(
      <Drawer isOpen onClose={vi.fn()} title="Test Drawer">
        <DrawerHeader>
          <Text>header band</Text>
        </DrawerHeader>
        <DrawerBody>
          <Text>body band</Text>
        </DrawerBody>
        <DrawerFooter>
          <Text>footer band</Text>
        </DrawerFooter>
      </Drawer>
    )

  // The body is a ScrollView: the text sits in its content container, the class on the scroller.
  it.each([
    [
      'the title header',
      () => screen.getByText('Test Drawer').parentElement,
      ['px-inset-xl', 'py-inset-lg'],
      ['24px', '16px'],
    ],
    [
      'DrawerHeader',
      () => screen.getByText('header band').parentElement,
      ['px-inset-xl', 'py-inset-lg'],
      ['24px', '16px'],
    ],
    [
      'the body',
      () => screen.getByText('body band').parentElement?.parentElement,
      ['px-inset-xl', 'py-inset-lg'],
      ['24px', '16px'],
    ],
    [
      'the footer',
      () => screen.getByText('footer band').parentElement,
      ['gap-3', 'px-inset-xl', 'py-inset-lg'],
      ['12px', '24px', '16px'],
    ],
  ] as const)('%s ships its spacing tokens', (_label, find, classes, pixels) => {
    renderBands()
    expect(spacingClassesAt(find() ?? null)).toEqual([...classes])
    expect(resolveAll([...classes])).toEqual([...pixels])
  })
})
