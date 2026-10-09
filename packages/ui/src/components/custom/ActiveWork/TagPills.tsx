// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { Pill } from '../../ui/pill'
import { Tooltip } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'

/** How many tags fit before a row starts eliding them. */
const MAX_VISIBLE_TAGS = 2

/** The tags a row elided, shown when the `+N` count is hovered. */
function HiddenTags({ tags }: { tags: string[] }) {
  return (
    <View className="flex-row flex-wrap gap-1" testID="hidden-tags">
      {tags.map((tag) => (
        <Pill key={tag} variant="subtle" color="default" size="xs">
          {tag}
        </Pill>
      ))}
    </View>
  )
}

/**
 * A table cell's tags: the first two as neutral pills, the rest folded into a
 * `+N` count whose tooltip lists them. Shared by {@link TaskRow} and {@link KnowledgeRow}.
 */
export function TagPills({ tags = [] }: { tags?: string[] }) {
  const hiddenTags = tags.slice(MAX_VISIBLE_TAGS)
  return (
    <View className="flex-row items-center gap-1">
      {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
        <Pill key={tag} variant="subtle" color="default" size="xs">
          {tag}
        </Pill>
      ))}
      {hiddenTags.length > 0 ? (
        <Tooltip usePortal content={<HiddenTags tags={hiddenTags} />}>
          {/* leading-none: the caption's loose line box would otherwise float the pills above centre. */}
          <Typography variant="caption" className="leading-none text-text-secondary">
            {`+${hiddenTags.length}`}
          </Typography>
        </Tooltip>
      ) : null}
    </View>
  )
}
