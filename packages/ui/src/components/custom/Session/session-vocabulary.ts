import type { IndicatorColor } from '../../ui/indicator'
import type {
  TimelineToolOutcome,
  TimelineTurn,
  TimelineTurnOrigin,
  ToolFamily,
} from './session-types'

/**
 * The one owner of the Session family's words and marks. Every label a session component prints
 * for a tool family, a tool outcome or a turn opener comes from here, so a wording change happens
 * once. Colour is never the only carrier: every mark has a label.
 */

export interface ToolFamilyMeta {
  /** Names the family for a reader and for assistive tech. */
  label: string
  /** One monospaced character, decorative; the label is what carries meaning. */
  glyph: string
}

export const TOOL_FAMILY_META: Record<ToolFamily, ToolFamilyMeta> = {
  fs_read: { label: 'Read files', glyph: 'R' },
  fs_write: { label: 'Write files', glyph: 'W' },
  bash: { label: 'Shell', glyph: '$' },
  subagent: { label: 'Subagent', glyph: 'A' },
  web: { label: 'Web', glyph: '@' },
  mcp_agentchat: { label: 'Agent chat', glyph: 'C' },
  mcp_other: { label: 'MCP', glyph: 'M' },
  ask_user: { label: 'Ask user', glyph: '?' },
  scheduling: { label: 'Scheduling', glyph: 'S' },
  skill_toolsearch: { label: 'Skills', glyph: 'K' },
  other_tool: { label: 'Other tool', glyph: '*' },
  none: { label: 'No tool', glyph: '-' },
}

/** The families in the order a legend or a picker lists them. */
export const TOOL_FAMILY_ORDER = Object.keys(TOOL_FAMILY_META) as ToolFamily[]

function isToolFamily(family: string): family is ToolFamily {
  return Object.prototype.hasOwnProperty.call(TOOL_FAMILY_META, family)
}

/** A family from a newer read model than this copy falls back to `other_tool`, never a blank badge. */
export function toolFamilyMeta(family: string): ToolFamilyMeta {
  return TOOL_FAMILY_META[isToolFamily(family) ? family : 'other_tool']
}

export interface ToolOutcomeMeta {
  /** Reads mid-sentence in a row's accessible name: "Read, src/a.ts, succeeded, 1.2 s". */
  label: string
  indicator: IndicatorColor
  pulse: boolean
}

/** `unknown` and `pending` are not successes, so they take the neutral mark. */
export const TOOL_OUTCOME_META: Record<TimelineToolOutcome, ToolOutcomeMeta> = {
  success: { label: 'succeeded', indicator: 'success', pulse: false },
  error: { label: 'failed', indicator: 'error', pulse: false },
  unknown: { label: 'no result status', indicator: 'default', pulse: false },
  pending: { label: 'pending', indicator: 'default', pulse: true },
}

/** An outcome this copy does not know reads as `unknown`, which claims nothing. */
export function toolOutcomeMeta(outcome: string): ToolOutcomeMeta {
  return Object.prototype.hasOwnProperty.call(TOOL_OUTCOME_META, outcome)
    ? TOOL_OUTCOME_META[outcome as TimelineToolOutcome]
    : TOOL_OUTCOME_META.unknown
}

export interface TurnOriginMeta {
  label: string
}

/** Only `prompt` is a person or agent speaking; the other openers never read "User". */
export const TURN_ORIGIN_META: Record<TimelineTurnOrigin, TurnOriginMeta> = {
  prompt: { label: 'User' },
  injected: { label: 'Injected' },
  compaction: { label: 'Compaction summary' },
  none: { label: 'No opener' },
}

/** The injected-marker name session-read gives a message that arrived over a channel. */
export const CHANNEL_MARKER = 'channel'

/** An injected opener whose marker is {@link CHANNEL_MARKER}: a message from another session. */
export const CHANNEL_OPENER_META: TurnOriginMeta = { label: 'Channel' }

/** The opener label for a turn: `Channel` for a channel message, else its origin's label. */
export function turnOriginMeta(
  turn: Pick<TimelineTurn, 'origin' | 'injectedMarker'>
): TurnOriginMeta {
  if (turn.origin === 'injected' && turn.injectedMarker === CHANNEL_MARKER) {
    return CHANNEL_OPENER_META
  }
  return TURN_ORIGIN_META[turn.origin] ?? TURN_ORIGIN_META.none
}
