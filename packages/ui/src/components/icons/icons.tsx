import { SvgIcon, type IconProps } from './SvgIcon'

/**
 * Voltras brand mark — the ◇ diamond (outline). Pass `fill` for a solid mark.
 */
export function VoltrasMark({ size = 14, ...props }: IconProps) {
  return (
    <SvgIcon size={size} {...props}>
      <path d="M12 2 22 12 12 22 2 12Z" />
    </SvgIcon>
  )
}

/**
 * Bluetooth glyph (stroked) — e.g. device-connection state (color via `currentColor`).
 */
export function BluetoothIcon({ size = 18, ...props }: IconProps) {
  return (
    <SvgIcon size={size} {...props}>
      <path d="M7 7 17 17 12 22 12 2 17 7 7 17" />
    </SvgIcon>
  )
}

/** Dumbbell glyph (mirrors lucide-react `Dumbbell`). Outline-only by default. */
export function DumbbellIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14.4 14.4 9.6 9.6" />
      <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
      <path d="m21.5 21.5-1.4-1.4" />
      <path d="M3.9 3.9 2.5 2.5" />
      <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
    </SvgIcon>
  )
}

/** Star glyph (mirrors lucide-react `Star`). Pass `fill` for a solid star. */
export function StarIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </SvgIcon>
  )
}

/** Activity / pulse-line glyph (mirrors lucide-react `Activity`). Shell S2 nav → Live. */
export function ActivityIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </SvgIcon>
  )
}

/** History / clock-arrow glyph (mirrors lucide-react `History`). Shell S2 nav → Review. */
export function HistoryIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </SvgIcon>
  )
}

/** Layers / stack glyph (mirrors lucide-react `Layers`). Shell S2 nav → Program (mesocycle stack). */
export function LayersIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m6.08 9.5-3.49 1.59a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59" />
      <path d="m6.08 14.5-3.49 1.59a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59" />
    </SvgIcon>
  )
}

/** Standing-figure glyph (mirrors lucide-react `PersonStanding`). Shell S2 nav → Body (muscle map). */
export function PersonStandingIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="5" r="1" />
      <path d="m9 20 3-6 3 6" />
      <path d="m6 8 6 2 6-2" />
      <path d="M12 10v4" />
    </SvgIcon>
  )
}
