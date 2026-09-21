// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * The chart's per-week tip targets (titan-0201 round 4). Every week opens on hover, on
 * keyboard focus and on press; the group is ONE tab stop with a roving tabindex, because a
 * goals page shows several charts and a stop per week would multiply.
 */
import { useRef, useState } from 'react'
import { View } from 'react-native'
import { Typography } from '../../ui/typography'
import { Metric } from '../Metric'
import { Pill } from '../../ui/pill'
import { alpha } from '../../../utils/colors'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger, type TooltipPlacement } from '../../ui/tooltip'
import { PrBadge } from './PrBadge'
import type { WeekTip } from './weekTipModel'

const TIP_WIDTH = 220
/** The tip's outer width: its body plus the tooltip's `px-inset-md` on each side. */
const TIP_OUTER_WIDTH = TIP_WIDTH + 2 * 12

/** The deload badge carries the deload token, the colour its column is washed in. */
function useDeloadBadge() {
  const deload = getSemanticColors(useSurfaceMode())['status-deload']
  return { style: { backgroundColor: alpha(deload, 0.22) }, className: 'text-status-deload' }
}

/** Week number, then a badge for each thing that is true of the week. */
function TipHeader({ tip }: { tip: WeekTip }) {
  const { isPR, isDeload } = tip.facts
  const deloadBadge = useDeloadBadge()
  return (
    // Week on the left, badges pinned to the upper right (titan-0201 round 6).
    <View className="flex-row items-center justify-between gap-inline-md">
      <Typography variant="overline" color="tertiary">
        {`Week ${String(tip.week)}`}
      </Typography>
      <View className="flex-row items-center gap-inline-sm">
        {isDeload && (
          <Pill tone="neutral" variant="subtle" size="sm" {...deloadBadge}>
            Deload
          </Pill>
        )}
        {isPR && <PrBadge type="weight" compact animate={false} iconSize={12} />}
      </View>
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

function WeekTipBody({ tip }: { tip: WeekTip }) {
  return (
    <View
      style={{ width: TIP_WIDTH }}
      className="gap-stack-sm"
      testID={`goal-trajectory-chart-week-tip-${String(tip.week)}`}
    >
      <TipHeader tip={tip} />
      <FigureBody tip={tip} />
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

const TIP_PLACEMENTS = ['top', 'top-end', 'top-start'] as const

/**
 * Where a week's tip opens: centred over the week unless an edge of the chart would cut it,
 * then aligned to the target's own edge, whichever spills least (titan-0201 round 7, the
 * deload tip ran off a phone's right edge).
 */
export function weekTipPlacement(
  box: WeekTip['box'],
  chartWidth: number,
  tipWidth: number = TIP_OUTER_WIDTH
): TooltipPlacement {
  const centre = box.x + box.size / 2
  const lefts = {
    top: centre - tipWidth / 2,
    'top-end': box.x + box.size - tipWidth,
    'top-start': box.x,
  }
  const spill = (left: number) => Math.max(0, -left) + Math.max(0, left + tipWidth - chartWidth)
  return TIP_PLACEMENTS.reduce((best, p) => (spill(lefts[p]) < spill(lefts[best]) ? p : best))
}

/** The week targets over the plot, absolute against the chart's own box. */
export function GoalTrajectoryWeekTips({
  tips,
  width,
  height,
}: {
  tips: WeekTip[]
  width: number
  height: number
}) {
  const [active, setActive] = useState(0)
  // A block that loses weeks under a live chart must still leave one tab stop.
  const stop = Math.min(active, tips.length - 1)
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
            content={<WeekTipBody tip={tip} />}
            placement={weekTipPlacement(tip.box, width)}
            usePortal={false}
            style={{ width: tip.box.size, height: tip.box.size }}
            tabIndex={index === stop ? 0 : -1}
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
