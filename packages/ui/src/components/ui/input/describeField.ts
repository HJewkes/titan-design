interface FieldMessages {
  isInvalid?: boolean
  errorMessage?: string
  helperText?: string
}

/** Which message shows under the field, and the ARIA attributes that link it to the control. */
export function describeField(
  { isInvalid, errorMessage, helperText }: FieldMessages,
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
