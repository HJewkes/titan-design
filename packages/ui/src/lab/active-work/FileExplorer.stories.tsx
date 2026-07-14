import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Pressable } from 'react-native'
import { Typography } from '../../components/custom/Typography'
import { Card } from '../../components/ui/card'
import { Tile } from '../../components/ui/tile'
import { Pill } from '../../components/ui/pill'
import { Divider } from '../../components/ui/divider'
import { AwShell } from './AwShell'
import { Eyebrow, MiniBars, compact, signedCompact, shortDate } from './shared'
import { fileHistory, type FileMetric } from './data/file-metrics'

const files = fileHistory.files
const g = fileHistory.generatedFrom

/** Split a path into a dimmed directory prefix + a bright basename. */
function splitPath(p: string): { dir: string; base: string } {
  const i = p.lastIndexOf('/')
  return i === -1 ? { dir: '', base: p } : { dir: p.slice(0, i + 1), base: p.slice(i + 1) }
}

/** Colored r / w / e breakdown inline. */
function RWE({ f, size = 11 }: { f: FileMetric; size?: number }) {
  return (
    <View className="flex-row items-center gap-[7px]">
      <Typography variant="mono" style={{ fontSize: size }} className="text-text-tertiary">
        {f.reads}r
      </Typography>
      <Typography variant="mono" style={{ fontSize: size }} className="text-brand-primary">
        {f.writes}w
      </Typography>
      <Typography variant="mono" style={{ fontSize: size }} className="text-status-info">
        {f.edits}e
      </Typography>
    </View>
  )
}

function PathLabel({ path, baseSize = 12 }: { path: string; baseSize?: number }) {
  const { dir, base } = splitPath(path)
  return (
    <View className="flex-row items-center">
      {dir ? (
        <Typography
          variant="mono"
          numberOfLines={1}
          style={{ fontSize: baseSize - 1.5 }}
          className="shrink text-text-tertiary"
        >
          {dir}
        </Typography>
      ) : null}
      <Typography variant="mono" style={{ fontSize: baseSize }} className="text-text-primary">
        {base}
      </Typography>
    </View>
  )
}

function FileRow({
  f,
  selected,
  onSelect,
}: {
  f: FileMetric
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`relative gap-[6px] rounded-[8px] px-[12px] py-[9px] ${
        selected ? 'bg-surface-raised' : ''
      }`}
    >
      {selected ? (
        <View className="absolute bottom-[8px] left-0 top-[8px] w-[3px] rounded-r-[3px] bg-brand-primary" />
      ) : null}
      <View className="flex-row items-center justify-between gap-[10px]">
        <View className="shrink flex-row items-center">
          <PathLabel path={f.path} />
        </View>
        <Typography variant="mono" className="text-[12px] font-bold text-text-secondary">
          {f.touches}
        </Typography>
      </View>
      <View className="flex-row items-center justify-between gap-[10px]">
        <RWE f={f} />
        <MiniBars values={f.timeline} className="h-[16px]" />
      </View>
    </Pressable>
  )
}

function GrowthStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View className="flex-1 gap-[2px]">
      <Eyebrow>{label}</Eyebrow>
      <Typography variant="mono" style={{ fontSize: 18 }} className={`font-bold ${tone}`}>
        {value}
      </Typography>
    </View>
  )
}

