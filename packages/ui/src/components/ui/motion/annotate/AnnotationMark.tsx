// One hand-drawn mark over an anchor box, painted as a DOM `<svg>` (web and React Native Web only, contract C9).
// Geometry comes from annotation-geometry.ts and the dash maths from the paths toolkit, so this file only paints.
import { useMemo, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'
import type { ColorToken } from '../../../../theme/resolve-color'
import { drawOn } from '../paths/model'
import {
  ANNOTATION_DEFAULTS,
  annotationStrokes,
  strokeProgress,
  type AnnotationBox,
  type AnnotationKind,
} from './annotation-geometry'

/** The colour scheme of a mark. */
export type AnnotationColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'

/** Props of {@link AnnotationMark}. */
export interface AnnotationMarkProps {
  /** Which mark to draw. */
  kind: AnnotationKind
  /** The annotated area in the parent's px, e.g. a node box after `project`. */
  box: AnnotationBox
  /** How far the mark is drawn, 0..1. Omit for the finished mark. */
  progress?: number
  /** Picks the wobble; the same seed draws the same mark on every render. Default 1. */
  seed?: number | string
  /** Default `error` for the strike-through and the cross, else `primary`. */
  color?: AnnotationColor
  /** Clearance round the box, px. Defaults per kind. */
  padding?: number
  /** Passes of the pen. Defaults per kind. */
  iterations?: number
  /** 0 draws clean lines. Default 1. */
  roughness?: number
  /** Pen width, px; ignored by `highlight`, which fills the padded box height. Default 2. */
  strokeWidth?: number
  /** Test id on the SVG layer. */
  testID?: string
}

const PEN_COLOR: Record<AnnotationColor, ColorToken> = {
  primary: 'brand-primary',
  secondary: 'brand-secondary',
  success: 'status-success',
  error: 'status-error',
  warning: 'status-warning',
  info: 'status-info',
}

/** A marker sits behind text, so it takes the colour's translucent `-muted` step. */
const MARKER_COLOR: Record<AnnotationColor, ColorToken> = {
  primary: 'brand-primary-muted',
  secondary: 'brand-secondary-muted',
  success: 'status-success-muted',
  error: 'status-error-muted',
  warning: 'status-warning-muted',
  info: 'status-info-muted',
}

const DEFAULT_STROKE_WIDTH = 2

function defaultColor(kind: AnnotationKind): AnnotationColor {
  return kind === 'strike-through' || kind === 'crossed-off' ? 'error' : 'primary'
}

function layerStyle(box: AnnotationBox): CSSProperties {
  return {
    position: 'absolute',
    left: box.x,
    top: box.y,
    overflow: 'visible',
    pointerEvents: 'none',
  }
}

type MarkGeometry = Pick<AnnotationMarkProps, 'kind' | 'seed'> &
  Required<Pick<AnnotationMarkProps, 'padding' | 'iterations' | 'roughness' | 'strokeWidth'>> & {
    w: number
    h: number
  }

/** The mark's strokes in the box's own frame, rebuilt only when its size or options change. */
function useMarkStrokes({ kind, w, h, seed = 1, ...options }: MarkGeometry) {
  const { padding, iterations, roughness, strokeWidth } = options
  return useMemo(
    () =>
      annotationStrokes(
        kind,
        { x: 0, y: 0, w, h },
        { seed, padding, iterations, roughness, strokeWidth }
      ),
    [kind, w, h, seed, padding, iterations, roughness, strokeWidth]
  )
}

/**
 * AnnotationMark: a rough-notation style mark (highlight, underline, box, circle, strike-through or
 * crossed-off) drawn round `box` as far as `progress`. Decorative and hidden from assistive tech.
 * With reduced motion it shows the finished mark.
 *
 * @example
 * <AnnotationMark kind="circle" box={{ x: 40, y: 12, w: 96, h: 28 }} progress={0.5} />
 */
export function AnnotationMark({
  kind,
  box,
  progress,
  color = defaultColor(kind),
  padding = ANNOTATION_DEFAULTS[kind].padding,
  iterations = ANNOTATION_DEFAULTS[kind].iterations,
  roughness = 1,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  seed,
  testID,
}: AnnotationMarkProps) {
  const isReducedMotion = usePrefersReducedMotion()
  const geometry = { kind, seed, padding, iterations, roughness, strokeWidth }
  const strokes = useMarkStrokes({ ...geometry, w: box.w, h: box.h })
  const drawn = progress === undefined || isReducedMotion ? 1 : progress
  const shares = strokeProgress(
    strokes.map((stroke) => stroke.model.length),
    drawn
  )
  const isMarker = kind === 'highlight'
  // The SVG is web-only (C9), so the theme variable is emitted directly: resolveColor would pull the whole token table into /motion.
  const stroke = `var(--color-${isMarker ? MARKER_COLOR[color] : PEN_COLOR[color]})`

  return (
    // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
    <svg
      aria-hidden="true"
      width={box.w}
      height={box.h}
      style={layerStyle(box)}
      data-testid={testID}
      data-kind={kind}
    >
      {strokes.map(({ model, width }, i) =>
        (shares[i] ?? 0) > 0 ? (
          // eslint-disable-next-line titan/no-html-element -- DOM svg, web and React Native Web only (contract C9)
          <path
            key={i}
            d={model.d}
            fill="none"
            strokeWidth={width}
            strokeLinecap={isMarker ? 'butt' : 'round'}
            style={{ stroke, ...drawOn(model.length, shares[i] ?? 0) }}
          />
        ) : null
      )}
    </svg>
  )
}
