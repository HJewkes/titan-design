import { useEffect } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { Modal } from '../components/ui/modal'
import { Drawer } from '../components/ui/drawer'
import { ToastProvider, useToast } from '../components/ui/toast'
import { TipTrigger } from '../components/ui/tooltip'
import { WEB_MODAL_LAYER_Z_INDEX } from '../utils/overlay-z-index'

/** The outermost ancestor carrying a numeric z-index: the layer the element stacks on. */
function stackingLayerZIndex(element: HTMLElement): number {
  let layer = Number.NaN
  for (let node: HTMLElement | null = element; node && node !== document.body; ) {
    const zIndex = Number(getComputedStyle(node).zIndex)
    if (Number.isFinite(zIndex) && zIndex !== 0) layer = zIndex
    node = node.parentElement
  }
  return layer
}

function ToastOnMount() {
  const { addToast } = useToast()
  useEffect(() => {
    addToast({ title: 'Saved', status: 'success', duration: 0 })
  }, [addToast])
  return null
}

function renderInsideOpenModal() {
  render(
    <ToastProvider>
      <Modal isOpen onClose={() => {}} animationType="none">
        <Text>Dialog body</Text>
        <TipTrigger label="Goal status" content={<Text>Tip body</Text>} testID="tip">
          <Text>Behind</Text>
        </TipTrigger>
        <ToastOnMount />
      </Modal>
    </ToastProvider>
  )
  act(() => {
    fireEvent.focus(screen.getByTestId('tip'))
  })
}

describe('body-level overlays over an open modal', () => {
  it('reads the react-native-web modal layer this module assumes', () => {
    renderInsideOpenModal()
    expect(stackingLayerZIndex(screen.getByText('Dialog body'))).toBe(WEB_MODAL_LAYER_Z_INDEX)
  })

  it('paints a portaled tooltip above the open modal', () => {
    renderInsideOpenModal()
    const modalLayer = stackingLayerZIndex(screen.getByText('Dialog body'))
    expect(stackingLayerZIndex(screen.getByTestId('tooltip-portal'))).toBeGreaterThan(modalLayer)
  })

  it('paints a toast above the open modal and under the tooltip', () => {
    renderInsideOpenModal()
    const modalLayer = stackingLayerZIndex(screen.getByText('Dialog body'))
    const toastLayer = stackingLayerZIndex(screen.getByText('Saved'))
    expect(toastLayer).toBeGreaterThan(modalLayer)
    expect(toastLayer).toBeLessThan(stackingLayerZIndex(screen.getByTestId('tooltip-portal')))
  })

  it('shares the modal layer with an open drawer', () => {
    render(
      <Drawer isOpen onClose={() => {}}>
        <Text>Drawer body</Text>
      </Drawer>
    )
    expect(stackingLayerZIndex(screen.getByText('Drawer body'))).toBe(WEB_MODAL_LAYER_Z_INDEX)
  })
})
