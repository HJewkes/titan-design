import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Button, ButtonText } from '../../ui/button'
import { Collapse, CollapseButton, CollapseContent } from '../../ui/collapse'
import { Indicator } from '../../ui/indicator'
import { Pill } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import { summarizeToolCalls, toolSummaryParts, type ToolCallSummary } from './conversation-model'
import { UNNAMED_TOOL_LABEL, moreCallsLabel } from './session-vocabulary'
import type { TimelineToolCall } from './session-types'
import { ToolCallRow } from './ToolCallRow'

const MAX_NAME_PILLS = 5

function SummaryLine({ summary }: { summary: ToolCallSummary }) {
  const [calls, ...rest] = toolSummaryParts(summary)
  const shown = summary.byName.slice(0, MAX_NAME_PILLS)
  return (
    <View className="flex-1 flex-row flex-wrap items-center gap-inline-md">
      <Typography variant="body2">{calls}</Typography>
      {summary.errors > 0 ? (
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Indicator size="sm" color="error" />
        </View>
      ) : null}
      {rest.map((part, i) => (
        <Typography
          key={part}
          variant="caption"
          color={i === 0 && summary.errors > 0 ? 'error' : 'secondary'}
        >
          {part}
        </Typography>
      ))}
      {shown.map((entry) => (
        <Pill key={entry.name} tone="neutral" variant="subtle" size="xs">
          {`${entry.name || UNNAMED_TOOL_LABEL} ${entry.calls}`}
        </Pill>
      ))}
    </View>
  )
}

type ToolGroupProps = {
  isUTC?: boolean
  onToolCallPress?: (call: TimelineToolCall) => void
  calls: TimelineToolCall[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  maxToolRows: number
}

function ToolRows({
  calls,
  isUTC,
  onToolCallPress,
  maxToolRows,
}: Omit<ToolGroupProps, 'isOpen' | 'onOpenChange'>) {
  const pageSize = Math.max(1, Math.floor(maxToolRows))
  const [limit, setLimit] = useState(pageSize)
  const hidden = calls.length - limit
  return (
    <View role="list" className="pl-inset-sm">
      {calls.slice(0, limit).map((call, i) => (
        <View role="listitem" key={`${call.id}-${i}`}>
          <ToolCallRow call={call} isUTC={isUTC} onPress={onToolCallPress} />
        </View>
      ))}
      {hidden > 0 ? (
        <View role="listitem">
          <Button
            variant="link"
            size="sm"
            className="self-start py-stack-sm"
            onPress={() => setLimit(limit + pageSize)}
          >
            <ButtonText>{moreCallsLabel(hidden)}</ButtonText>
          </Button>
        </View>
      ) : null}
    </View>
  )
}

/** A turn's calls as one disclosure: a summary line, then the rows, paged by `maxToolRows`. */
export function ToolGroup({ isOpen, onOpenChange, ...rest }: ToolGroupProps) {
  const summary = useMemo(() => summarizeToolCalls(rest.calls), [rest.calls])
  return (
    <Collapse isOpen={isOpen} onToggle={onOpenChange}>
      <CollapseButton
        accessibilityLabel={`Tool calls: ${toolSummaryParts(summary).join(', ')}`}
        className="px-inset-sm py-stack-sm gap-inline-md"
      >
        <SummaryLine summary={summary} />
      </CollapseButton>
      <CollapseContent>
        <ToolRows {...rest} />
      </CollapseContent>
    </Collapse>
  )
}
