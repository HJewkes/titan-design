import type { Preview } from '@storybook/react'
import { withThemeByClassName } from '@storybook/addon-themes'
import React from 'react'
import '../src/theme/global.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
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
      <div className="font-sans text-text-primary" style={{ 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <Story />
      </div>
    ),
  ],
}

export default preview
