import type { InputProps } from './Input'

/** Which message shows under the field, and the ARIA attributes that link it to the control. */
export function describeField(
  {
    isInvalid,
    errorMessage,
    helperText,
  }: Pick<InputProps, 'isInvalid' | 'errorMessage' | 'helperText'>,
  messageId: string
) {
  const showError = Boolean(isInvalid && errorMessage)
  const showHelper = !showError && Boolean(helperText)
  return {
    showError,
    showHelper,
    describedBy: showError || showHelper ? messageId : undefined,
    ariaInvalid: isInvalid ? true : undefined,
  }
}
