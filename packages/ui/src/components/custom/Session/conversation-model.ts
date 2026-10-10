import { formatDurationMs } from '../../../utils/time-format'
import { SIDECHAIN_LABEL, UNNAMED_TOOL_LABEL, toolOutcomeMeta } from './session-vocabulary'
import type { TimelineToolCall } from './session-types'

type CallSpan = Pick<TimelineToolCall, 'outcome' | 'durationMs'>

/**
 * The span a row prints, or null when there is none to state: pending, or unreported. A
 * non-finite or negative span prints the placeholder, never "NaN".
 */
export function callDurationText(call: CallSpan): string | null {
  if (call.outcome === 'pending' || call.durationMs === null) return null
  return formatDurationMs(call.durationMs)
}

function spokenDuration(call: CallSpan): string | null {
  const ms = call.durationMs
  const isStated = ms !== null && Number.isFinite(ms) && ms >= 0
  return call.outcome !== 'pending' && isStated ? formatDurationMs(ms) : null
}

/** A row's accessible name: "Read, src/orchard/tree-ledger.ts, succeeded, 1.2 s". */
export function toolCallLabel(call: TimelineToolCall): string {
  return [
    call.name || UNNAMED_TOOL_LABEL,
    call.inputSummary.trim(),
    toolOutcomeMeta(call.outcome).label,
    spokenDuration(call),
    call.sidechain ? SIDECHAIN_LABEL : null,
  ]
    .filter(Boolean)
    .join(', ')
}
