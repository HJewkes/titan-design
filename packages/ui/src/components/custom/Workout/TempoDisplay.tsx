// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState, useCallback, type ReactNode } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { roundTempo } from '../../../utils/workout-format'
import { useSurfaceMode } from '../../ui/surface'
import type { TempoLiveReadout } from '../Fatigue/tempo-pacing'
import { tempoColors, type TempoLiveState } from './tempoDisplayModel'
import { LiveTempoRow, TempoSeparator, TempoValue } from './tempoDisplayParts'

export type { TempoLiveReadout }
export type { TempoLivePhase, TempoLiveState } from './tempoDisplayModel'

export interface TempoDisplayProps extends ViewProps {
  /** Tempo values: [eccentric, pauseBottom, concentric, pauseTop] in seconds */
  tempo: [number, number, number, number]
  size?: 'sm' | 'md'
  /** Override the digit font size (px). Defaults from `size` (9 sm / 11 md); raise for a wall read-out. */
  fontSize?: number
  /** Show the "TEMPO" caption before the values. Default true. */
  showLabel?: boolean
  /** Show info tooltip on press */
  showInfo?: boolean
  /**
   * When set, renders a live phase-fill: the active phase digit fills against
   * its prescribed duration and inactive phases dim. Omit for the static
   * prescription string (default, backward compatible).
   */
  live?: TempoLiveState
  /** Active-phase readout when `live`: `countdown` remaining to 0.0 (default), or `countup` elapsed. */
  liveReadout?: TempoLiveReadout
  onPress?: () => void
  className?: string
}

const INTER = 'Inter, sans-serif'

type TempoColors = ReturnType<typeof tempoColors>
type TempoValues = [number, number, number, number]

/** A press runs `onPress`, then toggles the tooltip when `showInfo` is set. */
function useTooltipToggle(onPress: (() => void) | undefined, showInfo: boolean) {
  const [showTooltip, setShowTooltip] = useState(false)
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress()
    }
    if (showInfo) {
      setShowTooltip((prev) => !prev)
    }
  }, [onPress, showInfo])
  return [showTooltip, handlePress] as const
}

/** Static prescription: the phase-coloured lockup (the same colours the live row rests at). */
function StaticTempoRow({
  values: [eccentric, pauseBottom, concentric, pauseTop],
  phase,
  fontSize,
}: {
  values: TempoValues
  phase: TempoColors['phase']
  fontSize: number
}) {
  return (
    <>
      <TempoValue value={eccentric} color={phase.eccentric} fontSize={fontSize} />
      <TempoSeparator color={phase.dash} fontSize={fontSize} />
      <TempoValue value={pauseBottom} color={phase.pauseBottom} fontSize={fontSize} />
      <TempoSeparator color={phase.dash} fontSize={fontSize} />
      <TempoValue value={concentric} color={phase.concentric} fontSize={fontSize} />
      <TempoSeparator color={phase.dash} fontSize={fontSize} />
      <TempoValue value={pauseTop} color={phase.pauseTop} fontSize={fontSize} />
    </>
  )
}

function TooltipLine({ color, children }: { color: string; children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 10,
        lineHeight: 16,
        color,
        fontFamily: INTER,
      }}
    >
      {children}
    </Text>
  )
}

function TempoTooltip({
  values: [eccentric, pauseBottom, concentric, pauseTop],
  colors: c,
}: {
  values: TempoValues
  colors: TempoColors
}) {
  return (
    <View
      className="items-center mb-stack-md"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: [{ translateX: '-50%' as unknown as number }],
        zIndex: 20,
      }}
      testID="tempo-tooltip"
    >
      <View
        className="py-inset-sm px-inset-md"
        style={{
          backgroundColor: c.overlay,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: c.overlayEdge,
        }}
      >
        <TooltipLine color={c.textSecondary}>Eccentric: {eccentric}s</TooltipLine>
        <TooltipLine color={c.textSecondary}>Pause (bottom): {pauseBottom}s</TooltipLine>
        <TooltipLine color={c.textSecondary}>Concentric: {concentric}s</TooltipLine>
        <TooltipLine color={c.textSecondary}>Pause (top): {pauseTop}s</TooltipLine>
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderTopWidth: 5,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: c.overlayEdge,
        }}
      />
    </View>
  )
}

export function TempoDisplay({
  tempo,
  size = 'md',
  fontSize: fontSizeProp,
  showLabel = true,
  showInfo = true,
  live,
  liveReadout = 'countdown',
  onPress,
  className,
  ...props
}: TempoDisplayProps) {
  const c = tempoColors(useSurfaceMode())
  const [showTooltip, handlePress] = useTooltipToggle(onPress, showInfo)
  // Round exact (unrounded) tempo seconds to the 1-dp display granularity.
  const [eccentric, pauseBottom, concentric, pauseTop] = roundTempo(tempo)
  const values: TempoValues = [eccentric, pauseBottom, concentric, pauseTop]
  const isSm = size === 'sm'
  const fontSize = fontSizeProp ?? (isSm ? 9 : 11)
  // The chrome (padding, radius, label) scales with the digit size so the whole view stays
  // proportional at any form factor — a compact rail chip up to a wall read-out. Exempt
  // from the AW-142 className migration: em-proportional spacing no fixed rung expresses.
  const chromePadX = Math.round(fontSize * 0.6)
  const chromePadY = Math.round(fontSize * 0.3)
  const chromeRadius = Math.round(fontSize * 0.4)
  const labelFont = Math.max(9, Math.round(fontSize * 0.5))

  const content = (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface,
        paddingHorizontal: chromePadX,
        paddingVertical: chromePadY,
        borderRadius: chromeRadius,
      }}
      {...props}
    >
      {showLabel && (
        <Text
          style={{
            fontFamily: INTER,
            fontSize: labelFont,
            fontWeight: '500',
            // Live-muted green while a rep is running, secondary text at rest.
            color: live ? c.liveLabel : c.label,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginRight: Math.round(fontSize * 0.5),
          }}
        >
          TEMPO
        </Text>
      )}
      <View style={{ flexDirection: 'row' }} testID="tempo-value">
        {live ? (
          <LiveTempoRow values={values} live={live} fontSize={fontSize} readout={liveReadout} />
        ) : (
          <StaticTempoRow values={values} phase={c.phase} fontSize={fontSize} />
        )}
      </View>
    </View>
  )

  const accessibilityLabel = `Tempo: ${eccentric} second eccentric, ${pauseBottom} second pause, ${concentric} second concentric, ${pauseTop} second pause`

  if (!onPress && !showInfo) {
    return (
      <View accessibilityLabel={accessibilityLabel} testID="tempo-display">
        {content}
      </View>
    )
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={handlePress}
      testID="tempo-display"
    >
      {content}
      {showTooltip && <TempoTooltip values={values} colors={c} />}
    </Pressable>
  )
}
