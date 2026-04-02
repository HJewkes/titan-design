import { defineConfig } from 'tsup'
import path from 'path'
import type { Plugin } from 'esbuild'

/**
 * esbuild plugin that intercepts nativewind/jsx-runtime imports
 * and redirects them to our custom web JSX runtime files.
 *
 * esbuild generates these imports because jsxImportSource is set
 * to 'nativewind'. The plugin resolves them to local TypeScript
 * files which get inlined into the bundle — so the final dist
 * only depends on react/jsx-runtime, not nativewind.
 */
const webJsxRuntimePlugin: Plugin = {
  name: 'web-jsx-runtime',
  setup(build) {
    const runtimeMap: Record<string, string> = {
      'nativewind/jsx-runtime': path.resolve('src/jsx-runtime-web.ts'),
      'nativewind/jsx-dev-runtime': path.resolve('src/jsx-dev-runtime-web.ts'),
    }
    build.onResolve({ filter: /^nativewind\/jsx(-dev)?-runtime$/ }, (args) => {
      const resolved = runtimeMap[args.path]
      if (resolved) return { path: resolved }
    })
  },
}

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
  ],
  treeshake: true,
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = 'nativewind'
  },
  esbuildPlugins: [webJsxRuntimePlugin],
})
