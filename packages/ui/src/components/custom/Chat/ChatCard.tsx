import type { ReactNode } from 'react'
import { Button, ButtonText } from '../../ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/card'
import { Typography } from '../../ui/typography'
import { cn } from '../../../utils/cn'

export interface ChatCardAction {
  key: string
  label: string
  onPress?: () => void
  /** The first action is the primary one by default; set this to demote or promote any. */
  variant?: 'solid' | 'ghost'
}

export interface ChatCardProps {
  /** A state or category line above the title, such as a status pill. */
  status?: ReactNode
  title: string
  /** One line under the title: a date, an amount, who it concerns. */
  subtitle?: ReactNode
  /** The card's content. Keep it to a short list or a few lines. */
  children?: ReactNode
  /** Small print under the content. */
  footnote?: string
  /** Up to three actions, laid out in a row. The first is solid, the rest ghost. */
  actions?: readonly ChatCardAction[]
  className?: string
}

const MAX_ACTIONS = 3

function ActionRow({ actions }: { actions: readonly ChatCardAction[] }) {
  return (
    <CardFooter>
      {actions.slice(0, MAX_ACTIONS).map((action, index) => (
        <Button
          key={action.key}
          size="sm"
          variant={action.variant ?? (index === 0 ? 'solid' : 'ghost')}
          onPress={action.onPress}
        >
          <ButtonText>{action.label}</ButtonText>
        </Button>
      ))}
    </CardFooter>
  )
}

/**
 * A structured card a message carries in a `data-*` part: a status line, a title, a
 * subtitle, a body, small print and up to three actions. The anatomy is fixed and the
 * content is the caller's, so an app builds its own lockup (a check-in, a plan change)
 * as an instance. Composes Card, Button and Typography.
 */
export function ChatCard({
  status,
  title,
  subtitle,
  children,
  footnote,
  actions = [],
  className,
}: ChatCardProps) {
  return (
    <Card elevation={2} className={cn('w-72 max-w-full', className)} testID="chat-card">
      <CardHeader className="gap-stack-sm pb-inset-sm">
        {status}
        <CardTitle>{title}</CardTitle>
        {typeof subtitle === 'string' ? (
          <Typography variant="body2" color="secondary">
            {subtitle}
          </Typography>
        ) : (
          subtitle
        )}
      </CardHeader>
      {children || footnote ? (
        <CardContent className="gap-stack-sm py-inset-sm">
          {children}
          {footnote ? (
            <Typography variant="caption" color="secondary">
              {footnote}
            </Typography>
          ) : null}
        </CardContent>
      ) : null}
      {actions.length > 0 ? <ActionRow actions={actions} /> : null}
    </Card>
  )
}
