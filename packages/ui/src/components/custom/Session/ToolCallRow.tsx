import { Pressable, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Collapse, CollapseButton, CollapseContent } from '../../ui/collapse'
import { DateTime } from '../../ui/date-time'
import { Indicator } from '../../ui/indicator'
import { Typography } from '../../ui/typography'
import { callDurationText, toolCallLabel } from './conversation-model'
import {
  ERROR_TEXT_LABEL,
  SIDECHAIN_LABEL,
  UNNAMED_TOOL_LABEL,
  toolOutcomeMeta,
} from './session-vocabulary'
import type { TimelineToolCall } from './session-types'
import { ToolBadge } from './ToolBadge'

export interface ToolCallRowProps {
  call: TimelineToolCall
  isUTC?: boolean
  /** Makes the row a button. The error disclosure stays a separate control beside it. */
  onPress?: (call: TimelineToolCall) => void
  className?: string
}

const ROW = 'flex-row flex-wrap items-center gap-inline-md py-stack-sm'

function RowBody({ call, isUTC }: { call: TimelineToolCall; isUTC?: boolean }) {
  const outcome = toolOutcomeMeta(call.outcome)
  const duration = callDurationText(call)
  const hasTime = call.atMs !== null && Number.isFinite(call.atMs)
  return (
    <>
      {hasTime ? (
        <DateTime
          value={call.atMs}
          format="time"
          seconds
          isUTC={isUTC}
          variant="mono"
          color="secondary"
        />
      ) : null}
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Indicator size="sm" color={outcome.indicator} pulse={outcome.pulse} />
      </View>
      <ToolBadge family={call.family} size="sm" />
      <Typography variant="body2" color={call.name ? 'primary' : 'secondary'}>
        {call.name || UNNAMED_TOOL_LABEL}
      </Typography>
      {call.inputSummary.trim() ? (
        <Typography variant="caption" color="secondary" className="min-w-0 shrink web:break-all">
          {call.inputSummary}
        </Typography>
      ) : null}
      {call.sidechain ? (
        <Typography variant="caption" color="secondary">
          {SIDECHAIN_LABEL}
        </Typography>
      ) : null}
      <Typography variant="caption" color={call.outcome === 'error' ? 'error' : 'secondary'}>
        {outcome.label}
      </Typography>
      {duration === null ? null : (
        <Typography variant="mono" color="secondary">
          {duration}
        </Typography>
      )}
    </>
  )
}

function ErrorText({ call }: { call: TimelineToolCall }) {
  const name = call.name || UNNAMED_TOOL_LABEL
  return (
    <Collapse>
      <CollapseButton
        accessibilityLabel={`${ERROR_TEXT_LABEL}, ${name}`}
        className="self-start px-0 py-stack-sm gap-inline-sm"
      >
        <Typography variant="caption" color="error">
          {ERROR_TEXT_LABEL}
        </Typography>
      </CollapseButton>
      <CollapseContent>
        <Typography variant="mono" color="secondary" className="web:break-all" selectable>
          {call.errorMessage}
        </Typography>
      </CollapseContent>
    </Collapse>
  )
}

/**
 * One tool call as a line: time, outcome dot, family badge, tool name, what it acted on, the
 * outcome in words and the observed duration. A failed call's error text sits behind its own
 * disclosure and renders as literal text. Pending prints no duration.
 */
export function ToolCallRow({ call, isUTC, onPress, className }: ToolCallRowProps) {
  const name = toolCallLabel(call)
  const body = <RowBody call={call} isUTC={isUTC} />
  return (
    <View testID="tool-call-row" className={className}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={name}
          onPress={() => onPress(call)}
          className={cn(ROW, 'rounded web:hover:bg-interactive-hover active:bg-interactive-active')}
        >
          {body}
        </Pressable>
      ) : (
        <View role="group" aria-label={name} className={ROW}>
          {body}
        </View>
      )}
      {call.errorMessage ? <ErrorText call={call} /> : null}
    </View>
  )
}
