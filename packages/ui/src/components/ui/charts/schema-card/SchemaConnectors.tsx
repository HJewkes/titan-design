// The connector layer of SchemaCard: a DOM `<svg>`, as every line mark on main is. All geometry
// comes from `schema-card-layout.ts` and every value from the frame, so this file only paints.
import type { CSSProperties } from 'react'
import { resolveColor, type ColorToken } from '../../../../theme/resolve-color'
import { drawOn, pathModel } from '../../motion/paths'
import type { ConnectorGeometry } from './schema-card-layout'
import type { SchemaFrame } from './schema-card-motion'

/** The connector stroke: NetworkGraph's strong edge, since here the relation is the subject. */
export const CONNECTOR_COLOR: ColorToken = 'border-prominent'
const STROKE_WIDTH = 1.5

const LAYER_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  overflow: 'visible',
  pointerEvents: 'none',
}

function Connector({ geometry, frame }: { geometry: ConnectorGeometry; frame: SchemaFrame }) {
  const id = geometry.relation.id
  const dash = drawOn(pathModel(geometry.path).length, frame.draw(id))
  const stroke = resolveColor(CONNECTOR_COLOR)
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <g data-relation={id}>
      {/* eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9) */}
      <path
        d={geometry.path}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        style={{ stroke, ...dash }}
        data-part="connector"
      />
      {/* eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9) */}
      <path
        d={geometry.marks}
        fill="none"
        strokeWidth={STROKE_WIDTH}
        opacity={frame.marks(id)}
        style={{ stroke }}
        data-part="marks"
      />
    </g>
  )
}

export interface SchemaConnectorsProps {
  connectors: readonly ConnectorGeometry[]
  frame: SchemaFrame
  width: number
  height: number
}

/** Every relation's connector, under the tables so each line meets a table's edge. */
export function SchemaConnectors({ connectors, frame, width, height }: SchemaConnectorsProps) {
  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <svg width={width} height={height} style={LAYER_STYLE} aria-hidden="true">
      {connectors.map((geometry) => (
        <Connector key={geometry.relation.id} geometry={geometry} frame={frame} />
      ))}
    </svg>
  )
}
