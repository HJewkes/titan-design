import { View } from 'react-native'
import type { Participant } from '@titan-design/chat-protocol'
import { cn } from '../../../utils/cn'
import { Avatar } from '../../ui/avatar'
import { Typography } from '../../ui/typography'

export interface ConversationIdentityProps {
  /** The other party of a direct thread. */
  participant: Participant
  /** A line under the name, such as what the thread is for. */
  description?: string
  className?: string
}

/**
 * Who a direct thread is with, shown once at the top instead of on every message,
 * the way Messages heads a conversation. Composes Avatar and Typography.
 */
export function ConversationIdentity({
  participant,
  description,
  className,
}: ConversationIdentityProps) {
  return (
    <View
      className={cn('items-center gap-stack-sm py-inset-md', className)}
      testID="chat-conversation-identity"
    >
      <Avatar size="lg" colorFromName={participant.displayName} alt={participant.displayName} />
      <Typography variant="subtitle1">{participant.displayName}</Typography>
      {description ? (
        <Typography variant="caption" color="tertiary">
          {description}
        </Typography>
      ) : null}
    </View>
  )
}
