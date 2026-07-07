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