function DetailPane({ f }: { f: FileMetric }) {
  const { dir, base } = splitPath(f.path)
  return (
    <Card variant="outline" className="flex-1 gap-[16px] p-[18px]">
      {/* header */}
      <View className="gap-[3px]">
        <Typography variant="mono" className="text-[11px] text-text-tertiary">
          {dir || './'}
        </Typography>
        <Typography variant="mono" className="text-[16px] font-bold text-text-primary">
          {base}
        </Typography>
        <Typography variant="caption" className="text-[11px] text-text-tertiary">
          {`${f.sessions} sessions · last touched ${shortDate(f.lastTouched)} · first ${shortDate(
            f.firstTouched,
          )}`}
        </Typography>
      </View>

      {/* activity tiles */}
      <View className="flex-row gap-[8px]">
        <Card variant="filled" className="flex-1 p-[10px]">
          <Tile label="Reads" value={String(f.reads)} />
        </Card>
        <Card variant="filled" className="flex-1 p-[10px]">
          <Tile label="Writes" value={String(f.writes)} valueColor="var(--color-brand-primary)" />
        </Card>
        <Card variant="filled" className="flex-1 p-[10px]">
          <Tile label="Edits" value={String(f.edits)} valueColor="var(--color-status-info)" />
        </Card>
        <Card variant="filled" className="flex-1 p-[10px]">
          <Tile label="Touches" value={String(f.touches)} />
        </Card>
      </View>

      {/* growth */}
      <View className="gap-[8px] rounded-[10px] border border-border-subtle p-[12px]">
        <View className="flex-row items-center justify-between">
          <Eyebrow>Net change over sessions</Eyebrow>
          <Typography
            variant="mono"
            className={`text-[13px] font-bold ${
              f.netGrowth >= 0 ? 'text-brand-primary' : 'text-status-error'
            }`}
          >
            {signedCompact(f.netGrowth)} ch
          </Typography>
        </View>
        <MiniBars values={f.timeline} className="h-[34px]" />
        <View className="flex-row gap-[16px]">
          <GrowthStat label="Added" value={`+${compact(f.charsAdded)}`} tone="text-brand-primary" />
          <GrowthStat
            label="Removed"
            value={`-${compact(f.charsRemoved)}`}
            tone="text-status-error"
          />
          <GrowthStat label="Sessions" value={String(f.sessions)} tone="text-text-primary" />
        </View>
      </View>

      {/* co-change */}
      <View className="gap-[8px]">
        <Eyebrow>Changes together with</Eyebrow>
        {f.coChange.length ? (
          f.coChange.map((c) => (
            <View key={c.path} className="flex-row items-center justify-between gap-[10px]">
              <View className="shrink">
                <PathLabel path={c.path} baseSize={11.5} />
              </View>
              <Pill variant="subtle" color="primary" size="xs">
                {`${c.count}×`}
              </Pill>
            </View>
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

function FileExplorer() {
  const [sel, setSel] = useState(0)
  const selected = files[sel]

  return (
    <AwShell
      active="files"
      title="File history"
      subtitle={`${fileHistory.project} · ${files.length} files`}
    >
      {/* KPI strip */}
      <View className="gap-[6px]">
        <View className="flex-row flex-wrap gap-[10px]">
          <Card variant="filled" className="min-w-[130px] flex-1 p-[12px]">
            <Tile label="Files" value={String(files.length)} />
          </Card>
          <Card variant="filled" className="min-w-[130px] flex-1 p-[12px]">
            <Tile label="File events" value={compact(g.fileEvents)} />
          </Card>
          <Card variant="filled" className="min-w-[130px] flex-1 p-[12px]">
            <Tile label="Sessions" value={String(g.sessions)} />
          </Card>
          <Card variant="filled" className="min-w-[130px] flex-1 p-[12px]">
            <Tile label="Transcripts" value={String(g.transcripts)} />
          </Card>
        </View>
        <Typography variant="caption" className="text-[10.5px] text-text-tertiary">
          deterministically mined from Claude Code session transcripts · ranked by total touches
        </Typography>
      </View>

      {/* two-pane explorer */}
      <View className="flex-row gap-[14px]">
        {/* ranked list */}
        <Card variant="outline" className="w-[420px] p-[8px]">
          <View className="px-[10px] pb-[6px] pt-[4px]">
            <Eyebrow>Hottest files</Eyebrow>
          </View>
          <Divider />
          <View className="pt-[4px]">
            {files.slice(0, 30).map((f, i) => (
              <FileRow key={f.path} f={f} selected={i === sel} onSelect={() => setSel(i)} />
            ))}
          </View>
        </Card>

        {/* detail */}
        {selected ? <DetailPane f={selected} /> : null}
      </View>

      {/* strongest co-changes across the repo */}
      <View className="gap-[8px]">
        <Eyebrow>Strongest co-changes across the repo</Eyebrow>
        <View className="flex-row flex-wrap gap-[8px]">
          {fileHistory.coEdges.slice(0, 8).map((e) => (
            <Card key={`${e.a}|${e.b}`} variant="filled" className="gap-[4px] p-[10px]">
              <View className="flex-row items-center gap-[7px]">
                <Typography variant="mono" className="text-[11px] text-text-secondary">
                  {splitPath(e.a).base}
                </Typography>
                <Typography variant="caption" className="text-text-tertiary">
                  ↔
                </Typography>
                <Typography variant="mono" className="text-[11px] text-text-secondary">
                  {splitPath(e.b).base}
                </Typography>
                <Pill variant="subtle" color="primary" size="xs">
                  {`${e.count}×`}
                </Pill>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </AwShell>
  )
}

const meta: Meta<typeof FileExplorer> = {
  title: 'Lab/ActiveWork/File History Explorer',
  component: FileExplorer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**F1 · File-history explorer** — deterministic session-history mining. Instead of a dumb ' +
          'file tree, every file is enriched with metrics mined purely from Claude Code session ' +
          'transcripts (reads / writes / edits, net char growth over sessions, and — the key insight — ' +
          'which files *change together*). Real data from the `codewatch` project (2312 file events / ' +
          '291 sessions). Composes titan Card / Tile / Pill / Divider + shared MiniBars.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FileExplorer>
export const Default: Story = {}
