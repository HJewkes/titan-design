export type ToastStatus = 'success' | 'error' | 'warning' | 'info'

// `-subtle` is the wash ladder's lightest rung. It replaces a `/10` opacity
// modifier, which emitted no rule at all against a var()-backed token (VW-308).
export const statusStyles: Record<ToastStatus, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-status-success-subtle',
    border: 'border-status-success',
    icon: '✓',
  },
  error: {
    bg: 'bg-status-error-subtle',
    border: 'border-status-error',
    icon: '✕',
  },
  warning: {
    bg: 'bg-status-warning-subtle',
    border: 'border-status-warning',
    icon: '⚠',
  },
  info: {
    bg: 'bg-status-info-subtle',
    border: 'border-status-info',
    icon: 'ℹ',
  },
}

export const iconColors: Record<ToastStatus, string> = {
  success: 'text-status-success',
  error: 'text-text-error',
  warning: 'text-status-warning',
  info: 'text-status-info',
}

export const toastRole = (status: ToastStatus) => (status === 'error' ? 'alert' : 'status')
