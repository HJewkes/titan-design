// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { Text, Pressable, Animated } from 'react-native'
import { space } from '../../../theme/tokens/semantic'
import { formatVelocity } from '../../../utils/workout-format'
import { SetBarChart } from '../charts/SetBarChart'
import { getLossStyle } from './velocity-scale'
import { setAccessibilityLabel } from './velocity-slots'
import type { VelocityStripChrome, VelocityStripVariantProps } from './velocity-strip-model'

export function VelocityStripFramed({ chart, summary, chrome }: VelocityStripVariantProps) {
  const { set, slots, barColorFor, height, scale, scaleMax, targetReps, className, props } = chart
  const { repCount, meanVelocity, meanZone, lastLoss, loss, lossThresholds, mode } = summary
  const { expanded, onToggle, onRepPress, showInfo, expandProgress, infoOpacity } = chrome
  const stripLabel = set
    ? `${setAccessibilityLabel(set, repCount)}, tap to ${expanded ? 'collapse' : 'expand'}`
    : `Velocity chart for set, ${repCount} reps, tap to ${expanded ? 'collapse' : 'expand'}`
  // When onToggle wraps the strip or individual reps are interactive, the container itself is not a button
  const hasInteractiveContainer = onToggle != null
  const hasInteractiveReps = onRepPress != null && expanded

  const renderFramedBarOverlay = framedBarOverlay(chrome)

  // The framed chrome is a WRAPPER (raised box + info row + tap-to-collapse) around ONE SetBarChart
  // in value mode; the collapse is the in-place `expandProgress` bar-height morph, not a height strip.
  const stripContent = (
    <Animated.View
      className={className}
      // NativeWind does not compile className on an `Animated.View` — verified in
      // Storybook, where the element renders `class="css-view-175oi2r"` and nothing
      // else — so this chrome reads the inset tokens through the JS export.
      style={{
        width: '100%',
        borderRadius: 6,
        paddingTop: space.inset.lg,
        paddingBottom: showInfo ? space.inset.sm : space.inset.xs,
      }}
      accessibilityRole={hasInteractiveContainer || hasInteractiveReps ? 'none' : 'button'}
      accessibilityLabel={hasInteractiveContainer || hasInteractiveReps ? undefined : stripLabel}
      testID="velocity-strip"
      {...props}
    >
      <SetBarChart
        slots={slots}
        colorFor={barColorFor}
        height={height}
        scale={scale}
        scaleMax={scaleMax}
        expandProgress={expandProgress}
        renderBarOverlay={renderFramedBarOverlay}
        targetReps={set ? undefined : targetReps}
        barRadius={2}
        cornerStyle="top"
        hideBaseline
        testIDPrefix="velocity"
      />
      {!!expanded && !!showInfo && (
        <Animated.View
          // Same `Animated.View` limitation as the strip above: style, not className.
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            opacity: infoOpacity,
            // eslint-disable-next-line titan/no-raw-spacing -- chart geometry
            marginTop: 6,
            // eslint-disable-next-line titan/no-raw-spacing -- chart geometry
            paddingHorizontal: 6,
          }}
          testID="velocity-info-row"
        >
          <Text
            className="text-text-secondary"
            style={{ fontSize: 10, fontFamily: 'Inter, sans-serif' }}
          >
            {meanZone} {'·'} {formatVelocity(meanVelocity)} m/s
          </Text>
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              ...getLossStyle(lastLoss, lossThresholds, mode),
            }}
          >
            Loss: {loss}%
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )

  if (onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={stripLabel}
        testID="velocity-strip-pressable"
      >
        {stripContent}
      </Pressable>
    )
  }

  return stripContent
}

// Per-bar overlay handed to SetBarChart so the framed chart keeps its m/s label (fading with the
// expand) + its onRepPress hit-target WITHOUT re-rolling bars — one bar-rendering path remains.
function framedBarOverlay(chrome: VelocityStripChrome) {
  const { expanded, onRepPress, showNumbers, expandProgress } = chrome
  const needsBarOverlay = showNumbers || onRepPress != null
  return needsBarOverlay
    ? (repIndex: number, value: number) => (
        <>
          {!!showNumbers && (
            <Animated.View
              style={{
                opacity: expandProgress,
                position: 'absolute',
                top: -13,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
              accessibilityElementsHidden
              pointerEvents="none"
            >
              <Text
                className="text-text-secondary"
                style={{ fontSize: 8, fontWeight: '600' }}
                testID={`velocity-label-${repIndex}`}
              >
                {formatVelocity(value)}
              </Text>
            </Animated.View>
          )}
          {!!onRepPress && !!expanded && (
            <Pressable
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
              onPress={() => onRepPress(repIndex, value)}
              accessibilityRole="button"
              accessibilityLabel={`Rep ${repIndex + 1}: ${formatVelocity(value)} meters per second, tap for details`}
              testID={`velocity-bar-pressable-${repIndex}`}
            />
          )}
        </>
      )
    : undefined
}
