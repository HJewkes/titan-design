import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArchiveFrame } from './ArchiveFrame'

/**
 * `Lab/Design Archive/Foundations (superseded)` — captures from the color-system
 * R&D pass. **Every specimen in this group is superseded.** Each one is titled
 * "final" in its own markup, and each was overtaken by a later pass; nothing here
 * describes the palette that shipped.
 *
 * The shipped categorical palette is 7 ordered hues in two variants (`default`,
 * `dark`), ordered blue → magenta → red → orange → green → cyan → amber, with
 * `CATEGORICAL_CVD_SAFE_MAX = 6` (the 7th is extended, and wants a legend). None
 * of the three captures below match that: they show 9 hues, a main/light/dark
 * variant split, and a different hue order with a CVD floor of 8.
 *
 * Source of truth: `src/theme/tokens/primitives.ts`. These frames are kept for
 * the *reasoning* — how the hue set was narrowed and why — not for their values.
 *
 * @see `.storybook/lab-archive/README.md` for the archive-wide status note.
 */
const meta: Meta<typeof ArchiveFrame> = {
  title: 'Lab/Design Archive/Foundations (superseded)',
  component: ArchiveFrame,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof ArchiveFrame>

const frame = (path: string, title: string): Story => ({
  name: title,
  args: { path, title },
})

/**
 * Closest to the shipped palette, but still superseded: the hue *order* differs
 * (amber → magenta → cyan → red → blue → orange → green, vs the shipped blue →
 * magenta → red → orange → green → cyan → amber), it splits variants
 * main/light/dark rather than default/dark, and it states a CVD floor of 8 where
 * the shipped `CATEGORICAL_CVD_SAFE_MAX` is 6.
 */
export const OrderedCategorical = frame(
  'foundations/ordered-categorical-final.html',
  'Ordered Categorical (superseded)'
)

/**
 * The 9→7 hue consolidation (amber absorbs yellow, cyan absorbs steel). The hue
 * *count* survived into the shipped system; the main(9)/light(7)/dark(6)
 * categorical split shown here did not — shipped is two variants of 7.
 */
export const Vw22SevenHue = frame(
  'foundations/vw22-final.html',
  'VW-22 · 7-hue repoint (superseded)'
)

/**
 * The earliest of the three — 37 colors narrowed to 9 hues with an 8-color
 * categorical. Superseded twice over: the 9 hues were later consolidated to 7.
 */
export const DerivedSystem9 = frame(
  'foundations/derived-system-9.html',
  'Derived System · 9 hues (superseded)'
)
