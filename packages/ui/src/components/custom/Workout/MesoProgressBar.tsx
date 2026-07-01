// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, Pressable, Animated, type ViewProps } from 'react-native'

const BRAND_PRIMARY = '#FF7900'

export type MesoStatus = 'completed' | 'current' | 'upcoming'

export interface Meso {
  id: string
  name: string
  weekCount: number
  status: MesoStatus
  /**
   * 1-based week index of progress within a `current` meso.
   * Drives the solid fill width. Ignored for non-current mesos.
   */
  currentWeek?: number
}

export interface MesoProgressBarProps extends ViewProps {
  mesos: Meso[]
  activeMesoId: string | null
  onMesoPress: (mesoId: string) => void
  className?: string
}

const segmentBgColors: Record<MesoStatus, string> = {
  completed: 'rgba(20,184,166,0.3)',
  current: 'rgba(255,121,0,0.5)',
  upcoming: 'rgba(255,255,255,0.06)',
}

function clampProgress(currentWeek: number | undefined, weekCount: number): number {
  if (currentWeek == null || weekCount <= 0) return 0
  const ratio = currentWeek / weekCount
  return Math.max(0, Math.min(1, ratio))
}

interface SegmentProps {
  meso: Meso
  isActive: boolean
  onPress: (id: string) => void
}

function MesoSegment({ meso, isActive, onPress }: SegmentProps) {
  const [pressScale] = useState(() => new Animated.Value(1))

  const handlePressIn = () => {
    Animated.timing(pressScale, {
      toValue: 0.98,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }

  const progress = meso.status === 'current'
    ? clampProgress(meso.currentWeek, meso.weekCount)
    : 0

  // weekCount drives the segment's flex width; guard 0 / negative so flex stays
  // a valid positive value and the segment never collapses out of the layout.
  const segmentFlex = Math.max(1, meso.weekCount)

  return (
    <Pressable
      style={{ flex: segmentFlex }}
      onPress={() => onPress(meso.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${meso.name}, ${meso.status}`}
      testID={`meso-segment-${meso.id}`}
    >
      <Animated.View
        style={[
          {
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: segmentBgColors[meso.status],
            transform: [{ scale: pressScale }],
          },
          isActive
            ? {
                borderWidth: 2,
                borderColor: BRAND_PRIMARY,
                transform: [{ scale: 1.02 }, { scale: pressScale }],
              }
            : undefined,
        ]}
        testID={`meso-segment-inner-${meso.id}`}
      >
        {meso.status === 'current' && progress > 0 && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress * 100}%`,
              backgroundColor: BRAND_PRIMARY,
            }}
            testID={`meso-segment-fill-${meso.id}`}
          />
        )}
      </Animated.View>
    </Pressable>
  )
}

/**
 * Segmented horizontal bar of mesocycles. Each segment is tappable and its
 * flex width is proportional to the meso's `weekCount`. The active segment is
 * highlighted with a 2px brand border to stay in sync with MesoCard selection.
 *
 * @example
 * <MesoProgressBar
 *   mesos={[
 *     { id: 'm1', name: 'Accumulation', weekCount: 4, status: 'completed' },
 *     { id: 'm2', name: 'Intensification', weekCount: 3, status: 'current', currentWeek: 2 },
 *     { id: 'm3', name: 'Peak', weekCount: 2, status: 'upcoming' },
 *   ]}
 *   activeMesoId="m2"
 *   onMesoPress={(id) => console.log(id)}
 * />
 */
export function MesoProgressBar({
  mesos,
  activeMesoId,
  onMesoPress,
  className,
  ...props
}: MesoProgressBarProps) {
  return (
    <View
      className={className}
      style={{
        flexDirection: 'row',
        gap: 2,
        paddingHorizontal: 16,
        alignItems: 'center',
      }}
      testID="meso-progress-bar"
      {...props}
    >
      {mesos.map((meso) => (
        <MesoSegment
          key={meso.id}
          meso={meso}
          isActive={meso.id === activeMesoId}
          onPress={onMesoPress}
        />
      ))}
    </View>
  )
}
