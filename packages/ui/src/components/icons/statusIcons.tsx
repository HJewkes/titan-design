import { SvgIcon, type IconProps } from './SvgIcon'

/**
 * Draws stroked path data inside an `SvgIcon`. The status glyphs below use it so that three new
 * icons add one web-only `<path>` site, not thirteen. The TD-689 baseline only shrinks, so they
 * live here rather than in `icons.tsx`; `mediaIcons.tsx` reuses it for the same reason.
 */
export function StrokePaths({ paths }: { paths: readonly string[] }) {
  return paths.map((d) => (
    // eslint-disable-next-line titan/no-html-element -- SvgIcon is a web <svg>; its children follow until icons move to react-native-svg
    <path key={d} d={d} />
  ))
}

/** A lucide `<circle cx="12" cy="12" r="10" />` as path data, so it can go through StrokePaths. */
const RING_PATH = 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0'

/** Checked-circle glyph (mirrors lucide-react `CircleCheck`). StatusGlyph → `success`. */
export function CircleCheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <StrokePaths paths={[RING_PATH, 'm9 12 2 2 4-4']} />
    </SvgIcon>
  )
}

/** Crossed-octagon glyph (mirrors lucide-react `OctagonX`). StatusGlyph → `error`. */
export function OctagonXIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <StrokePaths
        paths={[
          'm15 9-6 6',
          'M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z',
          'm9 9 6 6',
        ]}
      />
    </SvgIcon>
  )
}

/** Dashed-ring glyph (mirrors lucide-react `CircleDashed`). StatusGlyph → `neutral`. */
export function CircleDashedIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <StrokePaths
        paths={[
          'M10.1 2.182a10 10 0 0 1 3.8 0',
          'M13.9 21.818a10 10 0 0 1-3.8 0',
          'M17.609 3.721a10 10 0 0 1 2.69 2.7',
          'M2.182 13.9a10 10 0 0 1 0-3.8',
          'M20.279 17.609a10 10 0 0 1-2.7 2.69',
          'M21.818 10.1a10 10 0 0 1 0 3.8',
          'M3.721 6.391a10 10 0 0 1 2.7-2.69',
          'M6.391 20.279a10 10 0 0 1-2.69-2.7',
        ]}
      />
    </SvgIcon>
  )
}

/** Up-pointing triangle (mirrors lucide-react `Triangle`). SetLossStrip → reps over target. */
export function TriangleUpIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <StrokePaths
        paths={['M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z']}
      />
    </SvgIcon>
  )
}

/** `TriangleUpIcon` mirrored top to bottom. SetLossStrip → reps under target. */
export function TriangleDownIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <StrokePaths
        paths={['M13.73 20a2 2 0 0 1-3.46 0l-8-14A2 2 0 0 1 4 3h16a2 2 0 0 1 1.73 3Z']}
      />
    </SvgIcon>
  )
}
