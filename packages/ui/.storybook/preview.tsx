import type { Preview } from '@storybook/react'
import { withThemeByClassName } from '@storybook/addon-themes'
import React from 'react'
import '../src/theme/global.css'

// Sidebar information architecture (TD Storybook reorg).
//
// Six top-level roots, ordered foundations → build-up → full screens → lab:
//   Foundations → Components → Workout → Shell → Pages → Lab.
// `Components` reads by tier (Atoms → Molecules → Organisms → DataViz) and `Lab`
// sorts last. Composition is expressed as autodocs "**Tier.** Composes […]" /
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
      storySort: {
        method: 'alphabetical',
        order: [
          'Foundations',
          ['Color', 'Typography', 'Icons', 'Elevation', 'Shadows', 'Theme Presets'],
          'Components',
          ['Atoms', 'Molecules', 'Organisms', 'DataViz'],
          'Workout',
          'Shell',
          'Pages',
          'Lab',
          ['Explorations', 'Specimens', 'Audits', 'Recipes'],
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
