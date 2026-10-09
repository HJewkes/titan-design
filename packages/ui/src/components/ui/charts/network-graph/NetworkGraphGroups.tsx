// The group layer of NetworkGraph: a clustered layout's regions and an ego layout's hop rings,
// painted under the edges. Hidden from assistive tech: each group's label is already in its
// members' names and in the summary.
import { View, type ViewProps } from 'react-native'
import { resolveColor } from '../../../../theme/resolve-color'
import { Typography } from '../../typography'
import { LAYOUT_DEFAULTS } from './layouts/layout-geometry'
import { LAYER_STYLE } from './NetworkGraphPlot'
import type { GraphGroupRegion } from './types'

const GROUP_FILL = 'surface-elevated'
const GROUP_STROKE = 'hairline-default'
const GROUP_DASH = '4 4'
/** Height of a group label's line box. */
const LABEL_HEIGHT = 16
/**
 * A ring's label sits centred just inside the ring's bottom, where the outermost ring still has
 * room (the frame pads only 24 px past it) and a node at six o'clock ends 8 px short of the line.
 */
const RING_LABEL_GAP = 8
/** A label is centred on its circle inside a band at least this wide, so a small circle keeps a long label. */
const LABEL_MIN_BAND = 240

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

/** A region's label sits centred in the band above its circle; a ring's sits centred just inside the ring's bottom. */
function GroupLabel({ group }: { group: GraphGroupRegion }) {
  const band = Math.max(group.radius * 2, LABEL_MIN_BAND)
  const vertical =
    group.variant === 'region'
      ? {
          top: group.cy - group.radius - LAYOUT_DEFAULTS.REGION_LABEL_BAND,
          height: LAYOUT_DEFAULTS.REGION_LABEL_BAND,
          justifyContent: 'flex-end' as const,
        }
      : { top: group.cy + group.radius - RING_LABEL_GAP - LABEL_HEIGHT, height: LABEL_HEIGHT }
  return (
    <View
      className="pointer-events-none absolute items-center"
      style={{ left: group.cx - band / 2, width: band, ...vertical }}
      testID={`network-graph-group-${group.id}`}
      {...hidden}
    >
      <Typography variant="caption" color="secondary" numberOfLines={1}>
        {group.label}
      </Typography>
    </View>
  )
}

export interface NetworkGraphGroupsProps {
  groups: readonly GraphGroupRegion[]
  width: number
  height: number
}

/** One circle and one label per group with a radius; a radius of 0 (an ego focus) paints nothing. */
export function NetworkGraphGroups({ groups, width, height }: NetworkGraphGroupsProps) {
  const painted = groups.filter((group) => group.radius > 0)
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
        {painted.map((group) => (
          <GroupCircle key={group.id} group={group} />
        ))}
      </svg>
      {painted.map((group) => (
        <GroupLabel key={group.id} group={group} />
      ))}
    </>
  )
}
