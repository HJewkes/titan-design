// Shim for migration M2. The components live in `ui/typography` now; this file
// keeps the old import path alive for one release. The re-exports below import
// the bindings first and export them with no `from` clause on purpose:
// `eslint-rules/deprecated-export-registry.js` unifies a re-export identity only
// when the statement carries a source, so `export { X } from '…'` would mark the
// NEW definition deprecated too (lesson from migration M1, #276).
import { Typography, Heading, Paragraph, Caption, Label, Overline } from '../../ui/typography'
import type {
  TypographyProps,
  TypographyVariant,
  TypographyColor,
  TypographyAlign,
  HeadingProps,
  ParagraphProps,
  CaptionProps,
  LabelProps,
  OverlineProps,
} from '../../ui/typography'

/**
 * @deprecated Moved to `ui/typography` (migration M2) so `ui/`-tier components can
 * compose text without an upward import. Import from `@titan-design/react-ui` as
 * before, or from `@/components/ui/typography` by path. This re-export is removed in 0.23.0.
 */
export { Typography, Heading, Paragraph, Caption, Label, Overline }

/**
 * @deprecated Moved to `ui/typography` (migration M2). Import these types from
 * `@titan-design/react-ui` as before, or from `@/components/ui/typography` by path.
 * This re-export is removed in 0.23.0.
 */
export type {
  TypographyProps,
  TypographyVariant,
  TypographyColor,
  TypographyAlign,
  HeadingProps,
  ParagraphProps,
  CaptionProps,
  LabelProps,
  OverlineProps,
}
