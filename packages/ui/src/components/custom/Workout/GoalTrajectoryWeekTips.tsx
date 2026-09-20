// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The chart's per-week tip targets (titan-0201 round 4). Every week opens on hover, on
 * keyboard focus and on press; the group is ONE tab stop with a roving tabindex, because a
 * goals page shows several charts and a stop per week would multiply.
 */
import { useRef, useState } from 'react'
import { View } from 'react-native'
import { Typography } from '../Typography'
import { TipTrigger } from '../../ui/tooltip'
import type { WeekTip } from './weekTipModel'

const TIP_WIDTH = 220

function WeekTipBody({ tip }: { tip: WeekTip }) {
  return (
    <View
      style={{ width: TIP_WIDTH }}
      className="gap-stack-sm"
      testID={`goal-trajectory-chart-week-tip-${String(tip.week)}`}
    >
      <Typography variant="body2">{`Week ${String(tip.week)}`}</Typography>
      {tip.lines.map((line) => (
        <Typography key={line} variant="caption" color="secondary" className="leading-normal">
          {line}
        </Typography>
      ))}
    </View>
  )
}

/** Which week the arrow keys move to, or null when the key is not one of ours. */
export function nextRovingWeek(key: string, index: number, count: number): number | null {
  if (key === 'ArrowRight' || key === 'ArrowDown') return Math.min(index + 1, count - 1)
  if (key === 'ArrowLeft' || key === 'ArrowUp') return Math.max(index - 1, 0)
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}

/** The week targets over the plot, absolute against the chart's own box. */
export function GoalTrajectoryWeekTips({ tips }: { tips: WeekTip[] }) {
  const [active, setActive] = useState(0)
  const group = useRef<View>(null)

  const focusWeek = (index: number) => {
    setActive(index)
    const node = group.current as unknown as HTMLElement | null
    const target = node?.querySelector<HTMLElement>(
      `[data-testid="goal-trajectory-chart-week-target-${String(tips[index].week)}"]`
    )
    target?.focus()
  }

  return (
    <View ref={group} testID="goal-trajectory-chart-week-targets">
      {tips.map((tip, index) => (
        <View
          key={tip.week}
          style={{ position: 'absolute', left: tip.box.x, top: tip.box.y }}
          pointerEvents="box-none"
        >
          <TipTrigger
            label={tip.label}
            content={<WeekTipBody tip={tip} />}
            placement="top"
            usePortal={false}
            style={{ width: tip.box.size, height: tip.box.size }}
            tabIndex={index === active ? 0 : -1}
            onKeyDown={(event) => {
              const next = nextRovingWeek(event.key, index, tips.length)
              if (next === null) return
              event.preventDefault()
              focusWeek(next)
            }}
            testID={`goal-trajectory-chart-week-target-${String(tip.week)}`}
          >
            <View style={{ width: tip.box.size, height: tip.box.size }} />
          </TipTrigger>
        </View>
      ))}
    </View>
  )
}
