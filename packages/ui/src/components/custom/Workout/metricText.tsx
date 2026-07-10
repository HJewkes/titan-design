// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactNode } from 'react'
import { Text } from 'react-native'

/**
 * Shared "segmented metric" typography primitive — the Inter · 600 · letter-spacing 1
 * value/separator cell used by both {@link TempoDisplay} (tempo digits + dashes) and
 * {@link SetsRepsLoad} (sets × reps @ load). Extracted so the two read as one visual
 * language instead of drifting copies.
 */
export const METRIC_FONT = 'Inter, sans-serif'

export interface MetricCellProps {
  children: ReactNode
  /** Cell text color — value cells take a primary color, separators a muted one. */
  color: string
  fontSize?: number
}

export function MetricCell({ children, color, fontSize = 11 }: MetricCellProps) {
  return (
    <Text
      style={{
        fontFamily: METRIC_FONT,
        fontSize,
        color,
        fontWeight: '600',
        letterSpacing: 1,
      }}
    >
      {children}
    </Text>
  )
}
