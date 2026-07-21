// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, type ViewProps } from 'react-native'
import { Surface, onSurfaceColors, useSurfaceMode } from '../../ui/surface'
import { Typography } from '../Typography'
import { TimerReadout } from '../TimerReadout'
import { SegmentedProgressBar } from './SegmentedProgressBar'
import { MetricTiles, type MetricTileData } from './MetricTiles'
import { ScheduleTiles } from './ScheduleTiles'
import { paceTone, paceToneColor } from './paceTone'

// The header sits FLAT on the rail's content plane — it is workout content, not shell
// chrome, so it no longer paints a distinct dark plane. The `<Surface>` wrapper is kept
// only for its on-surface colour CONTEXT (title/label text resolve their colour from it);
// its background is dropped to transparent. Separation from the exercise list below comes
// from a partial hairline (drawn by SessionRail), not a surface step.

// The chunked pace bar matches the SetStrip language but sits tighter than the default
// SetStrip gap (5) — the locked design uses a 3px gap and a 9px track.
const BAR_HEIGHT = 9
const BAR_GAP = 3

export interface SessionHeaderPlanEntry {
  /** Exercise name (currently informational — chunk widths come from `sets`). */
  name?: string
  /** Planned set count — drives this exercise's chunk width (∝ sets). */
  sets: number
}

export interface SessionHeaderProps extends ViewProps {
  /** Session title — the live session's name, or the next session's name when `next` is set. */
  title: string
  /** Exercises in order → chunk widths (∝ sets). */
  plan: SessionHeaderPlanEntry[]
  /** Fractional sets completed (live). 0/undefined leaves the bar empty. */
  setsDone?: number
  /** Live elapsed time in ms — drives the ⏱ readout and the pace marker. */
  elapsedMs?: number
  /** Optional time budget in ms → adds the pace marker and the ` / budget` suffix. Omit → no marker, plain (steel) progress. */
  budgetMs?: number
  /** Elapsed readout goes live-green while true. Default true (live). */
  running?: boolean
  /** Live stat tiles (Volume / Load / Fatigue). Ignored when `next` is set. */
  metrics?: MetricTileData[]
  /** When set → UPCOMING layout: schedule tiles + empty bar; `title` is the next session's name. */
  next?: number | Date
  className?: string
}

/**
 * The session-rail heading: the session title over a stat row and a chunked pace bar.
 * Live, it shows Volume/Load/Fatigue tiles, a per-exercise progress bar (fill ∝ sets
 * done, coloured green/amber against the elapsed-vs-budget pace, with a live marker),
 * a mono `n/total sets` label and a ⏱ elapsed readout. Upcoming (`next` set), the tiles
 * become Date/Time/Until, the bar is the empty plan shape, and the readout shows the
 * planned duration. Rendered on the raised charcoal plane; presentational. Composes
 * {@link MetricTiles} / {@link ScheduleTiles} + {@link SegmentedProgressBar} +
 * {@link TimerReadout}.
 */
export function SessionHeader({
  title,
  plan,
  setsDone = 0,
  elapsedMs,
  budgetMs,
  running = true,
  metrics = [],
  next,
  className,
  style,
  ...props
}: SessionHeaderProps) {
  const upcoming = next != null
  const totalSets = plan.reduce((sum, e) => sum + e.sets, 0)
  const onSurface = onSurfaceColors(useSurfaceMode())

  const hasPace = !upcoming && budgetMs != null && elapsedMs != null
  const target = hasPace ? (elapsedMs as number) / (budgetMs as number) : undefined

  const setsLabel = upcoming ? `${totalSets} sets` : `${Math.floor(setsDone)}/${totalSets} sets`
  const setsLabelColor = upcoming
    ? onSurface.secondary
    : paceToneColor(paceTone(totalSets > 0 ? setsDone / totalSets : 0, target))

  return (
    <Surface
      level="background"
      className={className}
      // Content, not chrome: the heading sits FLAT on the rail's content plane —
      // no distinct dark plane fill. Keep the Surface for its on-surface colour
      // context; the transparent bg (applied via the prop `style`, which wins over
      // Surface's computed background) drops the plane. Separation from the list
      // below is a partial hairline drawn by SessionRail, not a surface step.
      style={[
        {
          backgroundColor: 'transparent',
          paddingTop: 11,
          paddingRight: 12,
          paddingBottom: 12,
          paddingLeft: 12,
          zIndex: 2,
        },
        style,
      ]}
      testID="session-rail-header"
      {...props}
    >
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 16,
          lineHeight: 18,
          fontWeight: '700',
          fontFamily: '"Space Grotesk", sans-serif',
          color: onSurface.primary,
          marginBottom: 10,
        }}
        testID="session-rail-title"
      >
        {title}
      </Text>

      {upcoming ? <ScheduleTiles when={next} /> : <MetricTiles metrics={metrics} />}

      <View style={{ marginTop: 10 }}>
        <SegmentedProgressBar
          segments={plan.map((e) => ({ weight: e.sets }))}
          value={upcoming ? 0 : setsDone}
          target={target}
          height={BAR_HEIGHT}
          gap={BAR_GAP}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: 5,
          }}
        >
          <Typography
            variant="mono"
            style={{ fontSize: 10, color: setsLabelColor }}
            testID="session-rail-sets"
          >
            {setsLabel}
          </Typography>
          <TimerReadout
            mode="up"
            elapsedMs={upcoming ? budgetMs : elapsedMs}
            durationMs={budgetMs}
            running={running && !upcoming}
            showTotal={budgetMs != null && !upcoming}
          />
        </View>
      </View>
    </Surface>
  )
}
