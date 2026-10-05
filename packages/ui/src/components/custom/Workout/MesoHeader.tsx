// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'

import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { cn } from '../../../utils/cn'
import { PhoneBand, WallBand } from './MesoHeader.band'
import { CyclePhone, CycleWall } from './MesoHeader.cycle'
import { headerModel, MESO_HEADER_PHONE_MAX } from './MesoHeader.model'
import type { PartProps } from './MesoHeader.parts'
import { SpinePhone, SpineWall } from './MesoHeader.spine'
import type { MesoHeaderProps, MesoHeaderShape } from './MesoHeader.types'

export {
  dayLabel,
  MESO_HEADER_PHONE_MAX,
  positionText,
  weekCells,
  weeksLabel,
} from './MesoHeader.model'
export type {
  MesoHeaderBlock,
  MesoHeaderCurrentWeek,
  MesoHeaderCycleBlock,
  MesoHeaderProps,
  MesoHeaderSchedule,
  MesoHeaderShape,
  MesoHeaderState,
  MesoHeaderWeek,
} from './MesoHeader.types'

const SHAPES = {
  band: { wall: WallBand, phone: PhoneBand },
  cycle: { wall: CycleWall, phone: CyclePhone },
  spine: { wall: SpineWall, phone: SpinePhone },
} as const

type Form = 'wall' | 'phone'

function ShapeBody({ model, shape, form }: PartProps & { shape: MesoHeaderShape; form: Form }) {
  const Body = SHAPES[shape][form]
  return <Body model={model} />
}

/** The header's own data as one model, apart from the props its root View takes. */
function splitProps(props: MesoHeaderProps) {
  const { block, schedule, priorities, isPrioritiesOpen, onPrioritiesOpenChange } = props
  const { now, cycle, prioritiesLine, shape = 'spine', layout, className, ...viewProps } = props
  const model = headerModel({
    ...{ block, schedule, priorities, isPrioritiesOpen, onPrioritiesOpenChange },
    ...{ now, cycle, prioritiesLine },
  })
  return { model, shape, layout, className, viewProps }
}

/**
 * The pinned header of the goals page: which block, the dates it runs, where the lifter is in
 * it, and what it is for. Switches between its wall and phone forms by its own width, at the
 * live strip's threshold.
 *
 * VW-466 specimen: `shape` picks A, B or C, and C is the default. No loading, error or disabled
 * state: the page owns the fetch, and with no dated block the consumer renders a note instead.
 */
export function MesoHeader(props: MesoHeaderProps) {
  const { model, shape, layout, className, viewProps } = splitProps(props)
  const { width, onLayout } = useMeasuredWidth()
  const measured = width !== null && width < MESO_HEADER_PHONE_MAX ? 'phone' : 'wall'
  return (
    <View
      onLayout={onLayout}
      className={cn('bg-surface-base px-inset-lg py-inset-md', className)}
      testID="meso-header"
      {...viewProps}
    >
      <ShapeBody model={model} shape={shape} form={layout ?? measured} />
    </View>
  )
}
