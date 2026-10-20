import { SvgIcon, type IconProps } from './SvgIcon'
import { StrokePaths } from './statusIcons'

// ---------------------------------------------------------------------------
// TD-988 · Media glyphs — a video thumbnail's play mark and its no-sound badge.
// ---------------------------------------------------------------------------

/** Play-triangle glyph (mirrors lucide-react `Play`). A video with no poster frame. */
export function PlayIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <StrokePaths paths={['M6 3 20 12 6 21Z']} />
    </SvgIcon>
  )
}

/** Muted-speaker glyph (mirrors lucide-react `VolumeX`). Media that has no sound. */
export function VolumeOffIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <StrokePaths
        paths={[
          'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z',
          'm22 9-6 6',
          'm16 9 6 6',
        ]}
      />
    </SvgIcon>
  )
}
