import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo, useState } from 'react'
import { View, Pressable } from 'react-native'
import { Typography } from '../../components/custom/Typography'
import { Pill } from '../../components/ui/pill'
import { AwShell } from './AwShell'
import { DotLabel, SEVERITY_META, daysAgo } from './shared'
import { awData, type AwTask, type TaskSeverity } from './data/aw-data'

const SEV_RANK: Record<TaskSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const sevRank = (s?: TaskSeverity) => (s ? SEV_RANK[s] : 4)

type SortKey = 'slug' | 'id' | 'title' | 'severity' | 'priority' | 'estimate' | 'age'

const OPEN = awData.tasks.filter((t) => t.status === 'open')

const sevCounts = (() => {
  const c: Record<TaskSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const t of OPEN) if (t.severity) c[t.severity]++
  return c
})()

function comparator(key: SortKey): (a: AwTask, b: AwTask) => number {
  switch (key) {
    case 'slug':
      return (a, b) => a.slug.localeCompare(b.slug) || a.priority - b.priority
    case 'id':
      return (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })
    case 'title':
      return (a, b) => a.title.localeCompare(b.title)
    case 'severity':
      return (a, b) => sevRank(a.severity) - sevRank(b.severity) || a.priority - b.priority
    case 'estimate':
      return (a, b) => (a.estimate ?? Infinity) - (b.estimate ?? Infinity)
    case 'age':
      return (a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0)
    case 'priority':
    default:
      return (a, b) => a.priority - b.priority
  }
}

/** Column layout — fixed widths keep the grid dense and aligned. */
const COLS: { key: SortKey | 'tags'; label: string; w: string; align?: 'right'; sortable: boolean }[] = [
  { key: 'slug', label: 'Initiative', w: 'w-[132px]', sortable: true },
  { key: 'id', label: 'ID', w: 'w-[66px]', sortable: true },
  { key: 'title', label: 'Title', w: 'flex-1', sortable: true },
  { key: 'severity', label: 'Severity', w: 'w-[112px]', sortable: true },
  { key: 'priority', label: 'Pri', w: 'w-[42px]', align: 'right', sortable: true },
  { key: 'estimate', label: 'Est', w: 'w-[42px]', align: 'right', sortable: true },
  { key: 'tags', label: 'Tags', w: 'w-[150px]', sortable: false },
  { key: 'age', label: 'Age', w: 'w-[74px]', align: 'right', sortable: true },
]

function HeaderCell({
  col,
  sortKey,
  dir,
  onSort,
}: {
  col: (typeof COLS)[number]
  sortKey: SortKey
  dir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
}) {
  const active = col.sortable && col.key === sortKey
  const body = (
    <View className={`flex-row items-center gap-[3px] ${col.align === 'right' ? 'justify-end' : ''}`}>
      <Typography
        variant="overline"
        className={`text-[10px] font-semibold uppercase tracking-[0.5px] ${
          active ? 'text-text-secondary' : 'text-text-tertiary'
        }`}
      >
        {col.label}
      </Typography>
      {active ? (
        <Typography variant="caption" className="text-[9px] text-brand-primary">
          {dir === 'asc' ? '▲' : '▼'}
        </Typography>
      ) : null}
    </View>
  )
  if (!col.sortable) return <View className={`${col.w} px-[8px]`}>{body}</View>
  return (
    <Pressable
      accessibilityRole="columnheader"
      accessibilityLabel={`Sort by ${col.label}`}
      className={`${col.w} px-[8px]`}
      onPress={() => onSort(col.key as SortKey)}
    >
      {body}
    </Pressable>
  )
}

function Row({ t }: { t: AwTask }) {
  const sev = t.severity ? SEVERITY_META[t.severity] : null
  return (
    <View className="h-[34px] flex-row items-center border-b border-border-subtle">
      <View className="w-[132px] px-[8px]">
        <Typography variant="mono" numberOfLines={1} className="text-[11px] text-text-tertiary">
          {t.slug}
        </Typography>
      </View>
      <View className="w-[66px] px-[8px]">
        <Typography variant="mono" className="text-[11px] text-brand-primary">
          {t.id}
        </Typography>
      </View>
      <View className="flex-1 px-[8px]">
        <Typography variant="body2" numberOfLines={1} className="text-[12.5px] text-text-primary">
          {t.title}
        </Typography>
      </View>
      <View className="w-[112px] px-[8px]">
        {sev ? <DotLabel color={sev.dot} label={sev.label} /> : (
          <Typography variant="caption" className="text-[11px] text-text-tertiary">—</Typography>
        )}
      </View>
      <View className="w-[42px] items-end px-[8px]">
        <Typography variant="mono" className="text-[11px] text-text-secondary">{t.priority}</Typography>
      </View>
      <View className="w-[42px] items-end px-[8px]">
        <Typography variant="mono" className="text-[11px] text-text-secondary">
          {t.estimate ?? '—'}
        </Typography>
      </View>
      <View className="w-[150px] flex-row gap-[4px] px-[8px]">
        {(t.tags ?? []).slice(0, 2).map((tag) => (
          <Pill key={tag} variant="subtle" color="default" size="xs">
            {tag}
          </Pill>
        ))}
      </View>
      <View className="w-[74px] items-end px-[8px]">
        <Typography variant="caption" className="text-[10.5px] text-text-tertiary">
          {daysAgo(t.updated)}
        </Typography>
      </View>
    </View>
  )
}

function Legend() {
  const order: TaskSeverity[] = ['critical', 'high', 'medium', 'low']
  return (
    <View className="flex-row items-center gap-[12px]">
      {order.map((k) => (
        <View key={k} className="flex-row items-center gap-[5px]">
          <DotLabel color={SEVERITY_META[k].dot} label={SEVERITY_META[k].label} />
          <Typography variant="mono" className="text-[11px] text-text-tertiary">
            {sevCounts[k]}
          </Typography>
        </View>
      ))}
    </View>
  )
}

function TaskListView() {
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo(() => {
    const sorted = [...OPEN].sort(comparator(sortKey))
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [sortKey, dir])

  const onSort = (k: SortKey) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setDir(k === 'age' ? 'desc' : 'asc')
    }
  }

  return (
    <AwShell
      active="tasks"
      title="Tasks"
      subtitle={`${OPEN.length} open · all initiatives`}
      headerRight={<Legend />}
    >
      <View className="overflow-hidden rounded-[10px] border border-border-prominent">
        {/* Header */}
        <View className="h-[34px] flex-row items-center border-b border-border-prominent bg-surface-raised">
          {COLS.map((c) => (
            <HeaderCell key={c.key} col={c} sortKey={sortKey} dir={dir} onSort={onSort} />
          ))}
        </View>
        {/* Rows */}
        {rows.map((t) => (
          <Row key={`${t.slug}:${t.id}`} t={t} />
        ))}
      </View>
    </AwShell>
  )
}

const meta: Meta<typeof TaskListView> = {
  title: 'Lab/ActiveWork/Task List',
  component: TaskListView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**T2 · Task list (dense)** (read-only prototype). Every open task across all active-work ' +
          'initiatives in one Linear-style dense grid — click any header to sort (priority, severity, ' +
          'age, …). Severity legend with live tallies in the header. Real active-work data. Composes ' +
          'titan Pill / Indicator / Typography.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TaskListView>
export const Default: Story = {}
