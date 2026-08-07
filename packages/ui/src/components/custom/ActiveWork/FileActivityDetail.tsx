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
import { Eyebrow } from './Eyebrow'
import { FilePathLabel, splitPath } from './FilePathLabel'
import { FILE_EVENT_COLOR, type FileActivity } from './FileActivityRow'

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
  className?: string
}

function GrowthStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 gap-[2px]">
      <Eyebrow>{label}</Eyebrow>
      <Typography variant="mono" style={{ fontSize: 18, color }} className="font-bold">
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
export function FileActivityDetail({ file, className }: FileActivityDetailProps) {
  const { dir, base } = splitPath(file.path)
  const grew = file.netGrowth >= 0

  return (
    <Card
      variant="outline"
      className={`flex-1 gap-[16px] p-[18px] ${className ?? ''}`}
      testID="file-activity-detail"
    >
      <View className="gap-[3px]">
        <Typography variant="mono" className="text-[11px] text-text-tertiary">
          {dir || './'}
        </Typography>
        <Typography variant="mono" className="text-[16px] font-bold text-text-primary">
          {base}
        </Typography>
        <View className="flex-row items-center gap-[4px]">
          <Typography variant="caption" className="text-[11px] text-text-tertiary">
            {`${file.sessions} sessions · last touched `}
          </Typography>
          <DateTime
            value={file.lastTouched}
            format="short"
            fallback="—"
            className="text-[11px] text-text-tertiary"
          />
          <Typography variant="caption" className="text-[11px] text-text-tertiary">
            {' · first '}
          </Typography>
          <DateTime
            value={file.firstTouched}
            format="short"
            fallback="—"
            className="text-[11px] text-text-tertiary"
          />
        </View>
      </View>

      <View className="flex-row gap-[8px]">
        <Tile label="Reads" value={String(file.reads)} valueColor={FILE_EVENT_COLOR.reads} />
        <Tile label="Writes" value={String(file.writes)} valueColor={FILE_EVENT_COLOR.writes} />
        <Tile label="Edits" value={String(file.edits)} valueColor={FILE_EVENT_COLOR.edits} />
        <Tile label="Touches" value={String(file.touches)} />
      </View>

      <View className="gap-[8px] rounded-[10px] border border-border-subtle p-[12px]">
        <View className="flex-row items-center justify-between">
          <Eyebrow>Net change over sessions</Eyebrow>
          <Typography
            variant="mono"
            className={`text-[13px] font-bold ${grew ? 'text-brand-primary' : 'text-status-error'}`}
          >
            {`${formatSignedCompact(file.netGrowth)} ch`}
          </Typography>
        </View>
        <SparkBars
          values={file.timeline}
          height={34}
          label={`Per-session net char change for ${file.path}`}
        />
        <View className="flex-row gap-[16px]">
          <GrowthStat
            label="Added"
            value={`+${formatCompact(file.charsAdded)}`}
            color={FILE_EVENT_COLOR.writes}
          />
          <GrowthStat
            label="Removed"
            value={`-${formatCompact(file.charsRemoved)}`}
            color={FILE_EVENT_COLOR.reads}
          />
          <GrowthStat
            label="Sessions"
            value={String(file.sessions)}
            color={FILE_EVENT_COLOR.edits}
          />
        </View>
      </View>

      <View className="gap-[2px]">
        <Eyebrow>Changes together with</Eyebrow>
        {file.coChange.length ? (
          file.coChange.map((c) => (
            <DataRow
              key={c.path}
              className="py-[3px]"
              labelClassName="shrink"
              label={<FilePathLabel path={c.path} size={11.5} />}
              value={
                <Pill variant="subtle" color="primary" size="xs">
                  {`${c.count}×`}
                </Pill>
              }
            />
          ))
        ) : (
          <Typography variant="caption" className="text-[11px] text-text-tertiary">
            no co-changes recorded
          </Typography>
        )}
      </View>
    </Card>
  )
}
