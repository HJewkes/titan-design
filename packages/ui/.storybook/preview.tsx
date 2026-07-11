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
const preview: Preview = {
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
          ['Candidates', 'Explorations', 'Specimens', 'Audits', 'Recipes'],
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
