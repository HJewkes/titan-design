// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { Card } from '../../ui/card'
import { Pill } from '../../ui/pill'
import { Tile } from '../../ui/tile'
import { DataRow } from '../../ui/data-row'
import { SparkBars } from '../charts'
import { DateTime } from '../DateTime'
import { Typography } from '../Typography'
import { formatCompact, formatSignedCompact } from '../../../utils/number-format'
import { resolveColor } from '../../../theme/resolve-color'
import { Eyebrow } from './Eyebrow'
import { FilePathLabel, splitPath } from './FilePathLabel'
import { FILE_EVENT_COLOR, type FileEventColors, type FileActivity } from './FileActivityRow'

/**
 * Growth stats are *char deltas* — a measurement moving up or down — so they take
 * the `result-*` family, not `status-*` and not {@link FILE_EVENT_COLOR}. A file
 * that net-shrank was refactored, not broken. See TOKENS.md §1.
 */
const GROWTH_COLOR = {
  added: resolveColor('result-improve'),
  removed: resolveColor('result-degrade'),
  neutral: resolveColor('result-neutral'),
} as const

/** Another file that tends to change in the same session as this one. */
export interface FileCoChange {
  path: string
  count: number
}

/** {@link FileActivity} plus the history only the detail pane shows. */
export interface FileActivityDetailData extends FileActivity {
  /** Distinct sessions that touched this file. */
  sessions: number
  charsAdded: number
  charsRemoved: number
  /** `charsAdded - charsRemoved`; negative means the file net-shrank. */
  netGrowth: number
  firstTouched?: string | null
  lastTouched?: string | null
  coChange: FileCoChange[]
}

export interface FileActivityDetailProps {
  file: FileActivityDetailData
  /** Override the read/write/edit fills. Defaults to {@link FILE_EVENT_COLOR}. */
  eventColors?: FileEventColors
  className?: string
}

function GrowthStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 gap-0.5">
      <Eyebrow>{label}</Eyebrow>
      <Typography variant="mono" className="text-lg font-bold" style={{ color }}>
        {value}
      </Typography>
    </View>
  )
}

/**
 * FileActivityDetail — the right-hand pane of {@link FileHistoryExplorer}: one
 * file's full mined history. Activity split, net char growth over sessions, and
 * the files it changes together with — the co-change list being the part a
 * plain file tree cannot show.
 *
 * Composes Card / Tile / Pill / DataRow / DateTime plus {@link SparkBars},
 * {@link FilePathLabel} and {@link Eyebrow}.
 */
export function FileActivityDetail({
  file,
  eventColors = FILE_EVENT_COLOR,
  className,
}: FileActivityDetailProps) {
  const { dir, base } = splitPath(file.path)
  const grew = file.netGrowth >= 0

  return (
    <Card
      variant="outline"
      className={`flex-1 gap-4 p-4 ${className ?? ''}`}
      testID="file-activity-detail"
    >
      <View className="gap-1">
        <Typography variant="mono" className="text-xs text-text-tertiary">
          {dir || './'}
        </Typography>
        <Typography variant="mono" className="text-base font-bold text-text-primary">
          {base}
        </Typography>
        <View className="flex-row items-center gap-1">
          <Typography variant="caption" className="text-xs text-text-tertiary">
            {`${file.sessions} sessions · last touched `}
          </Typography>
          <DateTime
            value={file.lastTouched}
            format="short"
            fallback="—"
            className="text-xs text-text-tertiary"
          />
          <Typography variant="caption" className="text-xs text-text-tertiary">
            {' · first '}
          </Typography>
          <DateTime
            value={file.firstTouched}
            format="short"
            fallback="—"
            className="text-xs text-text-tertiary"
          />
        </View>
      </View>

      <View className="flex-row gap-2">
        <Tile label="Reads" value={String(file.reads)} valueColor={eventColors.reads} />
        <Tile label="Writes" value={String(file.writes)} valueColor={eventColors.writes} />
        <Tile label="Edits" value={String(file.edits)} valueColor={eventColors.edits} />
        <Tile label="Touches" value={String(file.touches)} />
      </View>

      <Card variant="outline" className="gap-2 rounded-lg p-3">
        <View className="flex-row items-center justify-between">
          <Eyebrow>Net change over sessions</Eyebrow>
          <Typography
            variant="mono"
            className="text-sm font-bold"
            style={{ color: grew ? GROWTH_COLOR.added : GROWTH_COLOR.removed }}
          >
            {`${formatSignedCompact(file.netGrowth)} ch`}
          </Typography>
        </View>
        <SparkBars
          values={file.timeline}
          height={34}
          label={`Per-session net char change for ${file.path}`}
        />
        <View className="flex-row gap-4">
          <GrowthStat
            label="Added"
            value={`+${formatCompact(file.charsAdded)}`}
            color={GROWTH_COLOR.added}
          />
          <GrowthStat
            label="Removed"
            value={`-${formatCompact(file.charsRemoved)}`}
            color={GROWTH_COLOR.removed}
          />
          <GrowthStat label="Sessions" value={String(file.sessions)} color={GROWTH_COLOR.neutral} />
        </View>
      </Card>

      <View className="gap-0.5">
        <Eyebrow>Changes together with</Eyebrow>
        {file.coChange.length ? (
          file.coChange.map((c) => (
            <DataRow
              key={c.path}
              className="py-1"
              labelClassName="shrink"
              label={<FilePathLabel path={c.path} size="sm" />}
              value={
                <Pill variant="subtle" color="primary" size="xs">
                  {`${c.count}×`}
                </Pill>
              }
            />
          ))
        ) : (
          <Typography variant="caption" className="text-xs text-text-tertiary">
            no co-changes recorded
          </Typography>
        )}
      </View>
    </Card>
  )
}
