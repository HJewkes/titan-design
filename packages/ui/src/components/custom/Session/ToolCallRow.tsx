import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Collapse, CollapseButton, CollapseContent } from '../../ui/collapse'
import { DateTime } from '../../ui/date-time'
import { Indicator } from '../../ui/indicator'
import { TipTrigger, Tooltip, useHoverState } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'
import { callDurationText, toolCallLabel } from './conversation-model'
import {
  ERROR_TEXT_LABEL,
  SIDECHAIN_LABEL,
  UNNAMED_TOOL_LABEL,
  toolOutcomeMeta,
  type ToolOutcomeMeta,
} from './session-vocabulary'
import type { TimelineToolCall } from './session-types'
import { ToolBadge } from './ToolBadge'

/** Props for {@link ToolCallRow}. */
export interface ToolCallRowProps {
  /** The call to draw. */
  call: TimelineToolCall
  /** Shows the time stamp in UTC rather than the runtime's zone. */
  isUTC?: boolean
  /** Makes the row a button. The error disclosure stays a separate control beside it. */
  onPress?: (call: TimelineToolCall) => void
  /** Tailwind overrides on the row. */
  className?: string
}

const ROW = 'flex-row flex-wrap items-center gap-inline-md py-stack-sm'

function OutcomeTip({ outcome }: { outcome: ToolOutcomeMeta }) {
  return (
    <Typography variant="caption" color="primary">
      {outcome.label}
    </Typography>
  )
}

/**
 * The dot is the outcome's only mark, so it carries the word. In a pressable row the row is the
 * focus stop (a control cannot nest in a button): the tip opens on the row's focus or the dot's
 * hover, and the row's name already says the outcome. Elsewhere the dot is its own tip trigger,
 * named by the outcome, so a keyboard reaches the word too.
 */
function OutcomeDot({ outcome, rowFocused }: { outcome: ToolOutcomeMeta; rowFocused?: boolean }) {
  const { hovered, hoverProps } = useHoverState()
  const dot = <Indicator size="sm" color={outcome.indicator} pulse={outcome.pulse} />
  if (rowFocused === undefined) {
    return (
      <TipTrigger label={outcome.label} content={<OutcomeTip outcome={outcome} />}>
        {dot}
      </TipTrigger>
    )
  }
  return (
    <Tooltip usePortal isOpen={hovered || rowFocused} content={<OutcomeTip outcome={outcome} />}>
      <View {...hoverProps} role="img" aria-label={outcome.label}>
        {dot}
      </View>
    </Tooltip>
  )
}

interface RowBodyProps {
  call: TimelineToolCall
  isUTC?: boolean
  /** Set only in a pressable row, where the row owns focus. */
  rowFocused?: boolean
}

function RowBody({ call, isUTC, rowFocused }: RowBodyProps) {
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
      <OutcomeDot outcome={toolOutcomeMeta(call.outcome)} rowFocused={rowFocused} />
      <ToolBadge family={call.family} size="sm" className="self-center" />
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
 * One tool call as a line: time, outcome dot (its word on hover and focus), family badge, tool
 * name, what it acted on and the observed duration. A failed call's error text sits behind its own
 * disclosure and renders as literal text. Pending prints no duration.
 */
export function ToolCallRow({ call, isUTC, onPress, className }: ToolCallRowProps) {
  const name = toolCallLabel(call)
  const [focused, setFocused] = useState(false)
  return (
    <View testID="tool-call-row" className={className}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={name}
          onPress={() => onPress(call)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(ROW, 'rounded web:hover:bg-interactive-hover active:bg-interactive-active')}
        >
          <RowBody call={call} isUTC={isUTC} rowFocused={focused} />
        </Pressable>
      ) : (
        <View role="group" aria-label={name} className={ROW}>
          <RowBody call={call} isUTC={isUTC} />
        </View>
      )}
      {call.errorMessage ? <ErrorText call={call} /> : null}
    </View>
  )
}
