import type { StorybookConfig } from '@storybook/react-native-web-vite'
import {
  reactNativeBodyHighlighterEsm,
  reactNativeSvgWebResolver,
  reactNativeSvgWebResolverEsbuild,
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
  //
  // Unlike vitest, Storybook serves to a real browser, so the dependencies must
  // resolve to plain ESM with no throwing dynamic `require()`. Instead of
  // hand-bundling react-native-body-highlighter with a nested esbuild that
  // externalizes react/react-native (which esbuild emits as a dynamic
  // `require('react')` — fatal in the browser), let Vite's own dep optimizer
  // pre-bundle it: the optimizer rewrites bare imports of the project's real
  // react / react-native(-web) to the app's single copies (proper ESM, no
  // dynamic require, no duplicate react / invalid-hook-call). The svg `.web.js`
  // resolution that the Vite resolveId plugin provides for non-pre-bundled
  // paths is replayed inside the optimizer via the esbuild-plugin form.
  //
  // The dep optimizer only runs on the dev server. `build-storybook` (a Rollup
  // production build) never pre-bundles, so it would hand the package's raw CJS
  // dist — untranspiled JSX plus `exports.default` with no static ESM default —
  // straight to Rollup, which fails with "default is not exported by dist/index.js".
  // For the build only, pre-transform the entry to self-contained ESM via
  // esbuild (reactNativeBodyHighlighterEsm) so Rollup sees a real default export.
  // It is scoped to PRODUCTION because its esbuild-externalized react/react-native
  // imports would break the dev server's ESM serving (hence the optimizer there).
  viteFinal: async (cfg, options) => {
    const buildOnlyPlugins =
      options.configType === 'PRODUCTION' ? [reactNativeBodyHighlighterEsm()] : []
    cfg.plugins = [reactNativeSvgWebResolver(), ...buildOnlyPlugins, ...(cfg.plugins ?? [])]
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
    cfg.optimizeDeps.include = [
      ...(cfg.optimizeDeps.include ?? []),
      'react-native-svg',
      'react-native-body-highlighter',
    ]
    cfg.optimizeDeps.esbuildOptions = {
      ...(cfg.optimizeDeps.esbuildOptions ?? {}),
      loader: { ...(cfg.optimizeDeps.esbuildOptions?.loader ?? {}), '.js': 'jsx' },
      jsx: 'automatic',
      resolveExtensions: webResolveExtensions,
      plugins: [
        ...(cfg.optimizeDeps.esbuildOptions?.plugins ?? []),
        reactNativeSvgWebResolverEsbuild(),
      ],
    }
    return cfg
  },
}

export default config
