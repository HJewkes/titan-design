import { SvgIcon, type IconProps } from './SvgIcon'

/**
 * Check mark (the lucide-react `Check` geometry). Replaces the ✓ text glyph, which no titan
 * font carries, so it rendered in whatever font the host had.
 *
 * One open subpath, short leg first, with `pathLength={1}`: a stroke-dash draw-on runs left
 * to right with a dash of 1 at any rendered size.
 */
export function CheckMark(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 12l5 5L20 6" pathLength={1} />
    </SvgIcon>
  )
}
