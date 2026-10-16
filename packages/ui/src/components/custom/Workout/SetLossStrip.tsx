/**
 * SetLossStrip — one exercise's sets as velocity-loss bars against the VL lines, with reps, load
 * and e1RM column-aligned underneath (VW-954). Every strip on a page shares one fixed loss scale
 * and one column width, so strips stacked down the page compare bar for bar.
 *
 * Plain View columns rather than `custom/charts/SetBarChart` (plan risk R4): SetBarChart solves
 * its bar width from the measured plot, so warm-up bars cannot be narrower and rows under it
 * cannot align, and it has no full-height no-data cell. This reuses its `DashedReferenceLine`
 * and the calibrating hatch instead.
 */
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../../ui/typography'
import {
  Cell,
  E1rmValue,
  PlotCell,
  RepsValue,
  ThresholdLabels,
  ThresholdLines,
  ValueCell,
} from './SetLossStripParts'
import {
  DEFAULT_LOSS_CEILING_PCT,
  SET_LOSS_GEOMETRY,
  setLossAccessibilityLabel,
  setName,
  type SetLossMarkTone,
  type SetLossStripScale,
  type SetLossStripSet,
} from './setLossStripModel'
import {
  VL_LOSS_THRESHOLDS,
  normalizeLossThresholds,
  type VelocityLossThresholds,
} from './velocity-scale'

export interface SetLossStripProps {
  /** The exercise's sets in the order performed. */
  sets: readonly SetLossStripSet[]
  /** Where the VL lines sit (%). Defaults to {@link VL_LOSS_THRESHOLDS}. */
  thresholds?: VelocityLossThresholds
  /** The loss (%) a full-height bar shows. Defaults to {@link DEFAULT_LOSS_CEILING_PCT}. */
  lossCeilingPct?: number
  /** The `index` of the set the verdict read; it gets a ring and a glyph in `markedTone`. */
  markedIndex?: number
  /** Defaults to `neutral`. The consumer maps its verdict onto a tone. */
  markedTone?: SetLossMarkTone
  /** The verdict word for the marked set, spoken by its glyph and the strip label. */
  markedLabel?: string
  /** The `index` of the session's best e1RM; its cell gets the brand dot. */
  bestE1rmIndex?: number
  /** Column width and plot height. Defaults to `phone`. */
  scale?: SetLossStripScale
  /** Minimum column count. Pass the page's longest set count so stacked strips align. */
  columns?: number
  testID?: string
  className?: string
}

export function SetLossStrip({
  sets,
  thresholds = VL_LOSS_THRESHOLDS,
  lossCeilingPct = DEFAULT_LOSS_CEILING_PCT,
  markedIndex,
  markedTone = 'neutral',
  markedLabel,
  bestE1rmIndex,
  scale = 'phone',
  columns = 0,
  testID = 'set-loss-strip',
  className,
}: SetLossStripProps) {
  const geometry = SET_LOSS_GEOMETRY[scale]
  const pad = Math.max(0, columns - sets.length)
  const lines = [...new Set(normalizeLossThresholds(thresholds))]
  const scaleProps = { ceiling: lossCeilingPct, plot: geometry.plot }
  const toneFor = (set: SetLossStripSet) => (set.index === markedIndex ? markedTone : undefined)
  const row = (header: string | null, cell: (set: SetLossStripSet) => ReactNode) => (
    <StripRow header={header} cells={sets.map(cell)} pad={pad} geometry={geometry} />
  )
  const label = setLossAccessibilityLabel(
    sets,
    markedIndex == null ? undefined : { index: markedIndex, label: markedLabel }
  )

  return (
    <View className={cn('gap-stack-sm', className)} testID={testID}>
      <View accessibilityRole="image" accessibilityLabel={label} className="gap-stack-sm">
        {row(null, (set) => (
          <ValueCell set={set} markTone={toneFor(set)} markLabel={markedLabel ?? setName(set)} />
        ))}
        <View className="flex-row">
          <View style={{ width: geometry.gutter, height: geometry.plot }}>
            <ThresholdLabels thresholds={lines} {...scaleProps} />
          </View>
          <View className="relative flex-row gap-1 border-b border-border-default">
            <ThresholdLines thresholds={lines} {...scaleProps} />
            {sets.map((set) => (
              <PlotCell
                key={set.index}
                set={set}
                column={geometry.column}
                markTone={toneFor(set)}
                {...scaleProps}
              />
            ))}
            <PadCells count={pad} width={geometry.column} />
          </View>
        </View>
      </View>
      {row(null, (set) => (
        <Typography variant="monoLabel" color="secondary" className="text-center">
          {setName(set)}
        </Typography>
      ))}
      {row('Reps', (set) => <RepsValue set={set} />)}
      {row('Load', (set) => (
        <Typography variant="mono" className="text-center tabular-nums">
          {set.loadLabel}
        </Typography>
      ))}
      {sets.some((s) => s.e1rm != null)
        ? row('e1RM', (set) => <E1rmValue set={set} isBest={set.index === bestE1rmIndex} />)
        : null}
    </View>
  )
}

interface StripRowProps {
  header: string | null
  cells: ReactNode[]
  pad: number
  geometry: { column: number; gutter: number }
}

/** A row of fixed-width cells behind a gutter header, laid out like the plot's columns. */
function StripRow({ header, cells, pad, geometry }: StripRowProps) {
  return (
    <View className="flex-row items-end">
      <View style={{ width: geometry.gutter }}>
        {header ? (
          <Typography variant="microLabel" color="secondary">
            {header}
          </Typography>
        ) : null}
      </View>
      <View className="flex-row items-end gap-1">
        {cells.map((cell, i) => (
          <Cell key={i} width={geometry.column}>
            {cell}
          </Cell>
        ))}
        <PadCells count={pad} width={geometry.column} />
      </View>
    </View>
  )
}

function PadCells({ count, width }: { count: number; width: number }) {
  return Array.from({ length: count }, (_, i) => <Cell key={`pad-${String(i)}`} width={width} />)
}
