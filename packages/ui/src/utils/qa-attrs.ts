import type { ViewProps } from 'react-native'

/**
 * The `data-qa-*` attributes a render-QA inspector reads off a rendered frame. The names are a
 * string protocol shared with the inspector, which lives in another repo and pins the same list,
 * so a rename here is a breaking change there.
 */
export const QA_ATTRIBUTES = [
  'data-qa-container',
  'data-qa-context',
  'data-qa-decor',
  'data-qa-camera',
  'data-qa-order',
  'data-qa-title',
  'data-qa-glyph',
  'data-qa-level',
] as const

export type QaAttribute = (typeof QA_ATTRIBUTES)[number]

/** What one element tells the inspector. Each mark becomes the `data-qa-*` attribute of its name. */
export interface QaMarks {
  /** A panel other elements legitimately sit on. */
  container?: boolean
  /** Intentionally dimmed context: no contrast finding for it or its descendants. */
  context?: boolean
  /** A marker drawn over a node by design: it takes part in no overlap check. */
  decor?: boolean
  /** A layer the camera is carrying mid-move. */
  camera?: boolean
  /** Its children are cards read in order; the selector matches a card's rows. */
  order?: string
  /** A card's title; its siblings are the card's rows. */
  title?: boolean
  /** The glyph whose colour carries its `[data-mark]` or `[data-state]` element's state. */
  glyph?: boolean
  /** The selector matches values in sibling cards that must sit level. */
  level?: string
}

const dataSetKey = (name: string) => `qa${name.charAt(0).toUpperCase()}${name.slice(1)}`

/**
 * The props that stamp `marks` onto a React Native element. React Native Web renders `dataSet`
 * as `data-*` attributes; native ignores it, so nothing paints differently on any platform.
 *
 * @example
 * <View {...qaAttrs({ context: isDimmed })} />
 */
export function qaAttrs(marks: QaMarks): ViewProps {
  const dataSet: Record<string, string> = {}
  for (const [name, value] of Object.entries(marks)) {
    if (value === true) dataSet[dataSetKey(name)] = ''
    else if (typeof value === 'string') dataSet[dataSetKey(name)] = value
  }
  return { dataSet } as ViewProps
}
