import type { ViewProps } from 'react-native'
import { Metric, type MetricProps } from '../metric'
import { cn } from '../../../utils/cn'
import { Card, type CardProps } from './Card'

/** Props for {@link CardStat}: the Metric's figure and label on a Card plane. */
export interface CardStatProps
  extends
    ViewProps,
    Pick<
      MetricProps,
      | 'label'
      | 'value'
      | 'unit'
      | 'size'
      | 'align'
      | 'tone'
      | 'valueClassName'
      | 'valueStyle'
      | 'labelClassName'
    >,
    Pick<CardProps, 'variant' | 'elevation'> {
  /** Merged onto the card. */
  className?: string
}

/**
 * The Card stat preset: one labelled figure on a card plane (roadmap decision 1).
 *
 * A `filled` card one plane above its host, so a row of stats nested in a lifted
 * card steps up by tone alone. The figure is a `Metric`; `tone` colours the value
 * from a semantic token.
 *
 * @example
 * <CardStat label="Volume" value="76%" />
 * <CardStat label="Fatigue" value="MOD" tone="warning" />
 */
export function CardStat({
  label,
  value,
  unit,
  size = 'sm',
  align = 'center',
  tone,
  valueClassName,
  valueStyle,
  labelClassName,
  variant = 'filled',
  elevation = 1,
  ...cardProps
}: CardStatProps) {
  return (
    <Card variant={variant} elevation={elevation} {...cardProps}>
      <Metric
        label={label}
        value={value}
        unit={unit}
        size={size}
        align={align}
        tone={tone}
        valueStyle={valueStyle}
        valueClassName={valueClassName}
        labelClassName={cn('mt-0 uppercase tracking-wider text-text-tertiary', labelClassName)}
        className="p-inset-sm gap-stack-sm"
      />
    </Card>
  )
}
