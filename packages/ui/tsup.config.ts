import { defineConfig } from 'tsup'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    bodymap: 'src/bodymap.ts',
    pages: 'src/pages.ts',
    'theme/index': 'src/theme/index.ts',
    'theme/tokens': 'src/theme/tokens/index.ts',
    'theme/tokens-css': 'src/theme/tokens-css.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  // Self-contained entries (no shared ESM chunks). Code-splitting merged the
  // nativewind-importing ThemeProvider into a theme-utils chunk that the root
  // entry also pulled, re-leaking nativewind into `@titan-design/react-ui` even
  // after ThemeProvider left the root barrel. Without splitting, each entry only
  // bundles what it imports, so the root stays nativewind-free (as CJS already
  // was) and ThemeProvider's nativewind chain is confined to the /theme entry.
  splitting: false,
  external: [
    'react',
    'react-dom',
    'react-native',
    'react-native-web',
  ],
  treeshake: true,
  esbuildOptions(options) {
    options.jsx = 'automatic'
    // Point JSX transform at our custom web runtime instead of nativewind.
    // esbuild appends /jsx-runtime to this path, resolving to
    // src/web-jsx/jsx-runtime.ts which converts className to $$css style
    // objects that RNW's styleq understands. This is inlined into the bundle
    // so the final dist only depends on react/jsx-runtime, not nativewind.
    options.jsxImportSource = path.resolve(__dirname, 'src/web-jsx')
  },
})
