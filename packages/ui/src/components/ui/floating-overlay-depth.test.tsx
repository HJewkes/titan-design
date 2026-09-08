// The depth contract every floating overlay owes the lift model (E1).
//
// One panel, one recipe: the overlay plane from the grey ramp, the rim-light,
// the three-layer ambient shadow, and NO hairline ring — a ring is an edge, not
// a lift, and stays the divider's job. The panels are asserted as INLINE STYLE
// because `<Surface>` writes background and shadow into `style`; a `bg-*` or
// `shadow-*` className on one would be discarded, so asserting the class would
// pass while the render was wrong. The plane comes from the ramp, so a re-space
// moves these expectations rather than breaking them.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { greyRamp } from '../../theme/tokens/primitives'
import { Autocomplete } from './autocomplete'
import { Drawer, DrawerBody } from './drawer'
import { HelpTip } from './help-tip'
import { Menu, MenuTrigger, MenuList, MenuItem } from './menu'
import { Modal, ModalContent, ModalBody } from './modal'
import { Popover, PopoverTrigger, PopoverContent } from './popover'
import { Select } from './select'
import { Toast } from './toast'
import { Tooltip } from './tooltip'

/** The plane every floating overlay shares: past the top of the ramp. */
const OVERLAY = greyRamp[850]

/** The nearest ancestor that paints a plane of its own — the floating panel. */
function panelAround(child: HTMLElement): HTMLElement {
  let el: HTMLElement | null = child
  while (el && !el.style.boxShadow) el = el.parentElement
  if (!el) throw new Error('no element with an inline boxShadow above the panel content')
  return el
}

/** Split a boxShadow on its layer commas, ignoring the ones inside `rgba(...)`. */
function shadowLayers(boxShadow: string): string[] {
  return boxShadow.split(/,(?![^(]*\))/).filter((layer) => layer.trim())
}

function expectFloating(panel: HTMLElement) {
  expect(panel).toHaveStyle({ backgroundColor: OVERLAY })
  const layers = shadowLayers(panel.style.boxShadow)
  expect(layers[0]).toContain('inset 0 1px 0 rgba(255,255,255,0.12)')
  // Three ambient layers under the rim: the floating shadow, not a content lift.
  expect(layers.slice(1)).toHaveLength(3)
  expect(panel.style.borderTopWidth).toBe('')
}

/** Open the overlay, then assert the panel wrapping `contentText`. */
function expectFloatingPanelAround(contentText: string) {
  expectFloating(panelAround(screen.getByText(contentText)))
}

const options = [
  { value: '1', label: 'Apple' },
  { value: '2', label: 'Banana' },
]

describe('floating overlay depth', () => {
  it('Menu list floats on the overlay plane with no ring', () => {
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
    expectFloatingPanelAround('Edit')
  })

  it('Popover content floats on the overlay plane with no ring', () => {
    render(
      <Popover>
        <PopoverTrigger>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent>
          <span>Popover body</span>
        </PopoverContent>
      </Popover>
    )
    fireEvent.click(screen.getByText('Open'))
    expectFloatingPanelAround('Popover body')
  })

  it('Tooltip box floats on the overlay plane with no ring', () => {
    render(
      <Tooltip label="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )
    fireEvent.mouseEnter(screen.getByText('Hover me').closest('[tabindex]')!)
    expectFloatingPanelAround('Tooltip text')
  })

  it('HelpTip bubble floats on the overlay plane with no ring', () => {
    render(<HelpTip content="Help text" />)
    fireEvent.click(screen.getByRole('button', { name: 'Show help information' }))
    expectFloatingPanelAround('Help text')
  })

  it('Select dropdown floats on the overlay plane with no ring', () => {
    render(<Select options={options} />)
    fireEvent.click(screen.getByRole('combobox'))
    expectFloatingPanelAround('Banana')
  })

  it('Autocomplete dropdown floats on the overlay plane with no ring', () => {
    render(<Autocomplete options={options} placeholder="Search" />)
    fireEvent.focus(screen.getByPlaceholderText('Search'))
    expectFloatingPanelAround('Banana')
  })

  it('Drawer panel floats on the overlay plane with no ring', () => {
    render(
      <Drawer isOpen onClose={vi.fn()} title="Test Drawer">
        <DrawerBody>Drawer body</DrawerBody>
      </Drawer>
    )
    expectFloatingPanelAround('Drawer body')
  })

  it('Modal content floats on the deepest lift with no ring', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <ModalContent>
          <ModalBody>Modal body</ModalBody>
        </ModalContent>
      </Modal>
    )
    expectFloatingPanelAround('Modal body')
  })

  it('Toast floats on the deepest lift with no ring', () => {
    render(<Toast title="Saved" />)
    // Its `border-l-4` status stripe is a colour accent on one edge, not a ring,
    // and rides the className rather than the inline style asserted here.
    expectFloatingPanelAround('Saved')
  })
})
