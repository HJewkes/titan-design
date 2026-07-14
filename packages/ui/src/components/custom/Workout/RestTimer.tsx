// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, Pressable } from 'react-native'
import { resolveColor } from '../../../theme/resolve-color'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useTimer } from '../../../hooks/useTimer'
import { CircularTimer } from '../CircularTimer/CircularTimer'

const BRAND_PRIMARY = getSemanticColors('dark')['brand-primary']

/** Default `ring` diameter (px) — the across-the-room wall rest treatment. */
const RING_DEFAULT_SIZE = 180

export interface RestTimerProps {
  totalSeconds: number
  elapsedMs: number
  onSkip: () => void
  onAddTime: () => void
  nextSetInfo?: string
  visible: boolean
  /** Passive/poll-only mode: hides the Skip and +30s controls, keeps the countdown, progress bar, and next-set line. */
  displayOnly?: boolean
  /**
   * `bar` (default) — the compact linear card (REST label + mm:ss + progress bar +
   * controls), the mobile bottom-bar treatment. `ring` — the across-the-room wall
   * treatment: a draining countdown ring (composes {@link CircularProgress}) with a
   * big remaining-seconds numeral, the next-set line, and the same controls.
   */
  variant?: 'bar' | 'ring'
  /** `ring` diameter in px. Default 180. */
  size?: number
}

/** The +30s / Skip control row — shared by both variants (hidden in `displayOnly`). */
function RestActions({ onAddTime, onSkip }: { onAddTime: () => void; onSkip: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable
        onPress={onAddTime}
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          paddingVertical: 8,
          paddingHorizontal: 20,
          borderRadius: 8,
        }}
        accessibilityRole="button"
        accessibilityLabel="Add 30 seconds"
        testID="rest-timer-add-time"
      >
        <Text
          className="text-text-secondary"
          style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: '600' }}
        >
          +30s
        </Text>
      </Pressable>
      <Pressable
        onPress={onSkip}
        style={{
          backgroundColor: 'rgba(255,121,0,0.12)',
          paddingVertical: 8,
          paddingHorizontal: 20,
          borderRadius: 8,
        }}
        accessibilityRole="button"
        accessibilityLabel="Skip rest"
        testID="rest-timer-skip"
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            color: BRAND_PRIMARY,
          }}
        >
          Skip
        </Text>
      </Pressable>
    </View>
  )
}

interface RestTimerRingProps {
  totalSeconds: number
  elapsedMs: number
  remainingSec: number
  done: boolean
  size: number
  nextSetInfo?: string
  displayOnly: boolean
  onSkip: () => void
  onAddTime: () => void
}

/**
 * The `ring` render: the wall rest treatment. Composes the generic {@link CircularTimer}
 * (which owns the arc + mm:ss readout + the fill-green "GO" done state), passing the
 * shared {@link RestActions} as its controls, and adds the rest-specific next-set footer
 * caption below. Rest-domain chrome only — the timer mechanics live in `CircularTimer`.
 */
function RestTimerRing({
  totalSeconds,
  elapsedMs,
  remainingSec,
  done,
  size,
  nextSetInfo,
  displayOnly,
  onSkip,
  onAddTime,
}: RestTimerRingProps) {
  const a11yLabel = done
    ? 'Rest complete, next set ready'
    : `Rest timer, ${Math.max(0, remainingSec)} seconds remaining`
  return (
    <View style={{ alignItems: 'center', gap: 16 }} testID="rest-timer">
      <CircularTimer
        durationMs={totalSeconds * 1000}
        elapsedMs={elapsedMs}
        mode="down"
        size={size}
        doneLabel="GO"
        doneColor="success"
        accessibilityLabel={a11yLabel}
        controls={!displayOnly ? <RestActions onAddTime={onAddTime} onSkip={onSkip} /> : undefined}
        testID="rest-timer-ring"
      />
      {nextSetInfo != null && (
        <Text
          className="text-text-tertiary"
          style={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}
          testID="rest-timer-next-set"
        >
          {nextSetInfo}
        </Text>
      )}
    </View>
  )
}

export function RestTimer({
  totalSeconds,
  elapsedMs,
  onSkip,
  onAddTime,
  nextSetInfo,
  visible,
  displayOnly = false,
  variant = 'bar',
  size = RING_DEFAULT_SIZE,
}: RestTimerProps) {
  // useTimer owns the countdown math (remaining/progress/mm:ss); a zero-duration
  // timer is complete, which keeps the width out of the 0/0 === NaN case.
  const {
    remainingMs,
    progress,
    label: timeDisplay,
    done,
  } = useTimer({
    mode: 'down',
    durationMs: totalSeconds * 1000,
    elapsedMs,
  })
  const remainingSec = Math.ceil(remainingMs / 1000)
  const progressPct = progress * 100

  if (!visible) return null

  if (variant === 'ring') {
    return (
      <RestTimerRing
        totalSeconds={totalSeconds}
        elapsedMs={elapsedMs}
        remainingSec={remainingSec}
        done={done}
        size={size}
        nextSetInfo={nextSetInfo}
        displayOnly={displayOnly}
        onSkip={onSkip}
        onAddTime={onAddTime}
      />
    )
  }

  return (
    <View
      className="bg-surface-raised"
      style={{
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: resolveColor('border-default'),
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
      accessibilityRole="timer"
      accessibilityLabel={`Rest timer, ${remainingSec} seconds remaining`}
      testID="rest-timer"
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        {/* Left side */}
        <View style={{ flexDirection: 'column' }}>
          <Text
            className="text-text-secondary"
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
            testID="rest-timer-label"
          >
            REST
          </Text>
          {nextSetInfo != null && (
            <Text
              className="text-text-tertiary"
              style={{
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
                marginTop: 2,
              }}
              testID="rest-timer-next-set"
            >
              {nextSetInfo}
            </Text>
          )}
        </View>

        {/* Right side - time display */}
        <Text
          className="text-text-primary"
          style={{
            fontSize: 28,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
            letterSpacing: -0.5,
          }}
          testID="rest-timer-time"
        >
          {timeDisplay}
        </Text>
      </View>

      {/* Progress bar */}
      <View
        className="bg-border"
        style={{
          height: 3,
          borderRadius: 2,
          marginBottom: 12,
        }}
        testID="rest-timer-progress-track"
      >
        <View
          style={{
            height: '100%',
            backgroundColor: BRAND_PRIMARY,
            borderRadius: 2,
            width: `${progressPct}%`,
          }}
          testID="rest-timer-progress-fill"
        />
      </View>

      {/* Actions row — hidden in display-only (poll-only) mode */}
      {!displayOnly && <RestActions onAddTime={onAddTime} onSkip={onSkip} />}
    </View>
  )
}
