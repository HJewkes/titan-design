// The group layer of NetworkGraph: a clustered layout's regions and an ego layout's hop rings,
// painted under the edges. Hidden from assistive tech: each group's label is already in its
// members' names and in the summary.
import { View, type ViewProps } from 'react-native'
import { resolveColor } from '../../../../theme/resolve-color'
import { Typography } from '../../typography'
import { LAYOUT_DEFAULTS } from './layouts/layout-geometry'
import { isPaintableBox } from './network-graph-boxes'
import type { LabelBox } from './network-graph-labels'
import { BOX_CORNER_RADIUS, LAYER_STYLE } from './NetworkGraphPlot'
import type { GraphBox, GraphGroupRegion } from './types'

const GROUP_FILL = 'surface-elevated'
const GROUP_STROKE = 'hairline-default'
const GROUP_DASH = '4 4'
/** A label is centred on its circle inside a band at least this wide, so a small circle keeps a long label. */
const LABEL_MIN_BAND = 240
/** A box's label sits inside its top-left corner, this far in from both edges. */
const BOX_LABEL_INSET = 8
const BOX_LABEL_HEIGHT = 16

const hidden = { 'aria-hidden': true } as ViewProps

function GroupCircle({ group }: { group: GraphGroupRegion }) {
  const isRegion = group.variant === 'region'
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <circle
      cx={group.cx}
      cy={group.cy}
      r={group.radius}
      strokeWidth={1}
      strokeDasharray={GROUP_DASH}
      style={{
        fill: isRegion ? resolveColor(GROUP_FILL) : 'none',
        stroke: resolveColor(GROUP_STROKE),
      }}
      data-group={group.id}
      data-variant={group.variant}
    />
  )
}

/** A compound box: the rectangle that holds its members, a solid outline over the elevated fill. */
function GroupRect({ group, box }: { group: GraphGroupRegion; box: GraphBox }) {
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <rect
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      rx={BOX_CORNER_RADIUS}
      strokeWidth={1}
      style={{ fill: resolveColor(GROUP_FILL), stroke: resolveColor(GROUP_STROKE) }}
      data-group={group.id}
      data-variant="box"
    />
  )
}

function BoxLabel({ group, box }: { group: GraphGroupRegion; box: GraphBox }) {
  return (
    <GroupLabelText
      id={group.id}
      label={group.label}
      style={{
        left: box.x + BOX_LABEL_INSET,
        top: box.y + BOX_LABEL_INSET,
        width: Math.max(0, box.width - 2 * BOX_LABEL_INSET),
        height: BOX_LABEL_HEIGHT,
        alignItems: 'flex-start',
      }}
    />
  )
}

/** A region's label sits centred in the band above its circle. */
function RegionLabel({ group }: { group: GraphGroupRegion }) {
  const band = Math.max(group.radius * 2, LABEL_MIN_BAND)
  return (
    <GroupLabelText
      id={group.id}
      label={group.label}
      style={{
        left: group.cx - band / 2,
        width: band,
        top: group.cy - group.radius - LAYOUT_DEFAULTS.REGION_LABEL_BAND,
        height: LAYOUT_DEFAULTS.REGION_LABEL_BAND,
        justifyContent: 'flex-end',
      }}
    />
  )
}

/** A ring's label fills the box `ringLabelBoxes` chose, clear of every node. */
function RingLabel({ group, box }: { group: GraphGroupRegion; box: LabelBox }) {
  return (
    <GroupLabelText
      id={group.id}
      label={group.label}
      style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
    />
  )
}

function GroupLabelText({
  id,
  label,
  style,
}: {
  id: string
  label: string
  style: ViewProps['style']
}) {
  return (
    <View
      className="pointer-events-none absolute items-center"
      style={style}
      testID={`network-graph-group-${id}`}
      {...hidden}
    >
      <Typography variant="caption" color="secondary" numberOfLines={1}>
        {label}
      </Typography>
    </View>
  )
}

export interface NetworkGraphGroupsProps {
  groups: readonly GraphGroupRegion[]
  /** Ring label boxes by group id, from `ringLabelBoxes`. */
  ringLabels: ReadonlyMap<string, LabelBox>
  width: number
  height: number
}

const isPainted = (group: GraphGroupRegion) =>
  group.variant === 'box' ? isPaintableBox(group.box) : group.radius > 0

/** One shape and one label per group with an area; a radius of 0 (an ego focus) paints nothing. */
export function NetworkGraphGroups({ groups, ringLabels, width, height }: NetworkGraphGroupsProps) {
  const painted = groups.filter(isPainted)
  if (painted.length === 0) return null
  return (
    <>
      {/* eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9) */}
      <svg
        aria-hidden="true"
        width={width}
        height={height}
        style={LAYER_STYLE}
        data-testid="network-graph-groups"
      >
        {painted.map((group) =>
          group.box && group.variant === 'box' ? (
            <GroupRect key={group.id} group={group} box={group.box} />
          ) : (
            <GroupCircle key={group.id} group={group} />
          )
        )}
      </svg>
      {painted.map((group) => {
        if (group.box && group.variant === 'box') {
          return <BoxLabel key={group.id} group={group} box={group.box} />
        }
        const box = ringLabels.get(group.id)
        if (group.variant === 'region') return <RegionLabel key={group.id} group={group} />
        return box ? <RingLabel key={group.id} group={group} box={box} /> : null
      })}
    </>
  )
}
