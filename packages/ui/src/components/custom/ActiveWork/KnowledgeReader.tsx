// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, type ReactNode } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { formatBytes } from '../../../utils/number-format'
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert'
import { Card } from '../../ui/card'
import { DateTime } from '../../ui/date-time'
import { Divider } from '../../ui/divider'
import { EmptyState } from '../../ui/empty-state'
import { Link } from '../../ui/link'
import { Pill } from '../../ui/pill'
import { Skeleton } from '../../ui/skeleton'
import { Typography } from '../../ui/typography'
import { MarkdownProse } from '../Prose'
import { KNOWLEDGE_CLASS_META, NOTE_KIND_LABEL, SOURCE_TYPE_LABEL } from './knowledge-class'
import { knowledgeBodyFormat, type KnowledgeDocument } from './knowledge-document'
import type { KnowledgeItem } from './knowledge-filters'
import { sessionLinkers, type SessionLinkHandlers } from './session-linkers'
import { stripLeadingHeading } from './SessionDetail'

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
  /** Replaces the default "nothing selected" state. */
  emptyState?: ReactNode
  /** Tailwind overrides for the card. */
  className?: string
}

function recordLabel(item: KnowledgeItem): string {
  if (item.record === 'note') return KNOWLEDGE_CLASS_META.note.label
  return KNOWLEDGE_CLASS_META[item.isNested ? 'nested_source' : 'source'].label
}

function kindLabel(item: KnowledgeItem): string | undefined {
  if (item.record === 'note') return item.noteKind && NOTE_KIND_LABEL[item.noteKind]
  return item.sourceType && SOURCE_TYPE_LABEL[item.sourceType]
}

function InitiativeName({
  initiative,
  onPress,
}: {
  initiative: string
  onPress?: (initiative: string) => void
}) {
  if (!onPress) {
    return (
      <Typography variant="mono" className="text-text-secondary web:break-words">
        {initiative}
      </Typography>
    )
  }
  return (
    <Link
      onPress={() => onPress(initiative)}
      color="inherit"
      className="font-mono text-sm text-text-secondary web:break-words"
    >
      {initiative}
    </Link>
  )
}

function KnowledgeMeta({
  item,
  onPressInitiative,
}: {
  item: KnowledgeItem
  onPressInitiative?: (initiative: string) => void
}) {
  const kind = kindLabel(item)
  return (
    <View className="flex-row flex-wrap items-center gap-2.5" testID="knowledge-meta">
      <InitiativeName initiative={item.initiative} onPress={onPressInitiative} />
      <Pill variant="subtle" color="default" size="xs">
        {recordLabel(item)}
      </Pill>
      {kind ? (
        <Pill variant="subtle" color="default" size="xs">
          {kind}
        </Pill>
      ) : null}
      <DateTime
        value={item.created ?? item.mtime}
        format="medium"
        isUTC
        fallback=""
        variant="mono"
        className="shrink-0 text-text-secondary"
      />
    </View>
  )
}

function KnowledgeTags({ tags, onPress }: { tags: string[]; onPress?: (tag: string) => void }) {
  if (tags.length === 0) return null
  return (
    <View className="flex-row flex-wrap items-center gap-1.5" testID="knowledge-tags">
      {tags.map((tag) => (
        <Pill
          key={tag}
          variant="subtle"
          color="default"
          size="xs"
          onPress={onPress ? () => onPress(tag) : undefined}
        >
          {tag}
        </Pill>
      ))}
    </View>
  )
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
    () => sessionLinkers({ onPressTask, onPressLink, onPressPr }),
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
 * KnowledgeReader — one note or source under a metadata header: the title, then one
 * line of initiative, record, kind and date, the tags, and the file's text as markdown
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
        <KnowledgeMeta item={item} onPressInitiative={onPressInitiative} />
        <KnowledgeTags tags={item.tags ?? []} onPress={onPressTag} />
      </View>
      <Divider />
      {document.isTruncated ? <TruncatedNotice bytes={document.bytes} /> : null}
      <ReaderBody document={document} handlers={{ onPressTask, onPressLink, onPressPr }} />
    </Card>
  )
}
