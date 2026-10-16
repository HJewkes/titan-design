// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { Typography } from '../typography'

export interface EyebrowProps {
  children: ReactNode
  className?: string
}

/**
 * Eyebrow — an uppercase micro-label used above a value or a section of
 * content (e.g. "Focused · by rank", a stat tile's caption). Composes
 * {@link Typography}'s `overline` variant; never hand-roll the letter-spacing.
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <Typography variant="overline" color="secondary" className={className}>
      {children}
    </Typography>
  )
}
