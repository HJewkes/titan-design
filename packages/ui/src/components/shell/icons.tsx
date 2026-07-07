// Inline SVG icons for the shell chrome. Rendered as raw `<svg>` DOM elements —
// the same web-SVG mechanism `Workout/icons.tsx` and `Progress.tsx` use (web is
// the shell's surface; the dashboard consumes titan via react-native-web).

export interface ShellIconProps {
  /** Rendered width/height in px (viewBox is fixed 24×24). */
  size?: number
  /** Stroke color. Defaults to `currentColor` so it inherits the parent's text color. */
  color?: string
  /** Stroke width. */
  strokeWidth?: number
  /** Accessible title; sets `role="img"` + `<title>`. Omit for a decorative icon (hidden from AT). */
  title?: string
}

/**
 * Voltras brand mark — the ◇ diamond. Outline by default (matches the U+25C7
 * glyph it replaces); pass `fill` for a solid mark. Inherits `currentColor`.
 */
export function VoltrasMark({
  size = 14,
  color = 'currentColor',
  strokeWidth = 2,
  title,
}: ShellIconProps & { fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 2 22 12 12 22 2 12Z" />
    </svg>
  )
}

/**
 * Bluetooth glyph (stroked). Inherits `currentColor` by default so a wrapper's
 * text-color token (e.g. `text-status-success`) drives the connection-state color.
 */
export function BluetoothIcon({
  size = 18,
  color = 'currentColor',
  strokeWidth = 2,
  title,
}: ShellIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {title ? <title>{title}</title> : null}
      <path d="M7 7 17 17 12 22 12 2 17 7 7 17" />
    </svg>
  )
}
