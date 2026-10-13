import { useId } from 'react'
import { SvgIcon, type IconProps } from './SvgIcon'
import { CHECK_MARK_MASK_WIDTH, CHECK_MARK_SPINE, checkMarkOutline } from './checkMarkGeometry'

/**
 * Check mark: a brush stroke with a flat vertical start cut that swells at the apex and tapers
 * to a hairline. Replaces the ✓ text glyph, which no titan font carries, so it rendered in
 * whatever font the host had. `strokeWidth` sets the brush weight.
 *
 * The outline is a filled polygon seen through a mask. The mask is one stroked spine, short leg
 * first, with `pathLength={1}`: a stroke-dash draw-on of the spine draws the mark on, and the
 * fully drawn spine shows the whole mark.
 */
export function CheckMark(props: IconProps) {
  const { strokeWidth = 2, color = 'currentColor', ...rest } = props
  const maskId = useId()
  const points = checkMarkOutline(strokeWidth)
    .map(([x, y]) => `${String(x)},${String(y)}`)
    .join(' ')
  return (
    <SvgIcon {...rest} color={color} strokeWidth={strokeWidth}>
      {/* eslint-disable-next-line titan/no-html-element -- web SVG like the rest of the SvgIcon set until it moves to react-native-svg */}
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
        <path
          d={CHECK_MARK_SPINE}
          pathLength={1}
          fill="none"
          // eslint-disable-next-line titan/no-raw-color -- mask luminance, not a theme colour: white shows the mark
          stroke="white"
          strokeWidth={strokeWidth * CHECK_MARK_MASK_WIDTH}
          strokeLinecap="butt"
        />
      </mask>
      {/* eslint-disable-next-line titan/no-html-element -- web SVG like the rest of the SvgIcon set until it moves to react-native-svg */}
      <polygon points={points} fill={color} stroke="none" mask={`url(#${maskId})`} />
    </SvgIcon>
  )
}
