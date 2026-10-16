import path from 'node:path'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { defineConfig, transformWithEsbuild, type Alias, type Plugin } from 'vite'
import tailwindConfig from '../../tailwind.config.js'
import { NO_RNW_ALIAS_MODE } from './build-modes'

const PAGE_DIR = path.join(__dirname, 'page')
const SRC_DIR = path.join(__dirname, '..', '..', 'src')

/**
 * The one alias the page cannot build without: react-ui imports `react-native`, and on the web that
 * is react-native-web. Exact match only: react-ui imports no react-native subpath.
 */
const RNW_ALIAS: Alias = { find: /^react-native$/, replacement: 'react-native-web' }

/**
 * react-native-css-interop (nativewind's runtime) ships JSX in `dist/doctor.js`. The dev server's
 * dep optimizer parses `.js` as JSX (see the specimen config); a production build never runs it.
 */
function cssInteropDoctorJsx(): Plugin {
  return {
    name: 'css-interop-doctor-jsx',
    enforce: 'pre',
    transform(code, id) {
      if (!/react-native-css-interop[\\/]dist[\\/]doctor\.js$/.test(id)) return null
      return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' })
    },
  }
}

/**
 * The capture page (TD-845), at its smallest: the RNW alias, nativewind as the JSX runtime so
 * `className` compiles to styles, and Tailwind over react-ui's source. The six components need
 * none of the svg resolution Storybook carries; a page that renders an svg-backed component adds it. The `no-rnw-alias` mode exists
 * only for the test that proves the page needs the alias.
 */
export default defineConfig(({ mode }) => ({
  root: PAGE_DIR,
  base: './',
  logLevel: 'warn',
  plugins: [cssInteropDoctorJsx(), react({ jsxImportSource: 'nativewind' })],
  resolve: {
    alias: mode === NO_RNW_ALIAS_MODE ? [] : [RNW_ALIAS],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          ...tailwindConfig,
          content: [`${SRC_DIR}/**/*.{ts,tsx}`, `${PAGE_DIR}/*.tsx`],
        }),
        autoprefixer(),
      ],
    },
  },
  build: { emptyOutDir: true, chunkSizeWarningLimit: 4096 },
}))
