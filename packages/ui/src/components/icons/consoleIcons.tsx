import { SvgIcon, type IconProps } from './SvgIcon'

// ---------------------------------------------------------------------------
// TD-407 · Console glyphs — search, data source and chart for a console shell
// and its command palette.
// ---------------------------------------------------------------------------

/** Magnifier glyph (mirrors lucide-react `Search`). Search field or command palette. */
export function SearchIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </SvgIcon>
  )
}

/** Database-cylinder glyph (mirrors lucide-react `Database`). A data source or store. */
export function DatabaseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </SvgIcon>
  )
}

/** Bar-chart glyph (mirrors lucide-react `ChartColumn`). A chart, report or metrics view. */
export function ChartIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </SvgIcon>
  )
}
