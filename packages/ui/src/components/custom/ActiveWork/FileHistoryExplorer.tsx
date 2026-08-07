// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useState } from 'react'
import { View, type ViewProps } from 'react-native'
import { Card } from '../../ui/card'
import { Divider } from '../../ui/divider'
import { Tile } from '../../ui/tile'
import { Typography } from '../Typography'
import { Eyebrow } from './Eyebrow'
import { CoChangeChip } from './CoChangeChip'
import { FileActivityRow } from './FileActivityRow'
import { FileActivityDetail, type FileActivityDetailData } from './FileActivityDetail'

/**
 * React Native's `Role` union has `'option'` but omits `'listbox'`, even though
 * RNW passes it straight through to the DOM. Cast once here rather than drop
 * the ARIA parent that makes the option rows valid.
 */
const LISTBOX_ROLE = 'listbox' as ViewProps['role']

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
 * {@link FileActivityDetail}, {@link CoChangeChip} and {@link Eyebrow}.
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
    <View className={`gap-[14px] ${className ?? ''}`} testID="file-history-explorer" {...props}>
      <View className="gap-[6px]">
        <View className="flex-row flex-wrap gap-[10px]">
          {stats.map((s) => (
            <Tile key={s.label} label={s.label} value={s.value} className="min-w-[130px]" />
          ))}
        </View>
        {provenance ? (
          <Typography variant="caption" className="text-[10.5px] text-text-tertiary">
            {provenance}
          </Typography>
        ) : null}
      </View>

      <View className="flex-row gap-[14px]">
        <Card variant="outline" className="w-[420px] p-[8px]">
          <View className="px-[10px] pb-[6px] pt-[4px]">
            <Eyebrow>Hottest files</Eyebrow>
          </View>
          <Divider />
          <View className="pt-[4px]" role={LISTBOX_ROLE} aria-label="Hottest files">
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
        <View className="gap-[8px]">
          <Eyebrow>Strongest co-changes across the repo</Eyebrow>
          <View className="flex-row flex-wrap gap-[8px]">
            {coEdges.slice(0, maxCoEdges).map((e) => (
              <CoChangeChip key={`${e.a}|${e.b}`} a={e.a} b={e.b} count={e.count} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}
