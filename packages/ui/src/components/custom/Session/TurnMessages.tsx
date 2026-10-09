import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Button, ButtonText } from '../../ui/button'
import { Card } from '../../ui/card'
import { Typography } from '../../ui/typography'
import { MarkdownProse, type ProseLinker } from '../Prose'
import { previewText } from './conversation-model'
import {
  LOAD_FULL_TEXT_LABEL,
  SHOW_LESS_LABEL,
  SHOW_MORE_LABEL,
  TEXT_CUT_LABEL,
} from './session-vocabulary'
import type { TimelineMessage, TimelineTurn } from './session-types'

type MessageProps = {
  linkers?: ProseLinker[]
  onRequestFullText?: (message: TimelineMessage) => void
  message: TimelineMessage
  previewChars: number
  isMarkdown: boolean
}

function CutNotice({
  message,
  onRequestFullText,
}: Omit<MessageProps, 'previewChars' | 'isMarkdown' | 'linkers'>) {
  return (
    <View className="flex-row flex-wrap items-center gap-inline-md">
      <Typography variant="caption" color="secondary">
        {TEXT_CUT_LABEL}
      </Typography>
      {onRequestFullText ? (
        <Button variant="link" size="sm" onPress={() => onRequestFullText(message)}>
          <ButtonText>{LOAD_FULL_TEXT_LABEL}</ButtonText>
        </Button>
      ) : null}
    </View>
  )
}

function MessageText({
  message,
  previewChars,
  isMarkdown,
  linkers,
  onRequestFullText,
}: MessageProps) {
  const [isShowingAll, setIsShowingAll] = useState(false)
  const preview = useMemo(
    () => previewText(message.text, previewChars),
    [message.text, previewChars]
  )
  const text = isShowingAll ? message.text : preview.text
  return (
    <View className="gap-stack-xs">
      {isMarkdown ? (
        <MarkdownProse body={text} linkers={linkers} size="md" />
      ) : (
        <Typography variant="body2" className="web:break-words web:whitespace-pre-wrap" selectable>
          {text}
        </Typography>
      )}
      {preview.isCut ? (
        <Button
          variant="link"
          size="sm"
          className="self-start"
          onPress={() => setIsShowingAll(!isShowingAll)}
        >
          <ButtonText>{isShowingAll ? SHOW_LESS_LABEL : SHOW_MORE_LABEL}</ButtonText>
        </Button>
      ) : null}
      {message.truncated ? (
        <CutNotice message={message} onRequestFullText={onRequestFullText} />
      ) : null}
    </View>
  )
}

export type TurnBlockProps = Omit<MessageProps, 'isMarkdown' | 'message'> & { label: string }

/** A prompt sits on one filled plane; injected, channel and compaction openers stay quiet. */
export function Opener({ turn, label, ...rest }: TurnBlockProps & { turn: TimelineTurn }) {
  if (!turn.user) return null
  const body = (
    <View className="gap-stack-xs">
      <Typography variant="monoLabel" color="secondary">
        {label}
      </Typography>
      <MessageText message={turn.user} isMarkdown={false} {...rest} />
    </View>
  )
  return turn.origin === 'prompt' ? (
    <Card variant="filled" className="p-inset-sm">
      {body}
    </Card>
  ) : (
    body
  )
}

export function AssistantMessages({
  messages,
  label,
  ...rest
}: TurnBlockProps & { messages: TimelineMessage[] }) {
  if (messages.length === 0) return null
  return (
    <View className="gap-stack-sm">
      <Typography variant="monoLabel" color="secondary">
        {label}
      </Typography>
      {messages.map((message, i) => (
        <MessageText key={`${message.seq}-${i}`} message={message} isMarkdown {...rest} />
      ))}
    </View>
  )
}
