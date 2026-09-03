import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View, Pressable } from 'react-native'
import { Typography } from '../../components/custom/Typography'
import { Card } from '../../components/ui/card'
import { Pill } from '../../components/ui/pill'
import { Divider } from '../../components/ui/divider'
import { Indicator } from '../../components/ui/indicator'
import { AwShell } from './AwShell'
import { Eyebrow, compact, signedCompact, shortDate } from './shared'
import { sessionSignals } from './data/session-signals'

// Light view types decoupled from the giant `as const` literal (keeps tsc fast).
type Loc = readonly [number, number, number]
interface FileRec {
  path: string
  reads: number
  writes: number
  edits: number
  touches: number
  sessions: readonly string[]
  branches: readonly string[]
  netGrowth: number
  firstTouched: string | null
  lastTouched: string | null
  coChange: readonly { path: string; count: number }[]
  touchLocs: readonly { session: string; ts: string | null; tool: string; loc: Loc }[]
}
interface SessionRec {
  id: string
  aiTitle: string | null
  lastTs: string | null
  turns: number
  prs: readonly number[]
}
interface PrRec {
  number: number
  branch: string | null
  merged: boolean
  sessions: readonly string[]
}

const S = sessionSignals as unknown as {
  repo: string
  transcripts: readonly string[]
  generatedFrom: { sessions: number; events: number }
  files: readonly FileRec[]
  sessions: readonly SessionRec[]
  prs: readonly PrRec[]
}

const sessionById = new Map(S.sessions.map((s) => [s.id, s]))
const transcriptName = (ti: number) => (S.transcripts[ti] ?? '').split('/').pop() ?? '?'
const shortId = (id: string) => id.slice(0, 8)

/** file → the PRs whose branch it rode (or that shipped in a session it touched). */
function ridingPrs(f: FileRec): PrRec[] {
  const fileSessions = new Set(f.sessions)
  const branchSet = new Set(f.branches)
  return S.prs
    .filter(
      (p) =>
        (p.branch && branchSet.has(p.branch)) || p.sessions.some((sid) => fileSessions.has(sid))
    )
    .slice(0, 8)
}

function rwe(f: { reads: number; writes: number; edits: number }) {
  return (
    <View className="flex-row items-center gap-[8px]">
      <Typography
        variant="mono"
        className="text-[11px] text-text-tertiary"
      >{`${f.reads}r`}</Typography>
      <Typography
        variant="mono"
        className="text-[11px] text-brand-primary"
      >{`${f.writes}w`}</Typography>
      <Typography
        variant="mono"
        className="text-[11px] text-status-info"
      >{`${f.edits}e`}</Typography>
    </View>
  )
}

function FileRow({ f, active, onPress }: { f: FileRec; active: boolean; onPress: () => void }) {
  const parts = f.path.split('/')
  const name = parts.pop()
  const dir = parts.join('/')
  return (
    <Pressable
      onPress={onPress}
      className={`relative rounded-[8px] px-[12px] py-[9px] ${active ? 'bg-surface-raised' : ''}`}
    >
      {active ? (
        <View className="absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-r-[3px] bg-brand-primary" />
      ) : null}
      <View className="flex-row items-baseline justify-between gap-[8px]">
        <Typography
          variant="mono"
          numberOfLines={1}
          className="flex-1 text-[12px] text-text-secondary"
        >
          {dir ? (
            <Typography variant="mono" className="text-[12px] text-text-tertiary">
              {dir + '/'}
            </Typography>
          ) : null}
          <Typography variant="mono" className="text-[12px] text-text-primary">
            {name}
          </Typography>
        </Typography>
        <Typography variant="mono" className="text-[12px] text-text-primary">
          {f.touches}
        </Typography>
      </View>
      <View className="mt-[3px] flex-row items-center justify-between">
        {rwe(f)}
        <Typography
          variant="caption"
          className="text-[10px] text-text-tertiary"
        >{`${f.sessions.length} sessions`}</Typography>
      </View>
    </Pressable>
  )
}

function StatTile({
  label,
  value,
  color = 'text-text-primary',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <Card variant="filled" className="min-w-[92px] flex-1 gap-[3px] px-[12px] py-[10px]">
      <Eyebrow>{label}</Eyebrow>
      <Typography variant="mono" className={`text-[19px] font-bold ${color}`}>
        {value}
      </Typography>
    </Card>
  )
}

