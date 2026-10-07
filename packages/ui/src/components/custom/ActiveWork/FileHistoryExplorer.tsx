// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Card } from '../../ui/card'
import { Divider } from '../../ui/divider'
import { FilePathLabel } from '../../ui/file-path-label'
import { Pill } from '../../ui/pill'
import { Tile } from '../../ui/tile'
import { Typography } from '../../ui/typography'
import { Eyebrow } from '../../ui/eyebrow'
import { FileActivityRow } from './FileActivityRow'
import { FileActivityDetail, type FileActivityDetailData } from './FileActivityDetail'
import { LISTBOX_ROLE } from './aria-roles'

/** A KPI shown in the strip above the explorer. */
export interface FileHistoryStat {
  label: string
  value: string
}

/** A repo-wide co-change pair, strongest first. */
export interface CoChangeEdge {
  a: string
  b: string
  count: number
}

/**
 * One symmetric "these two files change together" pair as a neutral Pill, with the
 * session count as a brand Pill in its trailing slot. Basenames only: at chip size
 * the directory is noise.
 */
function CoChangePill({ a, b, count }: CoChangeEdge) {
  return (
    <Pill
      tone="neutral"
      variant="subtle"
      size="md"
      rounded={false}
      className="gap-2"
      trailing={
        <Pill variant="subtle" tone="brand" size="xs">
          {`${count}×`}
        </Pill>
      }
      accessibilityRole="text"
      accessibilityLabel={`${a} and ${b} changed together ${count} times`}
      testID="co-change-chip"
    >
      <FilePathLabel path={a} size="sm" baseOnly />
      <Typography variant="caption" className="text-text-tertiary">
        ↔
      </Typography>
      <FilePathLabel path={b} size="sm" baseOnly />
    </Pill>
  )
}

export interface FileHistoryExplorerProps extends ViewProps {
  /** KPI tiles, e.g. Files / File events / Sessions / Transcripts. */
  stats: FileHistoryStat[]
  /** Files for the ranked list, already sorted (typically by descending touches). */
  files: FileActivityDetailData[]
  /** Repo-wide co-change pairs, already sorted by descending count. */
  coEdges?: CoChangeEdge[]
  /** Caption under the KPI strip explaining where the numbers came from. */
  provenance?: string
  /** Cap on ranked rows rendered. */
  maxRows?: number
  /** Cap on co-change chips rendered. */
  maxCoEdges?: number
  /** Selected file path. Omit to let the explorer manage selection itself. */
  selectedPath?: string
  /** Fires on row press. Required for the selection to move when `selectedPath` is set. */
  onSelectFile?: (path: string) => void
  className?: string
}

/**
 * FileHistoryExplorer — a file browser ranked by mined activity instead of
 * alphabetised by name: a KPI strip, a two-pane hottest-files list ⇄ detail,
 * and the repo's strongest co-change pairs.
 *
 * Composes Card / Tile / Divider plus {@link FileActivityRow},
 * {@link FileActivityDetail}, {@link Pill} co-change pairs and {@link Eyebrow}.
 * Selection is controlled when `selectedPath` is supplied and internal
 * otherwise.
 *
 * Data plan: presentational only — no fetch or store dependency. The caller
 * derives `stats`, `files` and `coEdges` from its own source of truth (the
 * active-work session-history miner). Wiring that export to these props is a
 * caller-side concern and the integration's only open gap; a shared adapter is
 * deliberately out of scope for this unit.
 */
export function FileHistoryExplorer({
  stats,
  files,
  coEdges = [],
  provenance,
  maxRows = 30,
  maxCoEdges = 8,
  selectedPath,
  onSelectFile,
  className,
  ...props
}: FileHistoryExplorerProps) {
  const [internalPath, setInternalPath] = useState<string | undefined>(files[0]?.path)
  const activePath = selectedPath ?? internalPath
  const selected = files.find((f) => f.path === activePath) ?? files[0]

  const select = (path: string) => {
    if (selectedPath === undefined) setInternalPath(path)
    onSelectFile?.(path)
  }

  return (
    <View className={cn('gap-3.5', className)} testID="file-history-explorer" {...props}>
      <View className="gap-1.5">
        <View className="flex-row flex-wrap gap-2.5">
          {stats.map((s) => (
            <Tile key={s.label} label={s.label} value={s.value} className="min-w-[130px]" />
          ))}
        </View>
        {provenance ? (
          <Typography variant="caption" className="text-xs text-text-tertiary">
            {provenance}
          </Typography>
        ) : null}
      </View>

      <View className="flex-row gap-3.5">
        <Card className="w-[420px] p-2" testID="file-list-pane">
          <View className="px-2.5 pb-1.5 pt-1">
            <Eyebrow>Hottest files</Eyebrow>
          </View>
          <Divider />
          <View className="pt-1" role={LISTBOX_ROLE} aria-label="Hottest files">
            {files.slice(0, maxRows).map((f) => (
              <FileActivityRow
                key={f.path}
                file={f}
                selected={f.path === selected?.path}
                onSelect={() => select(f.path)}
              />
            ))}
          </View>
        </Card>

        {selected ? <FileActivityDetail file={selected} /> : null}
      </View>

      {coEdges.length ? (
        <View className="gap-2">
          <Eyebrow>Strongest co-changes across the repo</Eyebrow>
          <View className="flex-row flex-wrap gap-2">
            {coEdges.slice(0, maxCoEdges).map((e) => (
              <CoChangePill key={`${e.a}|${e.b}`} {...e} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}
