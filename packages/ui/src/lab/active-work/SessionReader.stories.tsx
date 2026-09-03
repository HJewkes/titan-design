import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { View, Pressable, Text } from 'react-native'
import { Typography } from '../../components/custom/Typography'
import { Pill } from '../../components/ui/pill'
import { Divider } from '../../components/ui/divider'
import { Card } from '../../components/ui/card'
import { AwShell } from './AwShell'
import { Eyebrow, shortDate, daysAgo } from './shared'
import { awData, type AwSession } from './data/aw-data'

const sessions = awData.focus.sessions

/** ended-started → "1h 4m" / "42m". */
function duration(started: string, ended: string): string {
  const ms = new Date(ended).getTime() - new Date(started).getTime()
  if (!(ms > 0)) return ''
  const mins = Math.round(ms / 60000)
  const h = Math.floor(mins / 60)
  return h ? `${h}h ${mins % 60}m` : `${mins}m`
}

const TASK_REF = /\b[A-Z]{2,}-\d+(?:\.\d+)?\b/g
// Split keeps the captured delimiters: bold, [[wiki]], `code`, TASK-REF, #123.
const INLINE = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\]|`[^`]+`|\b[A-Z]{2,}-\d+(?:\.\d+)?\b|#\d+)/g

/** Auto-linking inline renderer → an array of RN <Text> spans. */
function renderInline(text: string, kp: string): ReactNode[] {
  return text
    .split(INLINE)
    .map((p, i) => {
      if (!p) return null
      const key = `${kp}-${i}`
      if (p.startsWith('**') && p.endsWith('**'))
        return (
          <Text key={key} className="font-semibold text-text-primary">
            {p.slice(2, -2)}
          </Text>
        )
      if (p.startsWith('[[') && p.endsWith(']]'))
        return (
          <Text key={key} className="font-medium text-status-info">
            {p.slice(2, -2)}
          </Text>
        )
      if (p.startsWith('`') && p.endsWith('`'))
        return (
          <Text key={key} className="font-medium text-text-primary">
            {p.slice(1, -1)}
          </Text>
        )
      if (/^[A-Z]{2,}-\d+/.test(p))
        return (
          <Text key={key} className="font-semibold text-brand-primary">
            {p}
          </Text>
        )
      if (/^#\d+$/.test(p))
        return (
          <Text key={key} className="text-text-tertiary">
            {p}
          </Text>
        )
      return <Text key={key}>{p}</Text>
    })
    .filter(Boolean)
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'li' | 'p'
  text: string
}
function parseBlocks(body: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ') })
      para = []
    }
  }
  for (const raw of body.split('\n')) {
    const t = raw.trim()
    if (!t) {
      flush()
      continue
    }
    const h = t.match(/^(#{1,4})\s+(.*)/)
    if (h) {
      flush()
      const lvl = Math.min(3, h[1].length) as 1 | 2 | 3
      blocks.push({ type: `h${lvl}` as Block['type'], text: h[2] })
      continue
    }
    const li = t.match(/^[-*]\s+(.*)/)
    if (li) {
      flush()
      blocks.push({ type: 'li', text: li[1] })
      continue
    }
    para.push(t)
  }
  flush()
  return blocks
}

function BlockView({ block, i }: { block: Block; i: number }) {
  const kp = `b${i}`
  if (block.type === 'h1' || block.type === 'h2')
    return (
      <Typography
        variant={block.type === 'h1' ? 'h5' : 'h6'}
        className="mt-[6px] text-text-primary"
      >
        {block.text}
      </Typography>
    )
  if (block.type === 'h3')
    return (
      <Typography variant="subtitle2" className="mt-[4px] text-[13px] font-bold text-text-primary">
        {renderInline(block.text, kp)}
      </Typography>
    )
  if (block.type === 'li')
    return (
      <View className="flex-row gap-[8px] pl-[4px]">
        <Text className="text-brand-primary">•</Text>
        <Typography
          variant="body2"
          className="flex-1 text-[13px] leading-[20px] text-text-secondary"
        >
          {renderInline(block.text, kp)}
        </Typography>
      </View>
    )
  return (
    <Typography variant="body2" className="text-[13px] leading-[20px] text-text-secondary">
      {renderInline(block.text, kp)}
    </Typography>
  )
}

function SessionRow({
  s,
  active,
  onPress,
}: {
  s: AwSession
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className={cnRow(active)}>
      {active ? (
        <View className="absolute left-0 top-[10px] bottom-[10px] w-[3px] rounded-r-[3px] bg-brand-primary" />
      ) : null}
      <View className="flex-row items-center justify-between">
        <Typography variant="mono" className="text-[12px] font-bold text-text-primary">
          {shortDate(s.ended)}
        </Typography>
        <Pill variant="subtle" color={s.track === 'canonical' ? 'primary' : 'default'} size="xs">
          {s.track}
        </Pill>
      </View>
      <Typography
        variant="body2"
        numberOfLines={2}
        className="text-[12px] leading-[16px] text-text-secondary"
      >
        {s.first_line || '(session)'}
      </Typography>
      <Typography variant="caption" className="text-[10.5px] text-text-tertiary">
        {`${daysAgo(s.ended)}${duration(s.started, s.ended) ? ` · ${duration(s.started, s.ended)}` : ''}`}
      </Typography>
    </Pressable>
  )
}
function cnRow(active: boolean): string {
  return [
    'relative gap-[5px] rounded-[10px] border px-[12px] py-[10px]',
    active ? 'border-border-prominent bg-surface-raised' : 'border-border-subtle bg-surface-base',
  ].join(' ')
}

function SessionReaderView() {
  const [sel, setSel] = useState(0)
  const s = sessions[sel]
  const blocks = s ? parseBlocks(s.body) : []
  const refs = s ? Array.from(new Set(s.body.match(TASK_REF) ?? [])).slice(0, 14) : []

  return (
    <AwShell active="sessions" title="Sessions" subtitle={awData.focus.slug}>
      <View className="flex-row gap-[16px]">
        {/* list */}
        <View className="w-[286px] gap-[8px]">
          <Eyebrow>{`${sessions.length} sessions`}</Eyebrow>
          {sessions.map((sess, i) => (
            <SessionRow key={sess.filename} s={sess} active={i === sel} onPress={() => setSel(i)} />
          ))}
        </View>

        {/* detail */}
        {s ? (
          <Card variant="outline" className="flex-1 gap-[14px] p-[22px]">
            <View className="gap-[6px]">
              <View className="flex-row items-center gap-[10px]">
                <Typography variant="mono" className="text-[13px] text-text-secondary">
                  {shortDate(s.ended)}
                </Typography>
                <Typography variant="caption" className="text-[11px] text-text-tertiary">
                  {daysAgo(s.ended)}
                </Typography>
                {duration(s.started, s.ended) ? (
                  <Typography variant="caption" className="text-[11px] text-text-tertiary">
                    {`· ${duration(s.started, s.ended)}`}
                  </Typography>
                ) : null}
                <Typography variant="mono" className="text-[10.5px] text-text-tertiary">
                  {s.session_id}
                </Typography>
              </View>
              {refs.length ? (
                <View className="flex-row flex-wrap items-center gap-[6px]">
                  <Typography variant="caption" className="text-[10.5px] text-text-tertiary">
                    tasks touched
                  </Typography>
                  {refs.map((r) => (
                    <Pill key={r} variant="subtle" color="primary" size="xs">
                      {r}
                    </Pill>
                  ))}
                </View>
              ) : null}
            </View>

            <Divider />

            <View className="gap-[9px]">
              {blocks.map((b, i) => (
                <BlockView key={i} block={b} i={i} />
              ))}
            </View>
          </Card>
        ) : null}
      </View>
    </AwShell>
  )
}

const meta: Meta<typeof SessionReaderView> = {
  title: 'Lab/ActiveWork/Session Reader',
  component: SessionReaderView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**M1 · Session reader** (read-only prototype, brain’s session viewer ported). A two-pane ' +
          'reader over real active-work sessions: a selectable session list + a detail pane that ' +
          'renders the session markdown with **auto-linked references** — task refs like `AW-17` ' +
          '(brand) and `[[name]]` memory links (info) — plus a “tasks touched” strip. Composes titan ' +
          'Card / Pill / Divider / Typography.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SessionReaderView>
export const Default: Story = {}
