import type { StorybookConfig } from '@storybook/react-native-web-vite'
import {
  reactNativeSvgWebResolver,
  reactNativeBodyHighlighterEsm,
  svgWebAliases,
  webResolveExtensions,
} from '../vite-rn-svg-plugins'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        jsxImportSource: 'nativewind',
      },
    },
  },
  // Mirror the test runner's react-native-svg web resolution so the real
  // <Body/> SVG renders under react-native-web in Storybook too.
  viteFinal: async (cfg) => {
    cfg.plugins = [
      reactNativeSvgWebResolver(),
      reactNativeBodyHighlighterEsm(),
      ...(cfg.plugins ?? []),
    ]
    cfg.resolve = cfg.resolve ?? {}
    const existingAlias = cfg.resolve.alias
    const existingAliasArray = Array.isArray(existingAlias)
      ? existingAlias
      : Object.entries(existingAlias ?? {}).map(([find, replacement]) => ({
          find,
          replacement: replacement as string,
        }))
    cfg.resolve.alias = [...svgWebAliases, ...existingAliasArray]
    cfg.resolve.extensions = [...webResolveExtensions, ...(cfg.resolve.extensions ?? [])]
    cfg.optimizeDeps = cfg.optimizeDeps ?? {}
    cfg.optimizeDeps.exclude = [
      ...(cfg.optimizeDeps.exclude ?? []),
      'react-native-svg',
      'react-native-body-highlighter',
    ]
    return cfg
  },
}

export default config
