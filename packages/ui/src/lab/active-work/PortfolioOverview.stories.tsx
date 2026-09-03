import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Typography } from '../../components/custom/Typography'
import { Card } from '../../components/ui/card'
import { Metric } from '../../components/custom/Metric'
import { Pill } from '../../components/ui/pill'
import { AwShell } from './AwShell'
import { DotLabel, Eyebrow, STATE_META, SEVERITY_META } from './shared'
import { awData, type InitiativeSummary, type TaskSeverity } from './data/aw-data'

/** Per-initiative rollup derived from the real task list (read-only compute). */
function rollup(slug: string) {
  const open = awData.tasks.filter((t) => t.slug === slug && t.status === 'open')
  const top = [...open].sort((a, b) => a.priority - b.priority)[0]
  const sev: Record<TaskSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const t of open) if (t.severity) sev[t.severity]++
  return { openCount: open.length, top, sev }
}

const focused = awData.sections.find((s) => s.heading === 'Focused')?.items ?? []
const backburner = awData.sections.find((s) => s.heading === 'Backburner')?.items ?? []
const totalOpen = awData.tasks.filter((t) => t.status === 'open').length
const totalInitiatives = awData.sections.reduce((n, s) => n + s.items.length, 0)
const withTasks = new Set(awData.tasks.map((t) => t.slug)).size

function SeverityBar({ sev }: { sev: Record<TaskSeverity, number> }) {
  const order: TaskSeverity[] = ['critical', 'high', 'medium', 'low']
  const total = order.reduce((n, k) => n + sev[k], 0)
  if (!total) return null
  const bg: Record<TaskSeverity, string> = {
    critical: 'bg-status-error-vivid',
    high: 'bg-status-error',
    medium: 'bg-status-warning',
    low: 'bg-surface-overlay',
  }
  return (
    <View className="h-[5px] flex-row overflow-hidden rounded-full bg-surface-overlay">
      {order.map((k) =>
        sev[k] ? <View key={k} style={{ flexGrow: sev[k] }} className={bg[k]} /> : null
      )}
    </View>
  )
}

function InitiativeCard({ init }: { init: InitiativeSummary }) {
  const meta = STATE_META[init.state]
  const { openCount, top, sev } = rollup(init.slug)
  return (
    <Card
      variant={init.state === 'focused' ? 'accent' : 'outline'}
      accentColor={init.state === 'focused' ? 'var(--color-brand-primary)' : undefined}
      className="w-[326px] gap-[10px] p-[16px]"
    >
      <View className="flex-row items-start justify-between gap-[8px]">
        <View className="flex-1">
          <Typography variant="subtitle2" className="text-[14px] font-bold text-text-primary">
            {init.title}
          </Typography>
          <Typography variant="caption" className="text-[11px] text-text-tertiary">
            {init.slug}
          </Typography>
        </View>
        {init.rank ? (
          <Pill variant="subtle" color="primary" size="xs">
            {`#${init.rank}`}
          </Pill>
        ) : null}
      </View>

      <View className="flex-row items-center gap-[12px]">
        <DotLabel color={meta.dot} label={meta.label} />
        <Typography variant="mono" className="text-[12px] text-text-secondary">
          {openCount} open
        </Typography>
        {init.ship_target ? (
          <Typography variant="caption" className="text-[11px] text-text-tertiary">
            {`ship ${init.ship_target}`}
          </Typography>
        ) : null}
      </View>

      <SeverityBar sev={sev} />

      {top ? (
        <View className="flex-row items-center gap-[7px]">
          <Typography variant="mono" className="text-[10.5px] text-brand-primary">
            {top.id}
          </Typography>
          <Typography
            variant="body2"
            numberOfLines={1}
            className="flex-1 text-[12px] text-text-secondary"
          >
            {top.title}
          </Typography>
        </View>
      ) : (
        <Typography variant="caption" className="text-[11px] text-text-tertiary">
          no open tasks
        </Typography>
      )}
    </Card>
  )
}

function Overview() {
  return (
    <AwShell
      active="overview"
      title="Portfolio"
      subtitle={`${totalInitiatives} initiatives · ${totalOpen} open tasks`}
    >
      {/* KPI row */}
      <View className="flex-row flex-wrap gap-[12px]">
        <Card variant="filled" className="min-w-[150px] flex-1 p-[16px]">
          <Metric value={String(focused.length)} label="Focused" />
        </Card>
        <Card variant="filled" className="min-w-[150px] flex-1 p-[16px]">
          <Metric value={String(totalOpen)} label="Open tasks" />
        </Card>
        <Card variant="filled" className="min-w-[150px] flex-1 p-[16px]">
          <Metric value={String(totalInitiatives)} label="Initiatives" />
        </Card>
        <Card variant="filled" className="min-w-[150px] flex-1 p-[16px]">
          <Metric value={String(withTasks)} label="With open work" />
        </Card>
      </View>

      {/* Focused */}
      <View className="gap-[10px]">
        <Eyebrow>Focused · by rank</Eyebrow>
        <View className="flex-row flex-wrap gap-[12px]">
          {[...focused]
            .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
            .map((i) => (
              <InitiativeCard key={i.slug} init={i} />
            ))}
        </View>
      </View>

      {/* Backburner */}
      <View className="gap-[10px]">
        <Eyebrow>Backburner</Eyebrow>
        <View className="flex-row flex-wrap gap-[12px]">
          {backburner.map((i) => (
            <InitiativeCard key={i.slug} init={i} />
          ))}
        </View>
      </View>
    </AwShell>
  )
}

const meta: Meta<typeof Overview> = {
  title: 'Lab/ActiveWork/Portfolio Overview',
  component: Overview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**T1 · Portfolio overview** (read-only prototype). At-a-glance status across every ' +
          'active-work initiative: KPI tiles + initiatives grouped by state with per-initiative ' +
          'open-task rollups and a severity mix bar. Real active-work data. Composes titan ' +
          'Card / Metric / Pill / Indicator.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Overview>
export const Default: Story = {}
