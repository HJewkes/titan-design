import { Text } from 'react-native'
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
    <Pill
      variant="subtle"
      tone="neutral"
      size={size}
      className={className}
      testID={testID}
      leading={
        <Text aria-hidden className="text-text-tertiary">
          {REF_KIND_META[entity.kind].glyph}
        </Text>
      }
      trailing={
        status ? (
          <Pill variant="subtle" tone={status.tone} size="xs" leading="dot">
            {status.label}
          </Pill>
        ) : undefined
      }
      accessibilityRole={isStatic ? 'text' : undefined}
      accessibilityLabel={describeRef(entity)}
    >
      {entity.label}
    </Pill>
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
