import { createRequire } from 'node:module'
import { dirname, resolve as resolvePath } from 'node:path'
import { existsSync } from 'node:fs'
import type { Alias, Plugin } from 'vite'

const require = createRequire(import.meta.url)
// esbuild ships nested under vite in the pnpm store; resolve it from there.
const esbuild = createRequire(require.resolve('vite'))('esbuild') as typeof import('esbuild')

/** Absolute path to react-native-svg's ESM ("module") build entry. */
export const svgModuleEntry = (() => {
  try {
    return resolvePath(
      dirname(require.resolve('react-native-svg/package.json')),
      'lib/module/index.js'
    )
  } catch {
    return 'react-native-svg'
  }
})()

/**
 * react-native-svg ships web implementations as `.web.js` siblings of its
 * native (Flow) Fabric sources and relies on a bundler's React Native
 * platform-extension resolution to pick them. Node-based resolvers never honor
 * `.web.js`, so its relative imports would load the native Flow files
 * (`Unexpected token 'typeof'`). The bare specifier is aliased to the ESM build
 * (see svgWebAliases); this plugin rewrites each relative import inside the
 * package to its `.web.js` sibling when one exists.
 */
export function reactNativeSvgWebResolver(): Plugin {
  return {
    name: 'react-native-svg-web-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      // Path-bounded match: only the real package dir (.../node_modules/react-native-svg/...)
      // contains '/react-native-svg/'. pnpm peer-hash dirs encode it as
      // 'react-native-svg@<version>' (e.g. lucide-react-native's hash), so a bare
      // substring would over-match and rewrite their relative imports too.
      if (!importer || !importer.includes('/react-native-svg/') || !source.startsWith('.')) {
        return null
      }
      const base = resolvePath(dirname(importer), source)
      for (const candidate of [`${base}.web.js`, `${base}/index.web.js`]) {
        if (existsSync(candidate)) return candidate
      }
      return null
    },
  }
}

/**
 * react-native-body-highlighter@3.2.0 ships untranspiled JSX inside a CommonJS
 * dist whose `require('react-native-svg')` would, under a Node resolver, load
 * react-native-svg's native Flow sources. Bundle the package entry to a single
 * self-contained ESM module with esbuild — JSX compiled via the automatic
 * runtime, react-native-svg's WEB build inlined, react/react-native external.
 */
export function reactNativeBodyHighlighterEsm(): Plugin {
  let entry: string | null = null
  try {
    entry = require.resolve('react-native-body-highlighter')
  } catch {
    entry = null
  }
  return {
    name: 'react-native-body-highlighter-esm',
    enforce: 'pre',
    async transform(_code, id) {
      if (!entry || id.split('?')[0] !== entry) return null
      const result = await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        jsx: 'automatic',
        loader: { '.js': 'jsx' },
        alias: { 'react-native-svg': svgModuleEntry },
        resolveExtensions: [
          '.web.js',
          '.web.ts',
          '.web.tsx',
          '.web.jsx',
          '.js',
          '.ts',
          '.tsx',
          '.jsx',
          '.json',
        ],
        mainFields: ['module', 'main'],
        external: ['react', 'react/jsx-runtime', 'react-native'],
        write: false,
        logLevel: 'silent',
      })
      return { code: result.outputFiles[0].text, map: null }
    },
  }
}

/** Alias entries that point react-native(-svg) at their web builds. */
export const svgWebAliases: Alias[] = [{ find: /^react-native-svg$/, replacement: svgModuleEntry }]

/**
 * `.web.*`-first extension order so web platform files win over native. The
 * remainder mirrors Vite's default extension order, so using this as a full
 * replacement stays equivalent to "web-prepended defaults" — preserving `.mjs`
 * priority and `.mts`, which a hand-trimmed list would otherwise drop.
 */
export const webResolveExtensions = [
  '.web.tsx',
  '.web.ts',
  '.web.jsx',
  '.web.js',
  '.mjs',
  '.js',
  '.mts',
  '.ts',
  '.jsx',
  '.tsx',
  '.json',
]
