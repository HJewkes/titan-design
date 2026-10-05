import { Text, Pressable } from 'react-native'
import type { ScatterPoint } from './scatterGeometry'

/** One pressable bubble, ringed when selected, labelled when large or selected. */
export function ScatterPointMark({
  point: p,
  isSelected,
  ringColor,
  onPress,
}: {
  point: ScatterPoint
  isSelected: boolean
  ringColor: string
  onPress?: (id: string) => void
}) {
  const showLabel = p.datum.label && (isSelected || p.radius >= 10)
  return (
    <Pressable
      testID={`scatter-point-${p.datum.id}`}
      accessibilityRole="button"
      accessibilityLabel={p.datum.label ?? p.datum.id}
      onPress={() => onPress?.(p.datum.id)}
      style={{
        position: 'absolute',
        left: p.cx - p.radius,
        top: p.cy - p.radius,
        width: p.radius * 2,
        height: p.radius * 2,
        borderRadius: p.radius,
        backgroundColor: p.color,
        opacity: isSelected ? 1 : 0.82,
        borderWidth: isSelected ? 2 : 0,
        borderColor: ringColor,
      }}
    >
      {showLabel && (
        <Text
          numberOfLines={1}
          className="text-[9px] font-semibold text-text-primary"
          style={{
            position: 'absolute',
            left: p.radius * 2 + 3,
            top: p.radius - 6,
            width: 80,
          }}
        >
          {p.datum.label}
        </Text>
      )}
    </Pressable>
  )
}
