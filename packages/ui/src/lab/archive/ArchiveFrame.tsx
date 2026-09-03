import type { CSSProperties } from 'react'
import { getSemanticColors } from '../../theme/tokens/semantic'

/**
 * Lab/Design Archive — iframe host for captured design-iteration HTML.
 *
 * **The framed content is historical and does not depict shipped design.** See
 * `.storybook/lab-archive/README.md` — these captures predate the titan token
 * system and carry their own inline CSS variables, so no colour, spacing, or
 * component detail inside a frame should be read as current.
 *
 * Each archived file is a self-contained (inline CSS/JS) design specimen copied
 * verbatim into `.storybook/lab-archive/…` and served by Storybook's staticDir
 * under `/lab-archive/…` (see `.storybook/main.ts`). These stories deliberately
 * do NOT port the designs to React — they are a browsable, frozen archive of the
 * exploration phase, so we iframe the original bytes and keep the pixels honest.
 * Directory structure mirrors the sources, so each captured index's relative
 * links to sibling galleries still resolve inside the frame.
 */
const ARCHIVE_ROOT = '/lab-archive'

// The letterbox is titan chrome, not part of the archived artifact — the frozen
// bytes begin at the iframe boundary — so it takes the themed frame/bezel token
// rather than a captured colour. Literal hex via `getSemanticColors` (not
// `resolveColor`) because this is a plain DOM `style` on an <iframe>, outside
// the RNW `var()` pipeline.
const FRAME_BACKGROUND = getSemanticColors('dark')['background-frame']

const frameStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  border: 'none',
  background: FRAME_BACKGROUND,
}

export type ArchiveFrameProps = {
  /** Path under `/lab-archive/`, e.g. `drilldown-pass/a-stage-rail/gallery.html`. */
  path: string
  /** Accessible title for the frame (also shown by screen readers). */
  title: string
}

export const ArchiveFrame = ({ path, title }: ArchiveFrameProps) => (
  <iframe src={`${ARCHIVE_ROOT}/${path}`} title={title} style={frameStyle} />
)
