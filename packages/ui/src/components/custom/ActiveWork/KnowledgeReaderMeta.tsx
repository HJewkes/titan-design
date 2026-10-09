// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ComponentType } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import {
  AlertTriangleIcon,
  InfoIcon,
  KanbanIcon,
  RepeatIcon,
  ScaleIcon,
  type IconProps,
} from '../../icons'
import { DateTime } from '../../ui/date-time'
import { Link } from '../../ui/link'
import { Pill } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import {
  KNOWLEDGE_CLASS_META,
  NOTE_KIND_LABEL,
  SOURCE_TYPE_LABEL,
  type NoteKind,
} from './knowledge-class'
import type { KnowledgeItem } from './knowledge-filters'

/** Where the record and kind sit: in the eyebrow beside the initiative, or at the right edge. */
export type KnowledgeMetaLayout = 'inline' | 'split'

/** One existing icon per note kind; `NoteKind` is a fixed enumeration, so the mapping is total. */
const NOTE_KIND_ICON: Record<NoteKind, ComponentType<IconProps>> = {
  process: RepeatIcon,
  gotcha: AlertTriangleIcon,
  fyi: InfoIcon,
  decision: ScaleIcon,
  plan: KanbanIcon,
}

function recordLabel(item: KnowledgeItem): string {
  if (item.record === 'note') return KNOWLEDGE_CLASS_META.note.label
  return KNOWLEDGE_CLASS_META[item.isNested ? 'nested_source' : 'source'].label
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

/** A note kind as icon + label; a source type, which has no fixed icon set, as its label alone. */
function KindLabel({ item }: { item: KnowledgeItem }) {
  const noteKind = item.record === 'note' ? item.noteKind : undefined
  const label = noteKind
    ? NOTE_KIND_LABEL[noteKind]
    : item.record === 'note'
      ? undefined
      : item.sourceType && SOURCE_TYPE_LABEL[item.sourceType]
  if (!label) return null
  const Icon = noteKind ? NOTE_KIND_ICON[noteKind] : undefined
  return (
    <View className="flex-row items-center gap-1" testID="knowledge-kind">
      {Icon ? <Icon size={14} /> : null}
      <Typography variant="caption" color="inherit" className="text-text-secondary">
        {label}
      </Typography>
    </View>
  )
}

function RecordAndKind({ item }: { item: KnowledgeItem }) {
  return (
    <View className="flex-row items-center gap-2.5" testID="knowledge-record">
      <Typography variant="caption" color="inherit" className="text-text-secondary">
        {recordLabel(item)}
      </Typography>
      <KindLabel item={item} />
    </View>
  )
}

function KnowledgeEyebrow({
  item,
  layout,
  onPressInitiative,
}: {
  item: KnowledgeItem
  layout: KnowledgeMetaLayout
  onPressInitiative?: (initiative: string) => void
}) {
  return (
    <View
      className={cn(
        'flex-row flex-wrap items-center gap-x-4 gap-y-1',
        layout === 'split' && 'justify-between'
      )}
      testID="knowledge-meta"
    >
      <InitiativeName initiative={item.initiative} onPress={onPressInitiative} />
      <RecordAndKind item={item} />
    </View>
  )
}

function KnowledgeTags({ tags, onPress }: { tags: string[]; onPress?: (tag: string) => void }) {
  if (tags.length === 0) return null
  return (
    <View className="min-w-0 flex-row flex-wrap items-center gap-1.5" testID="knowledge-tags">
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

function KnowledgeDateTags({
  item,
  layout,
  onPressTag,
}: {
  item: KnowledgeItem
  layout: KnowledgeMetaLayout
  onPressTag?: (tag: string) => void
}) {
  const date = (
    <DateTime
      value={item.created ?? item.mtime}
      format="medium"
      isUTC
      fallback=""
      variant="mono"
      className="shrink-0 text-text-secondary"
    />
  )
  const tags = <KnowledgeTags tags={item.tags ?? []} onPress={onPressTag} />
  return (
    <View
      className={cn(
        'flex-row flex-wrap items-center gap-x-3 gap-y-1.5',
        layout === 'split' && 'justify-between'
      )}
      testID="knowledge-date-tags"
    >
      {layout === 'split' ? tags : date}
      {layout === 'split' ? date : tags}
    </View>
  )
}

/** The header's two metadata lines under the title: the eyebrow, then date and tags. */
export function KnowledgeReaderMeta({
  item,
  layout,
  onPressInitiative,
  onPressTag,
}: {
  item: KnowledgeItem
  layout: KnowledgeMetaLayout
  onPressInitiative?: (initiative: string) => void
  onPressTag?: (tag: string) => void
}) {
  return (
    <>
      <KnowledgeEyebrow item={item} layout={layout} onPressInitiative={onPressInitiative} />
      <KnowledgeDateTags item={item} layout={layout} onPressTag={onPressTag} />
    </>
  )
}
