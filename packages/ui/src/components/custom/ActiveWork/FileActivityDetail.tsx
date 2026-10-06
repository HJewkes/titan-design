// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
// Deep import: `CardInset` is not on the card barrel yet (Lab/Depth reaches it the same way).
import { Card } from '../../ui/card/Card'
import { Pill } from '../../ui/pill'
import { Tile } from '../../ui/tile'
import { DataRow } from '../../ui/data-row'
import { DateTime } from '../../ui/date-time'
import { Typography } from '../../ui/typography'
import { Eyebrow } from '../../ui/eyebrow'
import { FilePathLabel, splitPath } from '../../ui/file-path-label'
import { GrowthWell } from './FileActivityGrowthWell'
import { FILE_EVENT_COLOR, type FileEventColors, type FileActivity } from './FileActivityRow'

/**
 * `Tile` paints `surface-raised` itself, which IS this card's plane. Inside the
 * lifted pane it has to read one plane up to separate at all. Overriding the
 * fill at the call site keeps Tile's own default right for a page-level strip;
 * teaching Tile to resolve its plane from the surface context is its own epic.
 */
const TILE_PLANE = 'bg-surface-overlay'

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

/**
 * FileActivityDetail — the right-hand pane of {@link FileHistoryExplorer}: one
 * file's full mined history. Activity split, net char growth over sessions, and
 * the files it changes together with — the co-change list being the part a
 * plain file tree cannot show.
 *
 * Composes Card / CardInset / Tile / Pill / DataRow / DateTime plus
 * {@link SparkBars}, {@link FilePathLabel} and {@link Eyebrow}.
 *
 * One lift only: the pane itself. Inside it the activity split reads as filled
 * tiles a plane up and the growth block as a `CardInset` well a plane down.
 */
export function FileActivityDetail({
  file,
  eventColors = FILE_EVENT_COLOR,
  className,
}: FileActivityDetailProps) {
  const { dir, base } = splitPath(file.path)

  return (
    <Card className={cn('flex-1 gap-4 p-4', className)} testID="file-activity-detail">
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
        {/* Tile's own fill is the card plane, which is this card; step it one up. */}
        <Tile
          label="Reads"
          value={String(file.reads)}
          valueColor={eventColors.reads}
          className={TILE_PLANE}
        />
        <Tile
          label="Writes"
          value={String(file.writes)}
          valueColor={eventColors.writes}
          className={TILE_PLANE}
        />
        <Tile
          label="Edits"
          value={String(file.edits)}
          valueColor={eventColors.edits}
          className={TILE_PLANE}
        />
        <Tile label="Touches" value={String(file.touches)} className={TILE_PLANE} />
      </View>

      <GrowthWell file={file} />

      <View className="gap-0.5">
        <Eyebrow>Changes together with</Eyebrow>
        {file.coChange.length ? (
          file.coChange.map((c) => (
            <DataRow
              key={c.path}
              // The card's `p-4` is already this column's gutter, so the row drops
              // its own inset rather than indenting the co-change list inside it.
              className="px-0 py-1"
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
