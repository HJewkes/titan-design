import type React from 'react'

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }

/** The name a sortable header announces: `sortLabel`, else `tooltip`, else string children. */
export function sortName(
  sortLabel: string | undefined,
  tooltip: string | undefined,
  children: React.ReactNode
): string | undefined {
  const name = sortLabel ?? tooltip ?? (typeof children === 'string' ? children : undefined)
  if (!name && process.env.NODE_ENV !== 'production') {
    console.warn('TableHeaderCell: pass `sortLabel` when `children` is not a string.')
  }
  return name
}
