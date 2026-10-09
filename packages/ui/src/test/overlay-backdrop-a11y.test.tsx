import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { Drawer } from '../components/ui/drawer'
import { Modal, ModalBody, ModalContent } from '../components/ui/modal'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Select } from '../components/ui/select'

// Drawer, Popover and Select paint their backdrop as an empty sibling just before the
// panel, so it is the first empty element preceding an ancestor of the panel's content.
function backdropBefore(content: HTMLElement): HTMLElement {
  for (let node: HTMLElement | null = content; node; node = node.parentElement) {
    const previous = node.previousElementSibling
    if (previous instanceof HTMLElement && previous.childElementCount === 0) return previous
  }
  throw new Error('No backdrop precedes the overlay content')
}

function openDrawer() {
  render(
    <Drawer isOpen onClose={() => {}} title="Filters">
      <Text>Drawer body</Text>
    </Drawer>
  )
  return backdropBefore(screen.getByText('Drawer body'))
}

function openPopover() {
  render(
    <Popover>
      <PopoverTrigger>
        <Text>Open</Text>
      </PopoverTrigger>
      <PopoverContent>
        <Text>Popover body</Text>
      </PopoverContent>
    </Popover>
  )
  fireEvent.click(screen.getByText('Open'))
  return backdropBefore(screen.getByText('Popover body'))
}

function openSelect() {
  render(
    <Select
      accessibilityLabel="Fruit"
      options={[{ value: 'apple', label: 'Apple' }]}
      value={null}
      onChange={() => {}}
    />
  )
  fireEvent.click(screen.getByRole('combobox'))
  return backdropBefore(screen.getByRole('option', { name: 'Apple' }))
}

// axe runs on the backdrop subtree: a scan of the whole body also reports the Select
// listbox and the Drawer's pre-animation dialog, which this file does not cover.
describe('overlay backdrops are out of the tab order and hidden from assistive tech', () => {
  it.each([
    ['Drawer', openDrawer],
    ['Popover', openPopover],
    ['Select', openSelect],
  ])('%s backdrop renders tabindex="-1" and aria-hidden="true"', async (_name, open) => {
    const backdrop = open()

    expect(backdrop).toHaveAttribute('tabindex', '-1')
    expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    expect(await axe(backdrop)).toHaveNoViolations()
  })

  // Modal's backdrop wraps the dialog content, so aria-hidden on it would hide the dialog.
  it('Modal backdrop renders tabindex="-1" and leaves the dialog content exposed', async () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <ModalContent>
          <ModalBody>
            <Text>Modal body</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
    const backdrop = screen
      .getByText('Modal body')
      .closest<HTMLElement>('[aria-modal="true"] [tabindex]')

    expect(backdrop).toHaveAttribute('tabindex', '-1')
    expect(backdrop).not.toHaveAttribute('aria-hidden')
    expect(await axe(backdrop!)).toHaveNoViolations()
  })
})
