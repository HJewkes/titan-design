// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The chart's per-week tip targets (titan-0201 round 4). Every week opens on hover, on
 * keyboard focus and on press; the group is ONE tab stop with a roving tabindex, because a
 * goals page shows several charts and a stop per week would multiply.
 */
import { useRef, useState } from 'react'
import { View } from 'react-native'
import { Typography } from '../Typography'
import { Metric } from '../Metric'
import { Pill } from '../../ui/pill'
import { TipTrigger } from '../../ui/tooltip'
import { PrBadge } from './PrBadge'
import type { WeekTip } from './weekTipModel'

const TIP_WIDTH = 220

/** How a week's tip lays its facts out. `figure` leads with the reading; `rows` labels every fact. */
export type WeekTipLayout = 'figure' | 'rows'

/** Week number, then a badge for each thing that is true of the week. */
function TipHeader({ tip }: { tip: WeekTip }) {
  const { isPR, isDeload } = tip.facts
  return (
    <View className="flex-row items-center gap-inline-sm">
      <Typography variant="overline" color="tertiary">
        {`Week ${String(tip.week)}`}
      </Typography>
      {isPR && <PrBadge type="weight" compact animate={false} iconSize={12} />}
      {isDeload && (
        <Pill tone="brand" variant="subtle" size="sm">
          Deload
        </Pill>
      )}
    </View>
  )
}

function TipRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-inline-md">
      <Typography variant="caption" color="tertiary" className="leading-normal">
        {label}
      </Typography>
      <Typography variant="caption" className="leading-normal">
        {value}
      </Typography>
    </View>
  )
}

/** The reading as the lead figure, then the plan and the next target as labelled rows. */
function FigureBody({ tip }: { tip: WeekTip }) {
  const { reading, plan, next } = tip.facts
  return (
    <>
      {reading ? (
        <Metric value={reading.amount} unit={reading.unit} label="Lifted" size="sm" />
      ) : (
        <Typography variant="caption" color="tertiary">
          No reading yet
        </Typography>
      )}
      {plan !== undefined && <TipRow label="Plan" value={plan} />}
      {next !== undefined && <TipRow label="Next target" value={next} />}
    </>
  )
}

/** Every fact as a labelled row, the reading among them. */
function RowsBody({ tip }: { tip: WeekTip }) {
  const { reading, plan, next } = tip.facts
  return (
    <>
      <TipRow
        label="Lifted"
        value={reading ? `${reading.amount} ${reading.unit}` : 'No reading yet'}
      />
      {plan !== undefined && <TipRow label="Plan" value={plan} />}
      {next !== undefined && <TipRow label="Next target" value={next} />}
    </>
  )
}

function WeekTipBody({ tip, layout }: { tip: WeekTip; layout: WeekTipLayout }) {
  return (
    <View
      style={{ width: TIP_WIDTH }}
      className="gap-stack-sm"
      testID={`goal-trajectory-chart-week-tip-${String(tip.week)}`}
    >
      <TipHeader tip={tip} />
      {layout === 'figure' ? <FigureBody tip={tip} /> : <RowsBody tip={tip} />}
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
export function GoalTrajectoryWeekTips({
  tips,
  width,
  height,
  layout = 'figure',
}: {
  tips: WeekTip[]
  width: number
  height: number
  layout?: WeekTipLayout
}) {
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
    // Laid over the canvas, which is the box the tips' coordinates are measured in.
    <View
      ref={group}
      style={{ position: 'absolute', left: 0, top: 0, width, height }}
      pointerEvents="box-none"
      testID="goal-trajectory-chart-week-targets"
    >
      {tips.map((tip, index) => (
        <View
          key={tip.week}
          style={{ position: 'absolute', left: tip.box.x, top: tip.box.y }}
          pointerEvents="box-none"
        >
          <TipTrigger
            label={tip.label}
            content={<WeekTipBody tip={tip} layout={layout} />}
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
