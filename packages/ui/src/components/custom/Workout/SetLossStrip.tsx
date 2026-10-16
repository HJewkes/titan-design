/**
 * R4 SPIKE (VW-954): can SetLossStrip compose `custom/charts/SetBarChart`?
 *
 * This draft drives SetBarChart with one slot per set and a fixed `scaleMax`. What it cannot do
 * without changing SetBarChart's defaults:
 * - every column is `flex: 1` with a width solved from the measured plot, so a warm-up bar cannot
 *   be narrower, and rows under the chart only align by re-measuring and re-solving `computeBarLayout`;
 * - a null loss can only be the 9px `empty` stub, not a full-height hatch;
 * - the marked-set ring would ride `renderBarOverlay`, which also makes every rep column interactive.
 * Decision: build plain View columns with fixed widths and reuse only `DashedReferenceLine` and the
 * calibrating hatch.
 */
import { SetBarChart, type SetSlot } from '../charts/SetBarChart'
import { DashedReferenceLine } from './VelocityLossBands'
import { VL_LOSS_THRESHOLDS, type VelocityLossThresholds } from './velocity-scale'

interface SpikeSet {
  lossPct: number | null
}

export function SetLossStripSpike({
  sets,
  thresholds = VL_LOSS_THRESHOLDS,
  ceiling = 40,
}: {
  sets: SpikeSet[]
  thresholds?: VelocityLossThresholds
  ceiling?: number
}) {
  const slots: SetSlot[] = sets.map((s) =>
    s.lossPct == null ? { kind: 'empty' } : { kind: 'rep', value: s.lossPct }
  )
  return (
    <SetBarChart
      slots={slots}
      colorFor={() => 'var(--color-dataviz-categorical-0)'}
      height={96}
      scaleMax={ceiling}
      renderReference={(g) =>
        thresholds.map((t) => (
          <DashedReferenceLine key={t} anchor="bottom" offset={g.yOf(t)} testID={`vl-${t}`} />
        ))
      }
    />
  )
}
