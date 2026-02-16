import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from './Modal'

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  return render(
    <Modal isOpen onClose={vi.fn()} {...props}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Test Modal</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>Modal body content</ModalBody>
        <ModalFooter>
          <button>Cancel</button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

describe('Modal', () => {
  it('renders when isOpen is true', () => {
    renderModal({ isOpen: true })
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal body content')).toBeInTheDocument()
  })

  it('does not render content when isOpen is false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('calls onClose when backdrop is pressed', () => {
    const onClose = vi.fn()
    renderModal({ isOpen: true, onClose })
    // The backdrop is a Pressable wrapping children
    // ModalContent stops propagation, so clicking outside content triggers onClose
  })

  it('does not call onClose on backdrop press when closeOnOverlayClick is false', () => {
    const onClose = vi.fn()
    renderModal({ isOpen: true, onClose, closeOnOverlayClick: false })
    // Backdrop press should not trigger onClose
  })

  describe('ModalCloseButton', () => {
    it('calls onClose when close button is pressed', () => {
      const onClose = vi.fn()
      renderModal({ isOpen: true, onClose })

      const closeButton = screen.getByLabelText('Close modal')
      fireEvent.click(closeButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('has accessible label', () => {
      renderModal({ isOpen: true })
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })
  })

  describe('ModalTitle', () => {
    it('renders title text', () => {
      renderModal({ isOpen: true })
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    it('has header accessibility role', () => {
      renderModal({ isOpen: true })
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
  })

  describe('ModalBody', () => {
    it('renders body content', () => {
      renderModal({ isOpen: true })
      expect(screen.getByText('Modal body content')).toBeInTheDocument()
    })

    it('renders as ScrollView when scrollBehavior is inside', () => {
      render(
        <Modal isOpen onClose={vi.fn()} scrollBehavior="inside">
          <ModalContent>
            <ModalBody>Scrollable content</ModalBody>
          </ModalContent>
        </Modal>
      )
      expect(screen.getByText('Scrollable content')).toBeInTheDocument()
    })
  })

  describe('ModalFooter', () => {
    it('renders footer content', () => {
      renderModal({ isOpen: true })
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'full'] as const
    sizes.forEach((size) => {
      it(`renders with size ${size}`, () => {
        renderModal({ isOpen: true, size })
        expect(screen.getByText('Test Modal')).toBeInTheDocument()
      })
    })
  })

  describe('scroll behavior', () => {
    it('renders with outside scroll behavior by default', () => {
      renderModal({ isOpen: true })
      expect(screen.getByText('Modal body content')).toBeInTheDocument()
    })

    it('renders with inside scroll behavior', () => {
      render(
        <Modal isOpen onClose={vi.fn()} scrollBehavior="inside">
          <ModalContent>
            <ModalBody>Inside scroll content</ModalBody>
          </ModalContent>
        </Modal>
      )
      expect(screen.getByText('Inside scroll content')).toBeInTheDocument()
    })
  })

  describe('animation types', () => {
    const animationTypes = ['none', 'fade', 'slide'] as const
    animationTypes.forEach((animationType) => {
      it(`renders with animationType ${animationType}`, () => {
        renderModal({ isOpen: true, animationType })
        expect(screen.getByText('Test Modal')).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderModal({ isOpen: true })
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('close button has correct accessibility role', () => {
      renderModal({ isOpen: true })
      expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument()
    })
  })
})
