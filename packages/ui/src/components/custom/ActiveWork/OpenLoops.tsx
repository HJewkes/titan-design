// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Divider } from '../../ui/divider'
import { Pill, type PillColor } from '../../ui/pill'
import { Typography } from '../Typography'
import { MarkdownProse, type ProseLinker } from '../Prose'
import { Eyebrow } from './Eyebrow'
import { formatTaskAge } from './format-time'

// RN's Role union omits 'list'/'listitem'; RNW passes them through to the DOM.
const LIST_ROLE = 'list' as ViewProps['role']
const LISTITEM_ROLE = 'listitem' as ViewProps['role']

/** What a loop is about, so the reader can colour and label its kind. */
export type OpenLoopKind = 'task' | 'pr' | 'prose'

/** One hanging thread from the session ledger, as the reader consumes it. */
export interface OpenLoop {
  /** Stable `<session-file-stem>#<id>` reference. */
  ref: string
  kind: OpenLoopKind
  /** The loop text, auto-linked like any prose. */
  text: string
  /** The task this loop tracks, when kind is `task`. */
  targetRef?: string
  /** ISO time the loop was opened; drives the age label. */
  openedAt?: string
  /** The session file that opened it. */
  sessionFile?: string
}

const KIND_META: Record<OpenLoopKind, { label: string; color: PillColor }> = {
  task: { label: 'task', color: 'primary' },
  pr: { label: 'PR', color: 'info' },
  prose: { label: 'note', color: 'default' },
}

export interface OpenLoopsProps {
  loops: OpenLoop[]
  /** Reference instant for the age labels, injected so renders are deterministic. */
  now: number
  /** Reference patterns to auto-link in each loop's text. */
  linkers?: ProseLinker[]
  /** Heading over the list. Defaults to the loop count. */
  label?: string
  /** Rendered when there are no open loops. */
  emptyLabel?: string
  className?: string
}

function LoopRow({ loop, now, linkers }: { loop: OpenLoop; now: number; linkers: ProseLinker[] }) {
  const meta = KIND_META[loop.kind]
  return (
    <View className="gap-1 py-2" role={LISTITEM_ROLE} testID="open-loop">
      <View className="flex-row items-center gap-2">
        <Pill variant="subtle" color={meta.color} size="xs">
          {loop.targetRef ?? meta.label}
        </Pill>
        {loop.openedAt ? (
          <Typography variant="caption" className="leading-none text-text-tertiary">
            {formatTaskAge(loop.openedAt, now)}
          </Typography>
        ) : null}
      </View>
      <MarkdownProse body={loop.text} linkers={linkers} />
    </View>
  )
}

/**
 * OpenLoops — the initiative's hanging threads from the session ledger: each
 * loop's kind, age and auto-linked text. This is the durable "current state"
 * a session picks up, in place of a hand-maintained handoff document.
 *
 * Composes {@link Eyebrow}, {@link Pill}, {@link Divider} and
 * {@link MarkdownProse}. Used by the initiative reader.
 */
export function OpenLoops({
  loops,
  now,
  linkers = [],
  label,
  emptyLabel = 'No open loops',
  className,
}: OpenLoopsProps) {
  const heading = label ?? `${loops.length} open ${loops.length === 1 ? 'loop' : 'loops'}`
  return (
    <View className={cn('gap-1', className)}>
      <Eyebrow>{heading}</Eyebrow>
      {loops.length === 0 ? (
        <Typography variant="body2" className="py-2 text-text-tertiary">
          {emptyLabel}
        </Typography>
      ) : (
        <View role={LIST_ROLE} aria-label={heading}>
          {loops.map((loop, i) => (
            <View key={loop.ref}>
              {i > 0 ? <Divider /> : null}
              <LoopRow loop={loop} now={now} linkers={linkers} />
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