/** One session in the file's biography: dot + connector, title, date, jump-to-log. */
function BiographyRow({ sid, f, last }: { sid: string; f: FileRec; last: boolean }) {
  const s = sessionById.get(sid)
  const t = f.touchLocs.find((x) => x.session === sid)
  const mutated = t ? t.tool !== 'Read' : false
  return (
    <View className="flex-row gap-[12px]">
      <View className="items-center">
        <Indicator size="sm" color={mutated ? 'primary' : t ? 'info' : 'default'} />
        {!last ? <View className="mt-[2px] w-[1px] flex-1 bg-border-subtle" /> : null}
      </View>
      <View className="flex-1 pb-[14px]">
        <View className="flex-row items-baseline justify-between gap-[8px]">
          <Typography
            variant="body2"
            numberOfLines={1}
            className="flex-1 text-[13px] text-text-primary"
          >
            {s?.aiTitle ?? shortId(sid)}
          </Typography>
          <Typography variant="caption" className="text-[11px] text-text-tertiary">
            {shortDate(s?.lastTs)}
          </Typography>
        </View>
        <View className="mt-[3px] flex-row items-center gap-[8px]">
          <Typography variant="mono" className="text-[10px] text-text-tertiary">
            {shortId(sid)}
          </Typography>
          {t ? (
            <Typography
              variant="mono"
              className={`text-[10px] ${mutated ? 'text-brand-primary' : 'text-status-info'}`}
            >
              {mutated ? 'wrote' : 'read'}
            </Typography>
          ) : null}
          {s?.turns ? (
            <Typography
              variant="caption"
              className="text-[10px] text-text-tertiary"
            >{`${s.turns} turns`}</Typography>
          ) : null}
          {t ? (
            <Pill variant="subtle" color="info" size="xs">
              {`→ ${transcriptName(t.loc[0])} @ b${compact(t.loc[1])}`}
            </Pill>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function FileBiography() {
  const files = S.files
  const [idx, setIdx] = useState(0)
  const f = files[idx]!
  const bioSessions = [...f.sessions]
    .map((id) => ({ id, s: sessionById.get(id) }))
    .sort((a, b) => String(b.s?.lastTs).localeCompare(String(a.s?.lastTs)))
  const shown = bioSessions.slice(0, 14)
  const prs = ridingPrs(f)
  const locCount = f.touchLocs.length

  return (
    <AwShell
      active="files"
      title="File biography"
      subtitle={`${S.repo} · ${files.length} files · ${S.generatedFrom.sessions} sessions mined`}
    >
      <View className="flex-row gap-[16px]">
        {/* ranked file list */}
        <Card variant="outline" className="w-[380px] gap-[2px] p-[8px]">
          <Eyebrow className="px-[12px] pb-[4px] pt-[4px]">Files · by activity</Eyebrow>
          {files.slice(0, 40).map((file, i) => (
            <FileRow key={file.path} f={file} active={i === idx} onPress={() => setIdx(i)} />
          ))}
        </Card>

        {/* biography detail */}
        <View className="flex-1 gap-[14px]">
          <View className="gap-[3px]">
            <Typography variant="mono" className="text-[15px] font-bold text-text-primary">
              {f.path}
            </Typography>
            <Eyebrow>
              {`${f.touches} touches · ${f.sessions.length} sessions · ${shortDate(f.firstTouched)} → ${shortDate(f.lastTouched)}`}
            </Eyebrow>
          </View>

          <View className="flex-row flex-wrap gap-[10px]">
            <StatTile label="Reads" value={String(f.reads)} color="text-text-secondary" />
            <StatTile label="Writes" value={String(f.writes)} color="text-brand-primary" />
            <StatTile label="Edits" value={String(f.edits)} color="text-status-info" />
            <StatTile
              label="Net growth"
              value={signedCompact(f.netGrowth) + ' ch'}
              color={f.netGrowth >= 0 ? 'text-brand-primary' : 'text-status-error'}
            />
            <StatTile
              label="Sessions"
              value={String(f.sessions.length)}
              color="text-text-primary"
            />
          </View>

          {/* branches + PRs it rode */}
          {(f.branches.length > 0 || prs.length > 0) && (
            <View className="gap-[8px]">
              {f.branches.length > 0 && (
                <View className="flex-row items-center gap-[8px]">
                  <Eyebrow>Branches</Eyebrow>
                  <View className="flex-1 flex-row flex-wrap gap-[6px]">
                    {f.branches.map((b) => (
                      <Pill key={b} variant="outline" color="default" size="xs">
                        {b}
                      </Pill>
                    ))}
                  </View>
                </View>
              )}
              {prs.length > 0 && (
                <View className="flex-row items-center gap-[8px]">
                  <Eyebrow>Rode PRs</Eyebrow>
                  <View className="flex-1 flex-row flex-wrap gap-[6px]">
                    {prs.map((p) => (
                      <Pill
                        key={p.number}
                        variant="subtle"
                        color={p.merged ? 'success' : 'primary'}
                        size="xs"
                      >
                        {`#${p.number}`}
                      </Pill>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* co-change */}
          {f.coChange.length > 0 && (
            <Card variant="outline" className="gap-[7px] p-[14px]">
              <Eyebrow>Changes together with</Eyebrow>
              {f.coChange.map((c) => (
                <View key={c.path} className="flex-row items-center justify-between gap-[8px]">
                  <Typography
                    variant="mono"
                    numberOfLines={1}
                    className="flex-1 text-[12px] text-text-secondary"
                  >
                    {c.path}
                  </Typography>
                  <Pill variant="subtle" color="primary" size="xs">{`${c.count}×`}</Pill>
                </View>
              ))}
            </Card>
          )}

          {/* the biography: sessions that shaped this file */}
          <Card variant="outline" className="gap-[2px] p-[16px]">
            <View className="flex-row items-center justify-between">
              <Eyebrow>Session biography</Eyebrow>
              <Typography variant="caption" className="text-[10px] text-text-tertiary">
                {`${locCount} of ${f.sessions.length} carry a jump-to-log locator`}
              </Typography>
            </View>
            <Divider className="my-[8px]" />
            {shown.map((b, i) => (
              <BiographyRow key={b.id} sid={b.id} f={f} last={i === shown.length - 1} />
            ))}
            {f.sessions.length > shown.length ? (
              <Typography variant="caption" className="pl-[24px] text-[11px] text-text-tertiary">
                {`+ ${f.sessions.length - shown.length} earlier sessions`}
              </Typography>
            ) : null}
          </Card>
        </View>
      </View>
    </AwShell>
  )
}

const meta: Meta<typeof FileBiography> = {
  title: 'Lab/ActiveWork/File Biography',
  component: FileBiography,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**File Biography** (read-only prototype). A file’s full cross-session life, mined ' +
          'deterministically from Claude Code transcripts: reads/writes/edits, net growth, the ' +
          'branches + PRs it rode, co-change, and a session-by-session timeline where each entry ' +
          'carries a **jump-to-raw-log locator** `[transcript, byteOffset]` — seek+read one line ' +
          'for the full turn. Real codewatch data.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FileBiography>
export const Default: Story = {}
