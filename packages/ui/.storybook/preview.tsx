import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import React from 'react'
import '../src/theme/global.css'
import { withSurfaceTheme } from './withSurfaceTheme'
import { withWidthMatrix } from './withWidthMatrix'

// Sidebar information architecture (see `storySort` below).
//
// Roots, in the order `storySort.order` lists them:
//   Foundations → Components → Custom → Shell → Pages → Lab → Docs.
// `Components` reads by tier (Atoms → Molecules → Organisms); `Custom/<Family>` and
// `Lab/<Family>` list their families in a fixed order; `Docs` is listed last.
// Composition is expressed as autodocs "**Tier.** Composes […]" /
// "Used-by ↑ […]" prose links between canonical stories — never physical nesting.
// Maturity taxonomy (see packages/ui/MATURITY.md).
//
// Every story inherits `status:review` from this project-level default, so the
// whole library reads as "Needs Review" until a component is FORMALLY promoted.
// Promotion is a one-line meta edit on the component: `tags: ['status:stable',
// '!status:review']` (the `!` negates the inherited default). Statuses:
//   status:stable    — reviewed + approved; safe to consume in app surfaces
//   status:review    — DEFAULT; not yet formally reviewed
//   status:candidate — ported in (e.g. from mobile) for review, not yet vetted
//   status:lab       — WIP exploration (Lab/*; already excluded from publish)
// Slice the sidebar by any of these with the tag-filter (funnel) control.
const preview: Preview = {
  tags: ['status:review'],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    options: {
      // Titles named in `order` come first, in that order (a following array orders that
      // title's children); anything not named sorts alphabetically after them.
      storySort: {
        method: 'alphabetical',
        order: [
          'Foundations',
          [
            // Color splits into the raw scales and the assignments OF them.
            // Alphabetical would put Palettes before Primitives, which reads
            // backwards — the raw material should come first.
            'Color',
            ['Primitives', 'Palettes'],
            'Typography',
            'Icons',
            'Depth',
            'Depth Calibration',
            'Choosing Tokens',
          ],
          'Components',
          ['Atoms', 'Molecules', 'Organisms'],
          'Custom',
          ['ActiveWork', 'Workout', 'Fatigue', 'Charts', 'Prose'],
          'Shell',
          'Pages',
          'Lab',
          ['Explorations', 'Specimens', 'Audits', 'Recipes'],
          'Docs',
        ],
        locales: 'en-US',
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: '', // empty string = default (dark mode, no class)
      },
      defaultTheme: 'dark',
      parentSelector: 'html', // Apply class to html element
    }),
    withSurfaceTheme,
    withWidthMatrix,
    (Story) => (
      <div
        className="font-sans text-text-primary"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default preview
