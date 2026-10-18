import type { ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import type { Point, Viewport } from '../motion/camera'
import { Surface } from '../surface'
import { Typography } from '../typography'
import { MAP_CARD_REST, mapCardFrame, mapCardStill, type MapCardFrame } from './map-card-motion'
import { mapCardPlacement, type MapCardPlacement, type MapCardSize } from './map-card-placement'

/** Props of {@link MapCard}. */
export interface MapCardProps {
  /** The anchor's screen point in px, as `project()` returns it for the node's world point. */
  anchor: Point
  /** The screen the map renders into. The card lays itself out over all of it. */
  viewport: Viewport
  /** The card's box in px. Its content fits inside; nothing is measured at render. Default 320×180. */
  size?: MapCardSize
  /** Progress in, 0..1, from the map state. Default 1. */
  enter?: number
  /** Progress out, 0..1, from the map state. Default 0. */
  exit?: number
  /** `auto` sits right of the anchor and flips left near the right edge. Default `auto`. */
  side?: 'auto' | 'left' | 'right'
  /** The card stays above this fraction of the viewport height. Default 0.83. */
  keepOutFraction?: number
  /** A heading above the content. A string is set as a subtitle. */
  title?: ReactNode
  /** The card's spoken name. */
  accessibilityLabel?: string
  /** The content: a FileCard, a StatCard, a SchemaCard or any node. */
  children: ReactNode
  /** Tailwind classes merged onto the card's surface. */
  className?: string
}

const DEFAULT_SIZE: MapCardSize = { width: 320, height: 180 }
const LEADER_WIDTH = 1.5
const ANCHOR_DOT_R = 3

// The leader is a rotated View rather than SVG, so it renders on native without the optional
// react-native-svg peer. A View rotates about its centre, so the drawn part is centred on its midpoint.
function Leader({ placement, frame }: { placement: MapCardPlacement; frame: MapCardFrame }) {
  const { from, to } = placement.leader
  const dx = to.x - from.x
  const dy = to.y - from.y
  const drawn = Math.hypot(dx, dy) * frame.leaderDraw
  const midX = from.x + (dx * frame.leaderDraw) / 2
  const midY = from.y + (dy * frame.leaderDraw) / 2
  return (
    <View
      aria-hidden
      testID="map-card-leader"
      style={{
        position: 'absolute',
        inset: 0,
        opacity: frame.leaderOpacity,
        pointerEvents: 'none',
      }}
    >
      <View
        testID="map-card-leader-line"
        className="absolute rounded-full bg-border-prominent"
        style={{
          left: midX - drawn / 2,
          top: midY - LEADER_WIDTH / 2,
          width: drawn,
          height: LEADER_WIDTH,
          transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
        }}
      />
      <View
        className="absolute rounded-full bg-border-prominent"
        style={{
          left: from.x - ANCHOR_DOT_R,
          top: from.y - ANCHOR_DOT_R,
          width: 2 * ANCHOR_DOT_R,
          height: 2 * ANCHOR_DOT_R,
        }}
      />
    </View>
  )
}

function CardTitle({ title }: { title: ReactNode }) {
  if (typeof title !== 'string') return <>{title}</>
  return <Typography variant="subtitle2">{title}</Typography>
}

function useCardFrame(enter: number, exit: number): MapCardFrame {
  const isReducedMotion = usePrefersReducedMotion()
  if (enter >= 1 && exit <= 0) return MAP_CARD_REST
  return isReducedMotion ? mapCardStill(enter, exit) : mapCardFrame(enter, exit)
}

/**
 * MapCard: a pop-out card beside a point on a map, joined to it by a leader line. It sits right
 * of the anchor and flips left near the right edge, and stays above the caption keep-out. `enter`
 * draws the leader out from the anchor and then fades the card in; `exit` fades both out.
 *
 * @example
 * <MapCard anchor={{ x: 640, y: 300 }} viewport={{ width: 1280, height: 720 }} title="Router">
 *   <FileCard path="packages/atlas/src/core/router-00.ts" loc={412} />
 * </MapCard>
 */
export function MapCard({
  anchor,
  viewport,
  size = DEFAULT_SIZE,
  enter = 1,
  exit = 0,
  side,
  keepOutFraction,
  title,
  accessibilityLabel,
  children,
  className,
}: MapCardProps) {
  const placement = mapCardPlacement({ anchor, viewport, size, side, keepOutFraction })
  const frame = useCardFrame(enter, exit)
  const isHidden = frame.cardOpacity === 0
  const towardAnchor = placement.side === 'right' ? 1 : -1

  return (
    <View
      testID="map-card"
      style={{ position: 'absolute', left: 0, top: 0, ...viewport, pointerEvents: 'box-none' }}
    >
      <Leader placement={placement} frame={frame} />
      <View
        testID="map-card-box"
        role={accessibilityLabel ? 'group' : undefined}
        aria-label={accessibilityLabel}
        aria-hidden={isHidden || undefined}
        style={{
          position: 'absolute',
          left: placement.box.x,
          top: placement.box.y,
          width: placement.box.width,
          height: placement.box.height,
          opacity: frame.cardOpacity,
          transform: [{ translateX: -towardAnchor * frame.cardOffset }],
        }}
      >
        <Surface elevation={3} className={cn('flex-1 gap-stack-sm p-inset-md', className)}>
          {title !== undefined && <CardTitle title={title} />}
          {children}
        </Surface>
      </View>
    </View>
  )
}
