// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Pressable } from 'react-native'
import { SparkBars } from '../charts'
import { Typography } from '../Typography'
import { resolveColor } from '../../../theme/resolve-color'
import { categoricalPalette } from '../../../theme/tokens/primitives'
import { FilePathLabel } from './FilePathLabel'

/** Fill per event kind, shared by the row's counts and the detail pane's tiles. */
export interface FileEventColors {
  reads: string
  writes: string
  edits: string
}

/**
 * Reads/writes/edits read as *importance* rather than as peer categories: reads
 * are cheap and quiet, writes are the consequential ones, edits sit between.
 */
export const FILE_EVENT_COLOR_SEMANTIC: FileEventColors = {
  reads: resolveColor('text-tertiary'),
  writes: resolveColor('brand-primary'),
  edits: resolveColor('status-info'),
}

/**
 * The same three as *peer categories*, taken in order from the canonical
 * CVD-safe palette (TOKENS.md §2) — systematic, but it drops the importance
 * ordering the semantic variant carries.
 */
export const FILE_EVENT_COLOR_CATEGORICAL: FileEventColors = {
  reads: categoricalPalette.default[0],
  writes: categoricalPalette.default[1],
  edits: categoricalPalette.default[2],
}

/** The family default. */
export const FILE_EVENT_COLOR = FILE_EVENT_COLOR_SEMANTIC

/** Per-file activity mined from session transcripts. */
export interface FileActivity {
  /** Repo-relative path. */
  path: string
  reads: number
  writes: number
  edits: number
  /** Total events across reads + writes + edits. */
  touches: number
  /** Per-session net char delta, oldest first. Drives the sparkline. */
  timeline: number[]
}

export interface FileActivityRowProps {
  file: FileActivity
  /** Renders the selected treatment (raised fill + leading accent bar). */
  selected?: boolean
  onSelect?: () => void
  /** Override the read/write/edit fills. Defaults to {@link FILE_EVENT_COLOR}. */
  eventColors?: FileEventColors
}

function EventCount({ value, suffix, color }: { value: number; suffix: string; color: string }) {
  return (
    <Typography variant="mono" className="text-xs" style={{ color }}>
      {`${value}${suffix}`}
    </Typography>
  )
}

/**
 * FileActivityRow — one file in the ranked "hottest files" list: its path, total
 * touches, the read/write/edit split, and a sparkline of per-session growth.
 *
 * Composes {@link FilePathLabel} and {@link SparkBars}. Used by
 * {@link FileHistoryExplorer}.
 */
export function FileActivityRow({
  file,
  selected = false,
  onSelect,
  eventColors = FILE_EVENT_COLOR,
}: FileActivityRowProps) {
  return (
    <Pressable
      onPress={onSelect}
      // Raw `role`/`aria-selected` rather than `accessibilityState={{ selected }}`:
      // RNW silently drops the latter, so selection would never reach AT.
      role="option"
      aria-selected={selected}
      accessibilityLabel={`${file.path}, ${file.touches} touches`}
      testID="file-activity-row"
      className={`relative gap-1.5 rounded-md px-3 py-2 ${selected ? 'bg-surface-raised' : ''}`}
    >
      {selected ? (
        <View
          testID="file-activity-row-accent"
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-[3px] bg-brand-primary"
        />
      ) : null}

      <View className="flex-row items-center justify-between gap-2.5">
        <View className="shrink flex-row items-center">
          <FilePathLabel path={file.path} />
        </View>
        <Typography variant="mono" className="text-xs font-bold text-text-secondary">
          {String(file.touches)}
        </Typography>
      </View>

      <View className="flex-row items-center justify-between gap-2.5">
        <View className="flex-row items-center gap-2">
          <EventCount value={file.reads} suffix="r" color={eventColors.reads} />
          <EventCount value={file.writes} suffix="w" color={eventColors.writes} />
          <EventCount value={file.edits} suffix="e" color={eventColors.edits} />
        </View>
        <SparkBars
          values={file.timeline}
          height={16}
          label={`Per-session growth for ${file.path}`}
        />
      </View>
    </Pressable>
  )
}
