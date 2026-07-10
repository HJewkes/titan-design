import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-native-web-vite'
import {
  reactNativeBodyHighlighterEsm,
  reactNativeSvgWebResolver,
  reactNativeSvgWebResolverEsbuild,
  svgWebAliases,
  webResolveExtensions,
} from '../vite-rn-svg-plugins'

// Lab/* build-exclusion.
//
// `Lab/*` (WIP explorations, rapid-prototype specimens, dated audits, and
// integration recipes) is dev-visible but excluded from the shared/published
// static build. `storybook dev` serves the full glob; a published build built
// with `STORYBOOK_PUBLIC=1 storybook build` drops every Lab-titled story so
// consumers never see WIP. Lab membership is read from the story's canonical
// `title: 'Lab/…'` — the same taxonomy the sidebar uses — so any future Lab
// story is quarantined automatically without touching this config.
//
// The vitest `stories-smoke` test discovers stories via its own
// `import.meta.glob('../components/**/*.stories.tsx')` against the filesystem,
// independent of this `stories` field, so Lab stories stay importable in the
// test env regardless of the published exclusion.
const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')

const collectStoryFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return collectStoryFiles(full)
    return /\.stories\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })

const isLabStory = (file: string): boolean => readFileSync(file, 'utf8').includes("title: 'Lab/")

const publishOnly = process.env.STORYBOOK_PUBLIC === '1'

const stories: StorybookConfig['stories'] = publishOnly
  ? collectStoryFiles(SRC_DIR).filter((file) => !isLabStory(file))
  : ['../src/**/*.stories.@(ts|tsx)']

const config: StorybookConfig = {
  stories,
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
