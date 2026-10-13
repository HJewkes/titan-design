// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { useOnSurfaceColor } from '../../ui/surface/SurfaceContext'
import { Typography } from '../../ui/typography'

const TIMES = '×' // × multiplication sign, padded by muted separators
const AT = '@'

export interface SetsRepsLoadProps extends ViewProps {
  sets: number
  reps: number | string
  /** Load value; a string (e.g. "—") passes through verbatim for an unset/discovery load. */
  load: number | string
  /** Displayed load unit label (e.g. "lb", "kg"). */
  unit?: string
  /** Cell font size (px). Default 11 — the compact rail/card scale. Raise for a wall read-out. */
  fontSize?: number
  /**
   * Flatten the whole run to one dimmer, regular-weight tone (the collapsed/upcoming
   * card row) instead of the bright bold value / muted separator split (the rail).
   * Also drops the `×` separator's padding spaces — "3×6", not "3 × 6".
   */
  muted?: boolean
  className?: string
}

/**
 * The `sets × reps @ load` prescription line, in the TempoDisplay visual language
 * (Typography `mono` · value cells with muted `×` / `@` separators).
 */
export function SetsRepsLoad({
  sets,
  reps,
  load,
  unit = 'lb',
  fontSize = 11,
  muted = false,
  className,
  ...props
}: SetsRepsLoadProps) {
  const primary = useOnSurfaceColor('primary')
  const tertiary = useOnSurfaceColor('tertiary')
  const secondary = useOnSurfaceColor('secondary')
  const value = muted ? secondary : primary
  const sep = muted ? secondary : tertiary
  const weight = muted ? ('400' as const) : ('600' as const)
  const cell = (color: string) => ({ color, fontSize, fontWeight: weight })
  const times = muted ? TIMES : ` ${TIMES} `

  return (
    <View
      className={className}
      style={{ flexDirection: 'row', alignItems: 'baseline' }}
      accessibilityLabel={`${sets} sets of ${reps} reps at ${load} ${unit}`}
      testID="sets-reps-load"
      {...props}
    >
      <Typography variant="mono" color="inherit" style={cell(value)}>
        {sets}
      </Typography>
      <Typography variant="mono" color="inherit" style={cell(sep)}>
        {times}
      </Typography>
      <Typography variant="mono" color="inherit" style={cell(value)}>
        {reps}
      </Typography>
      <Typography variant="mono" color="inherit" style={cell(sep)}>{` ${AT} `}</Typography>
      <Typography variant="mono" color="inherit" style={cell(value)}>
        {load}
      </Typography>
      <Typography variant="mono" color="inherit" style={cell(sep)}>{` ${unit}`}</Typography>
    </View>
  )
}
