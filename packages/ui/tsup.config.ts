import { defineConfig } from 'tsup'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'theme/index': 'src/theme/index.ts',
    'theme/tokens-css': 'src/theme/tokens-css.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react-native',
    'react-native-web',
    'lucide-react',
    'lucide-react-native',
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
