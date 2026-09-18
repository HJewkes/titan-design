import { cn } from '../utils/cn'

type Props = Record<string, unknown>
type ClassStyle = { $$css: true } & Record<string, string | true>

function classStyle(className: string): ClassStyle {
  return { $$css: true, [className]: className } as ClassStyle
}

// Only objects this runtime built map each class string to itself; other $$css shapes key by property.
function isClassStyle(style: unknown): style is ClassStyle {
  if (!style || typeof style !== 'object' || (style as ClassStyle).$$css !== true) return false
  return Object.entries(style).every(([key, value]) => key === '$$css' || key === value)
}

function hasClassName(props: unknown): props is Props & { className: string } {
  return !!props && typeof (props as Props).className === 'string' && !!(props as Props).className
}

function flatten(style: unknown): unknown[] {
  return Array.isArray(style) ? style.flatMap(flatten) : [style]
}

function classesOf(style: ClassStyle): string[] {
  return Object.keys(style).filter((key) => key !== '$$css')
}

/**
 * Moves `className` into a `$$css` style object that react-native-web's styleq
 * turns into DOM classes.
 *
 * A titan component rendered from titan code receives its caller's classes
 * already converted, inside `style`, so its own `cn(variant, className)` never
 * sees them. When those caller classes meet the component's className here,
 * they are merged through `cn` with the caller last, matching what the source
 * build's `cn` call would have produced (VW-420).
 */
export function classNameToStyle(props: unknown): unknown {
  if (!hasClassName(props)) return props
  const { className, style, ...rest } = props
  if (!style) return { ...rest, style: classStyle(className) }
  const entries = flatten(style)
  const inherited = entries.filter(isClassStyle)
  if (inherited.length === 0) return { ...rest, style: [classStyle(className), style] }
  const merged = cn(className, ...inherited.flatMap(classesOf))
  const others = entries.filter((entry) => !isClassStyle(entry))
  return { ...rest, style: [classStyle(merged), ...others] }
}
