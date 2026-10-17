export type ToastStatus = 'success' | 'error' | 'warning' | 'info'

// `-subtle` is the wash ladder's lightest rung. It replaces a `/10` opacity
// modifier, which emitted no rule at all against a var()-backed token (VW-308).
export const statusStyles: Record<ToastStatus, { bg: string; border: string }> = {
  success: {
    bg: 'bg-status-success-subtle',
    border: 'border-status-success',
  },
  error: {
    bg: 'bg-status-error-subtle',
    border: 'border-status-error',
  },
  warning: {
    bg: 'bg-status-warning-subtle',
    border: 'border-status-warning',
  },
  info: {
    bg: 'bg-status-info-subtle',
    border: 'border-status-info',
  },
}

// Text glyphs for the statuses with no titan icon yet; success draws `CheckMark` (TD-840).
export const textGlyphs: Record<Exclude<ToastStatus, 'success'>, string> = {
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export const iconColors: Record<ToastStatus, string> = {
  success: 'text-text-success',
  error: 'text-text-error',
  warning: 'text-text-warning',
  info: 'text-text-info',
}

export const toastRole = (status: ToastStatus) => (status === 'error' ? 'alert' : 'status')
