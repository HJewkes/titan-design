import { Typography, type TypographyColor, type TypographyVariant } from '../typography'
import { cn } from '../../../utils/cn'
import { toSegments, type HighlightRange } from './highlight-model'

export type { HighlightRange }

/** Props for {@link HighlightText}. */
export interface HighlightTextProps {
  /** The full string to render. */
  text: string
  /** Matched ranges, end exclusive. `[]` renders the text plain. */
  ranges: readonly HighlightRange[]
  /** Typography variant of the whole string. */
  variant?: TypographyVariant
  /** Text colour; matched segments inherit it. */
  color?: TypographyColor
  /** Maximum number of lines before truncating. */
  maxLines?: number
  /** Additional className for the root. */
  className?: string
}

/**
 * A string with matched ranges emphasised by weight only, so no colour pair is added.
 *
 * @example
 * <HighlightText text="Open recent project" ranges={[{ start: 0, end: 4 }]} />
 */
export function HighlightText({
  text,
  ranges,
  variant = 'body2',
  color = 'primary',
  maxLines,
  className,
}: HighlightTextProps) {
  if (text === '') return null
  return (
    <Typography variant={variant} color={color} maxLines={maxLines} className={cn(className)}>
      {toSegments(text, ranges).map((segment, index) =>
        segment.isMatch ? (
          <Typography key={index} variant={variant} color="inherit" className="font-bold">
            {segment.text}
          </Typography>
        ) : (
          segment.text
        )
      )}
    </Typography>
  )
}
