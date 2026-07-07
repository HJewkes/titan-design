import React from 'react'
import { Text, type TextProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'subtitle1'
  | 'subtitle2'
  | 'caption'
  | 'overline'
  | 'button'
  | 'mono'
  | 'monoLabel'

export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'inherit'

export type TypographyAlign = 'left' | 'center' | 'right' | 'justify'

export type TypographyMarginBottom = 'none' | 'sm' | 'md' | 'lg'

export interface TypographyProps extends TextProps {
  /** Typography variant */
  variant?: TypographyVariant
  /** Text color */
  color?: TypographyColor
  /** Text alignment */
  align?: TypographyAlign
  /** Whether text should truncate with ellipsis */
  truncate?: boolean
  /** @deprecated Use truncate instead */
  noWrap?: boolean
  /** Margin bottom spacing */
  marginBottom?: TypographyMarginBottom
  /** @deprecated Use marginBottom instead */
  gutterBottom?: boolean
  /** Maximum number of lines before truncating */
  maxLines?: number
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

// Variant styles matching the existing theme
const variantStyles: Record<TypographyVariant, string> = {
  h1: 'font-heading text-5xl font-bold leading-tight',
  h2: 'font-heading text-4xl font-bold leading-tight',
  h3: 'font-heading text-3xl font-bold leading-tight',
  h4: 'font-heading text-2xl font-bold leading-tight',
  h5: 'font-heading text-xl font-semibold leading-tight',
  h6: 'font-heading text-lg font-semibold leading-tight',
  body1: 'font-body text-base font-normal leading-normal',
  body2: 'font-body text-sm font-normal leading-normal',
  subtitle1: 'font-body text-base font-medium leading-relaxed',
  subtitle2: 'font-body text-sm font-medium leading-normal',
  caption: 'font-body text-xs font-normal leading-loose',
  overline: 'font-body text-xs font-semibold uppercase tracking-widest leading-relaxed',
  button: 'font-sans text-sm font-semibold leading-relaxed',
  // Monospace technical readouts (clocks, ids, metrics) and their all-caps label form.
  mono: 'font-mono text-xs font-normal leading-normal',
  monoLabel: 'font-mono text-xs font-bold uppercase tracking-wide leading-normal',
}

const colorStyles: Record<TypographyColor, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  disabled: 'text-text-disabled',
  inverse: 'text-text-inverse',
  success: 'text-status-success',
  error: 'text-status-error',
  warning: 'text-status-warning',
  info: 'text-status-info',
  inherit: '', // No color class, inherit from parent
}

const alignStyles: Record<TypographyAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

// Heading variants for accessibility role
const headingVariants: TypographyVariant[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

const marginBottomStyles: Record<TypographyMarginBottom, string> = {
  none: '',
  sm: 'mb-1',
  md: 'mb-2',
  lg: 'mb-4',
}

/**
 * Typography component for consistent text styling.
 *
 * @example
 * <Typography variant="h1">Page Title</Typography>
 * <Typography variant="body1" color="secondary">Body text content</Typography>
 * <Typography variant="caption" marginBottom="md">Small caption text</Typography>
 * <Typography truncate maxLines={2}>Long text that will truncate...</Typography>
 */
export function Typography({
  variant = 'body1',
  color = 'primary',
  align,
  truncate = false,
  noWrap = false, // deprecated, kept for backward compatibility
  marginBottom,
  gutterBottom = false, // deprecated, kept for backward compatibility
  maxLines,
  className,
  children,
  ...props
}: TypographyProps) {
  const isHeading = headingVariants.includes(variant)
  const shouldTruncate = truncate || noWrap
  const mb = marginBottom || (gutterBottom ? 'md' : 'none')

  // Determine number of lines
  let numLines: number | undefined
  if (maxLines) {
    numLines = maxLines
  } else if (shouldTruncate) {
    numLines = 1
  }

  return (
    <Text
      accessibilityRole={isHeading ? 'header' : 'text'}
      numberOfLines={numLines}
      className={cn(
        variantStyles[variant],
        color !== 'inherit' && colorStyles[color],
        align && alignStyles[align],
        shouldTruncate && 'truncate',
        marginBottomStyles[mb],
        className
      )}
      {...props}
    >
      {children}
    </Text>
  )
}

// Convenience components for common typography patterns

export interface HeadingProps extends Omit<TypographyProps, 'variant'> {
  /** Heading level (1-6) */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

/**
 * Heading component - convenience wrapper for Typography with heading variants.
 *
 * @example
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2} gutterBottom>Section Title</Heading>
 */
export function Heading({ level = 1, ...props }: HeadingProps) {
  const variant = `h${level}` as TypographyVariant
  return <Typography variant={variant} {...props} />
}

export interface ParagraphProps extends Omit<TypographyProps, 'variant'> {
  /** Use smaller body2 variant */
  small?: boolean
}

/**
 * Paragraph component - convenience wrapper for body text.
 *
 * @example
 * <Paragraph>This is body text content.</Paragraph>
 * <Paragraph small>This is smaller body text.</Paragraph>
 */
export function Paragraph({ small = false, ...props }: ParagraphProps) {
  return <Typography variant={small ? 'body2' : 'body1'} {...props} />
}

export interface CaptionProps extends Omit<TypographyProps, 'variant'> {}

/**
 * Caption component - for small helper/secondary text.
 */
export function Caption(props: CaptionProps) {
  return <Typography variant="caption" color="secondary" {...props} />
}

export interface LabelProps extends Omit<TypographyProps, 'variant'> {}

/**
 * Label component - for form labels and similar.
 */
export function Label(props: LabelProps) {
  return <Typography variant="subtitle2" {...props} />
}

export interface OverlineProps extends Omit<TypographyProps, 'variant'> {}

/**
 * Overline component - for section labels, categories.
 */
export function Overline(props: OverlineProps) {
  return <Typography variant="overline" color="secondary" {...props} />
}
