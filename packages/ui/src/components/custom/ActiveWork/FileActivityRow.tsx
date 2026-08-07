// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Pressable } from 'react-native'
import { SparkBars } from '../charts'
import { Typography } from '../Typography'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FilePathLabel } from './FilePathLabel'

const t = getSemanticColors('dark')

/**
 * The read / write / edit colour vocabulary, shared by the row's inline counts
 * and {@link FileActivityDetail}'s tiles so one kind of event is one colour
 * everywhere in the explorer.
 */
export const FILE_EVENT_COLOR = {
  reads: t['text-tertiary'],
  writes: t['brand-primary'],
  edits: t['status-info'],
} as const

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
}

function EventCount({ value, suffix, color }: { value: number; suffix: string; color: string }) {
  return (
    <Typography variant="mono" style={{ fontSize: 11, color }}>
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
export function FileActivityRow({ file, selected = false, onSelect }: FileActivityRowProps) {
  return (
    <Pressable
      onPress={onSelect}
      // Raw `role`/`aria-selected` rather than `accessibilityState={{ selected }}`:
      // RNW silently drops the latter, so selection would never reach AT.
      role="option"
      aria-selected={selected}
      accessibilityLabel={`${file.path}, ${file.touches} touches`}
      testID="file-activity-row"
      className={`relative gap-[6px] rounded-[8px] px-[12px] py-[9px] ${
        selected ? 'bg-surface-raised' : ''
      }`}
    >
      {selected ? (
        <View
          testID="file-activity-row-accent"
          className="absolute bottom-[8px] left-0 top-[8px] w-[3px] rounded-r-[3px] bg-brand-primary"
        />
      ) : null}

      <View className="flex-row items-center justify-between gap-[10px]">
        <View className="shrink flex-row items-center">
          <FilePathLabel path={file.path} />
        </View>
        <Typography variant="mono" className="text-[12px] font-bold text-text-secondary">
          {String(file.touches)}
        </Typography>
      </View>

      <View className="flex-row items-center justify-between gap-[10px]">
        <View className="flex-row items-center gap-[7px]">
          <EventCount value={file.reads} suffix="r" color={FILE_EVENT_COLOR.reads} />
          <EventCount value={file.writes} suffix="w" color={FILE_EVENT_COLOR.writes} />
          <EventCount value={file.edits} suffix="e" color={FILE_EVENT_COLOR.edits} />
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
