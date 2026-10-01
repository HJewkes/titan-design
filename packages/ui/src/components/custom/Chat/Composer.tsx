import { useState } from 'react'
import {
  Platform,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native'
import { cn } from '../../../utils/cn'
import { Button, ButtonText } from '../../ui/button'
import { Input } from '../../ui/input'
import { Surface } from '../../ui/surface'

export interface ComposerProps {
  /** Called with the trimmed text. The composer clears itself unless `value` is controlled. */
  onSend: (text: string) => void
  /** Controlled text. Omit to let the composer own its draft. */
  value?: string
  onChangeText?: (text: string) => void
  placeholder?: string
  isDisabled?: boolean
  /** Shows the send button as sending and blocks a second send. */
  isSending?: boolean
  maxLength?: number
  sendLabel?: string
  /** Shown on the send button while `isSending`, in place of a spinner. */
  sendingLabel?: string
  className?: string
}

type WebKeyEvent = NativeSyntheticEvent<TextInputKeyPressEventData> & {
  nativeEvent: TextInputKeyPressEventData & { shiftKey?: boolean; isComposing?: boolean }
  preventDefault?: () => void
}

// Enter sends and Shift+Enter breaks the line; IME composition must not send.
function isSubmitKey(event: WebKeyEvent): boolean {
  const { key, shiftKey, isComposing } = event.nativeEvent
  return Platform.OS === 'web' && key === 'Enter' && !shiftKey && !isComposing
}

function useDraft(value: string | undefined, onChangeText?: (text: string) => void) {
  const [ownDraft, setOwnDraft] = useState('')
  const isControlled = value !== undefined
  const draft = isControlled ? value : ownDraft
  const setDraft = (text: string) => {
    if (!isControlled) setOwnDraft(text)
    onChangeText?.(text)
  }
  return { draft, setDraft }
}

/**
 * The message input bar. It sits in normal flow at the bottom of its container,
 * so it stays above the keyboard without KeyboardAvoidingView (a no-op on web).
 * The send button appears inside the field once there is text to send, as in Messages,
 * so the field keeps the full width until then. Composes Surface + Input + Button.
 */
export function Composer({
  onSend,
  value,
  onChangeText,
  placeholder = 'Message',
  isDisabled = false,
  isSending = false,
  maxLength,
  sendLabel = 'Send',
  sendingLabel = 'Sending…',
  className,
}: ComposerProps) {
  const { draft, setDraft } = useDraft(value, onChangeText)
  const canSend = !isDisabled && !isSending && draft.trim().length > 0
  const send = () => {
    if (!canSend) return
    onSend(draft.trim())
    setDraft('')
  }
  const onKeyPress = (event: WebKeyEvent) => {
    if (!isSubmitKey(event)) return
    event.preventDefault?.()
    send()
  }
  const showSend = draft.trim().length > 0
  return (
    <Surface
      raise={1}
      rounded={false}
      className={cn('px-inset-md py-inset-sm', className)}
      testID="chat-composer"
    >
      <View className="justify-center">
        <Input
          value={draft}
          onChangeText={setDraft}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          accessibilityLabel={placeholder}
          isDisabled={isDisabled}
          maxLength={maxLength}
          multiline
          numberOfLines={1}
          inputClassName={cn('min-h-control-md max-h-40', showSend && 'pr-20')}
          testID="chat-composer-input"
        />
        {showSend ? (
          <View className="absolute right-inset-sm">
            <Button
              size="sm"
              onPress={send}
              isDisabled={!canSend}
              accessibilityLabel={isSending ? sendingLabel : sendLabel}
              testID="chat-composer-send"
            >
              <ButtonText>{isSending ? sendingLabel : sendLabel}</ButtonText>
            </Button>
          </View>
        ) : null}
      </View>
    </Surface>
  )
}
