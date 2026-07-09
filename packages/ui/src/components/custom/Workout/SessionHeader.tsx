// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { StatusDot } from './StatusDot'

const t = getSemanticColors('dark')

// The raised charcoal heading plane (charcoal 400) — reads as one flat surface with
// the nav; depth lives on the sunk list below it, not here.
const RAISED = primitiveColors.charcoal[400] // #1F1F1F

export interface SessionHeaderProps extends ViewProps {
  /** Session title, e.g. "Pull A · Intensification". */
  title: string
  /** Mono progress sub-line, e.g. "ex 3/5 · set 2 live". */
  status?: string
  /** Small uppercase eyebrow above the title. Default "Live session". */
  eyebrow?: string
  /** Show the live status dot beside the eyebrow. Default true. */
  live?: boolean
  className?: string
}

/**
 * The session-rail heading chrome: an uppercase eyebrow (with an optional live
 * {@link StatusDot}) over the session title and a mono status sub-line. Rendered on
 * the raised charcoal plane. Presentational — the standalone heading that
 * {@link SessionRail} mounts at the top of the rail.
 */
export function SessionHeader({
  title,
  status,
  eyebrow = 'Live session',
  live = true,
  className,
  style,
  ...props
}: SessionHeaderProps) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: RAISED,
          paddingHorizontal: 12,
          paddingTop: 11,
          paddingBottom: 10,
          zIndex: 2,
        },
        style,
      ]}
      testID="session-rail-header"
      {...props}
    >
      {eyebrow && (
        <View className="flex-row items-center" style={{ gap: 5 }} testID="session-rail-eyebrow">
          {live && <StatusDot variant="success" size="sm" />}
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: t['text-tertiary'],
            }}
          >
            {eyebrow}
          </Text>
        </View>
      )}
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 14,
          fontWeight: '700',
          fontFamily: '"Space Grotesk", sans-serif',
          color: t['text-primary'],
          marginTop: 3,
        }}
        testID="session-rail-title"
      >
        {title}
      </Text>
      {status && (
        <Text
          style={{
            fontSize: 10,
            fontFamily: 'monospace',
            color: t['text-secondary'],
            marginTop: 2,
          }}
          testID="session-rail-status"
        >
          {status}
        </Text>
      )}
    </View>
  )
}
