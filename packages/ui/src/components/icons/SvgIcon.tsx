import type { ReactNode } from 'react'

export interface IconProps {
  /** Rendered width/height in px (viewBox is fixed 24×24). */
  size?: number
  /** Stroke color (or fill, for solid icons). Defaults to `currentColor` so a wrapper's text token drives it. */
  color?: string
  /** Stroke width for outline icons. */
  strokeWidth?: number
  /** Fill color; defaults to `none` (outline). */
  fill?: string
  /** Accessible title — sets `role="img"` + `<title>`. Omit for a decorative icon (hidden from AT). */
  title?: string
}

export interface SvgIconProps extends IconProps {
  children: ReactNode
}

/**
 * Base SVG wrapper for the titan icon set — a 24×24 web-`<svg>` with the shared
 * accessibility contract (titled → `role="img"` + `<title>`; untitled →
 * `aria-hidden`) and `currentColor` inheritance. Icons pass their paths as
 * children plus their stroke/fill defaults.
 */
export function SvgIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  title,
  children,
}: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}
