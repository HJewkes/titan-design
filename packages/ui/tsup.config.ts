import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'theme/index': 'src/theme/index.ts',
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
    'nativewind',
    'react-native-css-interop',
  ],
  treeshake: true,
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = 'nativewind'
  },
})
