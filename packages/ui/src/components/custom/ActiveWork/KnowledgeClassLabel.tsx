// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { resolveColor } from '../../../theme/resolve-color'
import { Indicator } from '../../ui/indicator'
import { Typography } from '../../ui/typography'
import { KNOWLEDGE_CLASS_META, toKnowledgeClass, type KnowledgeClass } from './knowledge-class'

/** Props for {@link KnowledgeClassLabel}. */
export interface KnowledgeClassLabelProps {
  /**
   * A {@link KnowledgeClass} or any wire name for one (`notes`, `nested_sources`).
   * An unknown name renders as given, beside a neutral dot.
   */
  knowledgeClass: KnowledgeClass | (string & {})
  /** Reads `Notes` rather than `Note`, for a legend or a count. */
  isPlural?: boolean
  /** Hides the text, leaving only the dot. Pair it with a tooltip or a visible legend. */
  dotOnly?: boolean
  /** Tailwind overrides for the row. */
  className?: string
}

/**
 * KnowledgeClassLabel — a record class as a categorical dot plus its name.
 *
 * Composes {@link Indicator} and {@link Typography}. The colour comes from
 * `KNOWLEDGE_CLASS_META`, one fixed token per class, so a class reads the same in
 * a search row, a map legend and a list. The name always shows unless `dotOnly`,
 * so a class is never told by colour alone.
 */
export function KnowledgeClassLabel({
  knowledgeClass,
  isPlural = false,
  dotOnly = false,
  className,
}: KnowledgeClassLabelProps) {
  const known = toKnowledgeClass(knowledgeClass)
  const meta = known ? KNOWLEDGE_CLASS_META[known] : undefined
  const label = meta ? (isPlural ? meta.plural : meta.label) : knowledgeClass

  return (
    <View
      className={cn('flex-row items-center gap-1.5', className)}
      accessibilityLabel={dotOnly ? label : undefined}
      role={dotOnly ? 'img' : undefined}
    >
      <Indicator
        size="sm"
        customColor={meta ? resolveColor(meta.colorToken) : undefined}
        testID={`knowledge-class-dot-${known ?? 'unknown'}`}
      />
      {dotOnly ? null : (
        <Typography variant="caption" color="inherit" className="text-text-secondary">
          {label}
        </Typography>
      )}
    </View>
  )
}
