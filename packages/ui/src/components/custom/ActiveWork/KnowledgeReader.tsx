// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { formatBytes } from '../../../utils/number-format'
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert'
import { Card } from '../../ui/card'
import { Divider } from '../../ui/divider'
import { EmptyState } from '../../ui/empty-state'
import { Skeleton } from '../../ui/skeleton'
import { Typography } from '../../ui/typography'
import { MarkdownProse, type ProseLinker } from '../Prose'
import { knowledgeBodyFormat, type KnowledgeDocument } from './knowledge-document'
import { KnowledgeReaderMeta, type KnowledgeMetaLayout } from './KnowledgeReaderMeta'
import { sessionLinkers, type SessionLinkHandlers } from './session-linkers'
import { stripLeadingHeading } from './SessionDetail'

export type { KnowledgeMetaLayout }

/** Props for {@link KnowledgeReader}. */
export interface KnowledgeReaderProps extends SessionLinkHandlers {
  /** The open note or source. Absent: nothing is selected. */
  document?: KnowledgeDocument
  /** Reference time. Accepted so the reader takes the same props as the list; dates read as written. */
  now: number
  /** Skeleton lines under a skeleton title, inside the card. */
  isLoading?: boolean
  /** Makes the initiative name a link, for the way back to the initiative. */
  onPressInitiative?: (initiative: string) => void
  /** Makes each tag a button, to filter the list by it. */
  onPressTag?: (tag: string) => void
  /** Header actions, right of the title. */
  actions?: ReactNode
  /**
   * `inline` (default): initiative, record and kind share the eyebrow line, then date and tags.
   * `split`: record and kind sit at the right edge of the eyebrow, and the date at the right of the tags.
   */
  metaLayout?: KnowledgeMetaLayout
  /** Replaces the default "nothing selected" state. */
  emptyState?: ReactNode
  /** Tailwind overrides for the card. */
  className?: string
}

function TruncatedNotice({ bytes }: { bytes?: number }) {
  return (
    <Alert status="info" testID="knowledge-truncated">
      <AlertTitle>Only the start of this file is shown</AlertTitle>
      <AlertDescription>
        {bytes === undefined
          ? 'The file is larger than the read limit.'
          : `The file is ${formatBytes(bytes)}, which is larger than the read limit.`}
      </AlertDescription>
    </Alert>
  )
}

/**
 * The family's linkers, all in the link tone. The brand tone (orange) and the muted tone
 * (text-tertiary) miss AA on the reader card's surface in one theme or both.
 */
function readerLinkers(handlers: SessionLinkHandlers): ProseLinker[] {
  return sessionLinkers(handlers).map((linker) => ({ ...linker, tone: 'link' }))
}

function ReaderBody({
  document,
  handlers,
}: {
  document: KnowledgeDocument
  handlers: SessionLinkHandlers
}) {
  const { item, body } = document
  const format = knowledgeBodyFormat(item.path)
  const { onPressTask, onPressLink, onPressPr } = handlers
  const linkers = useMemo(
    () => readerLinkers({ onPressTask, onPressLink, onPressPr }),
    [onPressTask, onPressLink, onPressPr]
  )
  const prose = useMemo(
    () => (format === 'markdown' ? stripLeadingHeading(body) : body),
    [format, body]
  )
  if (format === 'unsupported') {
    return <EmptyState title="This file type has no preview" description={item.path} />
  }
  if (body.trim() === '') {
    return (
      <Typography variant="caption" className="text-text-secondary" testID="knowledge-no-text">
        This file has no text
      </Typography>
    )
  }
  if (format === 'markdown') {
    return <MarkdownProse body={prose} linkers={linkers} testID="knowledge-body" />
  }
  return (
    <Typography
      variant="mono"
      className="text-text-primary web:break-words"
      testID="knowledge-body"
    >
      {body}
    </Typography>
  )
}

function LoadingCard({ className }: { className?: string }) {
  return (
    <Card
      className={cn('gap-3 p-5', className)}
      testID="knowledge-reader-loading"
      role="region"
      aria-label="Loading document"
      aria-busy
    >
      <Skeleton variant="text" width="55%" height={24} />
      <Skeleton variant="text" width="35%" />
      <Divider />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="92%" />
      <Skeleton variant="text" width="97%" />
      <Skeleton variant="text" width="60%" />
    </Card>
  )
}

/**
 * KnowledgeReader — one note or source under a metadata header: the title, an eyebrow of
 * initiative, record and kind (a note kind as icon + label), a line of date and tags, and the file's text as markdown
 * prose (with task ids, `[[name]]` links and PR numbers linked), as mono text, or as
 * "no preview" for a file type it cannot show. A truncated read says so.
 *
 * Holds no state; the host owns which item is open. Composes {@link Card},
 * {@link Divider}, {@link Typography}, {@link Pill}, {@link DateTime}, {@link Link},
 * {@link Alert}, {@link EmptyState}, {@link Skeleton} and {@link MarkdownProse}.
 */
export function KnowledgeReader({
  document,
  isLoading = false,
  onPressInitiative,
  onPressTag,
  onPressTask,
  onPressLink,
  onPressPr,
  actions,
  metaLayout = 'inline',
  emptyState,
  className,
}: KnowledgeReaderProps) {
  if (isLoading) return <LoadingCard className={className} />
  if (!document) {
    return <>{emptyState ?? <EmptyState title="Select a note or source" />}</>
  }
  const { item } = document
  return (
    <Card
      className={cn('gap-3 p-5', className)}
      testID="knowledge-reader"
      role="region"
      aria-label={item.title}
    >
      <View className="gap-2">
        <View className="flex-row items-start gap-3">
          <Typography variant="h5" className="min-w-0 flex-1 text-text-primary web:break-words">
            {item.title}
          </Typography>
          {actions}
        </View>
        <KnowledgeReaderMeta
          item={item}
          layout={metaLayout}
          onPressInitiative={onPressInitiative}
          onPressTag={onPressTag}
        />
      </View>
      <Divider />
      {document.isTruncated ? <TruncatedNotice bytes={document.bytes} /> : null}
      <ReaderBody document={document} handlers={{ onPressTask, onPressLink, onPressPr }} />
    </Card>
  )
}
