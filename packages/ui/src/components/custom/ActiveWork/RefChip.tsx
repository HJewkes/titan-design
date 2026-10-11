import { Text, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Link } from '../../ui/link'
import { Pill, type PillSizeLevel } from '../../ui/pill'
import { REF_KIND_META, describeRef, type EntityRef } from './ref-kind'

/** A ref plus how the chip is pressed and drawn. */
export interface RefChipProps extends EntityRef {
  /**
   * Called with the ref when the chip is pressed. With neither this nor `href`
   * the chip is static: no link role and no tab stop.
   */
  onPressRef?: (ref: EntityRef) => void
  /** Pill size; defaults to `sm`. */
  size?: PillSizeLevel
  /** Extra classes on the chip. */
  className?: string
  /** Defaults to `ref-chip`. */
  testID?: string
}

// Pill's text ramp, so the glyph sits at the label's size.
const glyphSize: Record<PillSizeLevel, string> = {
  xs: 'text-3xs',
  sm: 'text-2xs',
  md: 'text-xs',
  lg: 'text-sm',
}

interface RefChipBodyProps {
  entity: EntityRef
  isStatic: boolean
  size: PillSizeLevel
  className?: string
  testID: string
}

function RefChipBody({ entity, isStatic, size, className, testID }: RefChipBodyProps) {
  const { status } = entity
  return (
    <View
      className={cn('flex-row items-center gap-inline-sm self-start', className)}
      testID={testID}
      accessibilityRole={isStatic ? 'text' : undefined}
      accessibilityLabel={describeRef(entity)}
    >
      <Pill
        variant="subtle"
        tone="neutral"
        size={size}
        leading={
          <Text aria-hidden className={cn('text-text-tertiary', glyphSize[size])}>
            {REF_KIND_META[entity.kind].glyph}
          </Text>
        }
      >
        {entity.label}
      </Pill>
      {status ? (
        <Pill variant="subtle" tone={status.tone} size={size} leading="dot">
          {status.label}
        </Pill>
      ) : null}
    </View>
  )
}

/**
 * RefChip — a typed pointer at another entity: a kind glyph, the ref's label
 * and an optional status. Pressable through `onPressRef`, navigable through
 * `href`, and static with neither.
 */
export function RefChip({
  kind,
  id,
  label,
  status,
  href,
  onPressRef,
  size = 'sm',
  className,
  testID = 'ref-chip',
}: RefChipProps) {
  const entity: EntityRef = { kind, id, label, status, href }
  const isStatic = !href && !onPressRef
  const body = (
    <RefChipBody
      entity={entity}
      isStatic={isStatic}
      size={size}
      className={className}
      testID={testID}
    />
  )
  if (isStatic) return body
  return (
    <Link
      href={href}
      color="inherit"
      underline="none"
      onPress={onPressRef ? () => onPressRef(entity) : undefined}
    >
      {body}
    </Link>
  )
}
