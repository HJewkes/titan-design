import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'

import { Composer } from './Composer'

function type(text: string) {
  fireEvent.change(screen.getByTestId('chat-composer-input'), { target: { value: text } })
}

function sendButton() {
  return screen.getByTestId('chat-composer-send')
}

describe('Composer', () => {
  it('blocks sending an empty draft', () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    expect(sendButton()).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(sendButton())
    expect(onSend).not.toHaveBeenCalled()
  })

  it('blocks sending a whitespace-only draft', () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    type('   ')
    fireEvent.click(sendButton())
    expect(onSend).not.toHaveBeenCalled()
  })

  it('sends the trimmed draft and clears itself', () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    type('  Works for me. ')
    fireEvent.click(sendButton())
    expect(onSend).toHaveBeenCalledWith('Works for me.')
    expect(screen.getByTestId('chat-composer-input')).toHaveValue('')
  })

  it('sends on Enter', () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    type('ok')
    fireEvent.keyDown(screen.getByTestId('chat-composer-input'), { key: 'Enter' })
    expect(onSend).toHaveBeenCalledWith('ok')
  })

  it('keeps Shift+Enter for a line break', () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    type('ok')
    fireEvent.keyDown(screen.getByTestId('chat-composer-input'), { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('leaves a controlled draft to its owner and reports the clear', () => {
    const onSend = vi.fn()
    const onChangeText = vi.fn()
    render(<Composer onSend={onSend} value="draft" onChangeText={onChangeText} />)
    fireEvent.click(sendButton())
    expect(onSend).toHaveBeenCalledWith('draft')
    expect(onChangeText).toHaveBeenLastCalledWith('')
    expect(screen.getByTestId('chat-composer-input')).toHaveValue('draft')
  })

  it('refuses to send while disabled or already sending', () => {
    const onSend = vi.fn()
    const { rerender } = render(<Composer onSend={onSend} value="x" isDisabled />)
    fireEvent.click(sendButton())
    rerender(<Composer onSend={onSend} value="x" isSending />)
    fireEvent.click(sendButton())
    expect(onSend).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Composer onSend={() => {}} placeholder="Message Coach" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
