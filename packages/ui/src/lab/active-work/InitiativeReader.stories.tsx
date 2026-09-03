import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { Typography } from '../../components/custom/Typography'
import { Card } from '../../components/ui/card'
import { Pill } from '../../components/ui/pill'
import { Divider } from '../../components/ui/divider'
import { AwShell } from './AwShell'
import { DotLabel, Eyebrow, STATE_META, SEVERITY_META, shortDate, daysAgo } from './shared'
import { awData } from './data/aw-data'

const { brief, handoffBody, sessions, slug } = awData.focus
const openTasks = awData.tasks
  .filter((t) => t.slug === slug && t.status === 'open')
  .sort((a, b) => a.priority - b.priority)

/* --- tiny inline renderer: **bold**, [[wiki]] links, TASK-123 refs --- */
const INLINE = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\]|[A-Z]{2,}-\d+)/g

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text.split(INLINE).map((tok, i) => {
    const key = `${keyBase}-${i}`
    if (!tok) return null
    if (tok.startsWith('**') && tok.endsWith('**'))
      return (
        <Text key={key} className="font-bold text-text-primary">
          {tok.slice(2, -2)}
        </Text>
      )
    if (tok.startsWith('[[') && tok.endsWith(']]'))
      return (
        <Text key={key} className="text-status-info">
          {tok.slice(2, -2)}
        </Text>
      )
    if (/^[A-Z]{2,}-\d+$/.test(tok))
      return (
        <Text key={key} className="font-medium text-brand-primary">
          {tok}
        </Text>
      )
    return <Text key={key}>{tok}</Text>
  })
}

/** Minimal markdown → titan Typography (headings / bullets / paragraphs). */
function Markdown({ source }: { source: string }) {
  const lines = source.split('\n')
  const out: ReactNode[] = []
  lines.forEach((line, i) => {
    const key = `md-${i}`
    if (!line.trim()) return
    if (line.startsWith('### '))
      out.push(
        <Typography
          key={key}
          variant="subtitle2"
          className="mt-[8px] text-[13px] font-bold text-text-primary"
        >
          {renderInline(line.slice(4), key)}
        </Typography>
      )
    else if (line.startsWith('## '))
      out.push(
        <Typography
          key={key}
          variant="subtitle1"
          className="mt-[10px] text-[14.5px] font-bold text-text-primary"
        >
          {renderInline(line.slice(3), key)}
        </Typography>
      )
    else if (line.startsWith('# '))
      out.push(
        <Typography
          key={key}
          variant="h6"
          className="mt-[10px] text-[16px] font-bold text-text-primary"
        >
          {renderInline(line.slice(2), key)}
        </Typography>
      )
    else if (/^\s*[-*]\s+/.test(line))
      out.push(
        <View key={key} className="flex-row gap-[8px] pl-[6px]">
          <Text className="text-text-tertiary">•</Text>
          <Typography
            variant="body2"
            className="flex-1 text-[12.5px] leading-[19px] text-text-secondary"
          >
            {renderInline(line.replace(/^\s*[-*]\s+/, ''), key)}
          </Typography>
        </View>
      )
    else
      out.push(
        <Typography
          key={key}
          variant="body2"
          className="text-[12.5px] leading-[19px] text-text-secondary"
        >
          {renderInline(line, key)}
        </Typography>
      )
  })
  return <View className="gap-[5px]">{out}</View>
}

function MetaHeader() {
  if (!brief) return null
  const meta = STATE_META[brief.state]
  return (
    <View className="flex-row items-center gap-[12px]">
      <DotLabel color={meta.dot} label={meta.label} />
      {brief.rank ? (
        <Pill variant="subtle" color="primary" size="xs">
          {`#${brief.rank}`}
        </Pill>
      ) : null}
      {brief.ship_target ? (
        <Typography variant="caption" className="text-[11px] text-text-tertiary">
          {`ship ${brief.ship_target}`}
        </Typography>
      ) : null}
      <Typography variant="caption" className="text-[11px] text-text-tertiary">
        {`updated ${shortDate(brief.updated)}`}
      </Typography>
    </View>
  )
}

function TaskRow({ task }: { task: (typeof openTasks)[number] }) {
  return (
    <View className="flex-row items-center gap-[10px] py-[5px]">
      <Typography variant="mono" className="w-[52px] text-[11px] text-brand-primary">
        {task.id}
      </Typography>
      <Typography
        variant="body2"
        numberOfLines={1}
        className="flex-1 text-[12.5px] text-text-secondary"
      >
        {task.title}
      </Typography>
      {task.severity ? (
        <DotLabel
          color={SEVERITY_META[task.severity].dot}
          label={SEVERITY_META[task.severity].label}
        />
      ) : null}
      <Typography variant="mono" className="w-[26px] text-right text-[11px] text-text-tertiary">
        {`p${task.priority}`}
      </Typography>
    </View>
  )
}

function SessionRow({ session }: { session: (typeof sessions)[number] }) {
  return (
    <View className="gap-[3px] py-[7px]">
      <View className="flex-row items-center justify-between gap-[8px]">
        <Typography variant="mono" className="text-[11px] text-text-secondary">
          {shortDate(session.ended)}
        </Typography>
        <View className="flex-row items-center gap-[7px]">
          <Typography variant="caption" className="text-[10.5px] text-text-tertiary">
            {daysAgo(session.ended)}
          </Typography>
          <Pill variant="subtle" color="default" size="xs">
            {session.track}
          </Pill>
        </View>
      </View>
      <Typography
        variant="body2"
        numberOfLines={2}
        className="text-[12px] leading-[17px] text-text-secondary"
      >
        {session.first_line.replace(/^#\s*/, '')}
      </Typography>
    </View>
  )
}

function InitiativeReader() {
  return (
    <AwShell
      active="initiative"
      title={brief?.title ?? slug}
      subtitle={slug}
      headerRight={<MetaHeader />}
    >
      <Card variant="outline" className="gap-[10px] p-[18px]">
        <Eyebrow>Handoff</Eyebrow>
        <Markdown source={handoffBody} />
      </Card>

      <View className="flex-row flex-wrap gap-[16px]">
        <Card variant="outline" className="min-w-[360px] flex-1 gap-[6px] p-[16px]">
          <Eyebrow className="mb-[4px]">{`Open tasks · by priority (${openTasks.length})`}</Eyebrow>
          {openTasks.map((t, i) => (
            <View key={t.id}>
              {i > 0 ? <Divider /> : null}
              <TaskRow task={t} />
            </View>
          ))}
        </Card>

        <Card variant="outline" className="min-w-[360px] flex-1 gap-[4px] p-[16px]">
          <Eyebrow className="mb-[4px]">{`Recent sessions (${sessions.length})`}</Eyebrow>
          {sessions.map((s, i) => (
            <View key={s.filename}>
              {i > 0 ? <Divider /> : null}
              <SessionRow session={s} />
            </View>
          ))}
        </Card>
      </View>
    </AwShell>
  )
}

const meta: Meta<typeof InitiativeReader> = {
  title: 'Lab/ActiveWork/Initiative Reader',
  component: InitiativeReader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**M2 · Initiative reader** (read-only prototype). A single initiative’s durable state: ' +
          'meta header (state / rank / ship target), the handoff prose rendered from markdown with ' +
          'auto-linked task refs (AW-13) and [[wiki]] links, and side-by-side open tasks + recent ' +
          'sessions. Real active-work data. Composes titan Card / Pill / Divider / Typography.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof InitiativeReader>
export const Default: Story = {}
