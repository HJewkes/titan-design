import { useId } from 'react'
import { View } from 'react-native'

import { nearestPoint } from './line-chart-model'
import type { PlotFrame } from './line-layout-model'
import type { LineChartState } from './useLineChart'

interface PointerLike {
  nativeEvent: { clientX: number; clientY: number }
  currentTarget: unknown
}

interface KeyLike {
  key: string
  preventDefault: () => void
}

export interface LinePointsProps {
  chart: LineChartState
  frame: PlotFrame
  label: string
  /** The active point in words, or null with none active. */
  activeName: string | null
  onPress: () => void
}

/**
 * The chart's one tab stop, laid over the plot. Keys and the pointer move the active point, and
 * `aria-activedescendant` names it through the single node rendered inside.
 */
export function LinePoints({ chart, frame, label, activeName, onPress }: LinePointsProps) {
  const activeNodeId = useId()
  const series = chart.facets[0]?.geometry.series ?? []
  const web = {
    tabIndex: 0 as const,
    onClick: onPress,
    onKeyDown: (event: KeyLike) => {
      const pressed = event.key === 'Enter' || event.key === ' '
      if (pressed) onPress()
      if (pressed || chart.handleKey(event.key)) event.preventDefault()
    },
    onPointerMove: (event: PointerLike) => {
      const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const { clientX, clientY } = event.nativeEvent
      const hit = nearestPoint(series, { x: clientX - box.left, y: clientY - box.top })
      if (hit && hit.id !== chart.activePointId) chart.setActivePointId(hit.id)
    },
    // A focused chart keeps its point: the keyboard reader has not left.
    onPointerLeave: (event: PointerLike) => {
      if (document.activeElement !== event.currentTarget) chart.setActivePointId(null)
    },
  }
  return (
    <View
      testID="line-chart-points"
      role="application"
      aria-label={label}
      aria-activedescendant={activeName === null ? undefined : activeNodeId}
      className="absolute"
      style={{ left: frame.left, top: frame.top, width: frame.plotWidth, height: frame.plotHeight }}
      {...web}
    >
      {activeName !== null && (
        <View
          nativeID={activeNodeId}
          testID="line-chart-active-point"
          role="img"
          aria-label={activeName}
        />
      )}
    </View>
  )
}
