import { Fragment, type ReactNode } from 'react'
import { View, Text } from 'react-native'
import { alpha } from '../../../utils/colors'

/** Splits `text` into nodes, bolding any segment that exactly matches a highlight. */
function renderCoachingText(text: string, highlights?: string[]): ReactNode {
  if (!highlights || highlights.length === 0) return text
  const escaped = highlights.filter(Boolean).map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (escaped.length === 0) return text
  const regex = new RegExp(`(${escaped.join('|')})`, 'g')
  return text.split(regex).map((part, index) =>
    highlights.includes(part) ? (
      <Text key={`${part}-${index}`} className="text-text-primary" style={{ fontWeight: '700' }}>
        {part}
      </Text>
    ) : (
      <Fragment key={`t-${index}`}>{part}</Fragment>
    )
  )
}

export function CoachingCallout({
  coaching,
  warning,
}: {
  coaching: { text: string; highlights?: string[] }
  warning: string
}) {
  return (
    <View
      className="py-2.5 px-inset-md"
      style={{
        backgroundColor: alpha(warning, 0.06),
        borderWidth: 1,
        borderColor: alpha(warning, 0.15),
        borderRadius: 8,
      }}
      testID="meso-status-card-coaching"
    >
      <Text
        className="text-text-secondary"
        style={{
          fontSize: 12,
          lineHeight: 17,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {renderCoachingText(coaching.text, coaching.highlights)}
      </Text>
    </View>
  )
}

export function NextTargetCallout({
  nextTarget,
  success,
}: {
  nextTarget: { icon: string; text: string }
  success: string
}) {
  return (
    <View
      className="flex-row items-center gap-inline-md py-2.5 px-inset-md"
      style={{
        backgroundColor: alpha(success, 0.06),
        borderWidth: 1,
        borderColor: alpha(success, 0.2),
        borderRadius: 8,
      }}
      testID="meso-status-card-next-target"
    >
      <Text style={{ fontSize: 14, color: success }} accessibilityElementsHidden>
        {nextTarget.icon}
      </Text>
      <Text
        style={{
          flexShrink: 1,
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          color: success,
        }}
      >
        {nextTarget.text}
      </Text>
    </View>
  )
}
