import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Token-export guard (TP-16).
 *
 * `@titan-design/react-ui/theme/tokens` is the token-only subpath for consumers
 * that are NOT react-native apps — plain web builds that want `getSemanticColors`
 * and the primitive/semantic token maps and nothing else.
 *
 * The bug this guards: before TP-16 the only subpath carrying `getSemanticColors`
 * was `./theme`, whose entry re-exports the `ThemeProvider` VALUE. That drags in
 * nativewind -> react-native-css-interop, which ships raw JSX in a `.js` file that
 * neither plain Node ESM nor a Vite/rollup build can parse — a web consumer just
 * got a build failure at `react-native-css-interop/dist/doctor.js`. A type-check
 * would never catch it, so this guard is static and structural instead.
 *
 * It walks the SOURCE import graph rooted at the subpath entry and asserts nothing
 * reachable imports react, react-native, nativewind, or gluestack. Source-level
 * (not dist-level) so it runs in the fast project with no build step.
 */

const themeDir = path.dirname(fileURLToPath(import.meta.url))
const uiRoot = path.resolve(themeDir, '..', '..')

const TOKEN_ENTRY = path.join(themeDir, 'tokens', 'index.ts')
const FORBIDDEN = ['react', 'react-dom', 'react-native', 'react-native-web', 'nativewind']

function resolveRelative(fromFile: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(fromFile), specifier)
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

/** Every `from '...'` specifier in a module, ignoring type-only imports (erased at build). */
function importSpecifiers(source: string): string[] {
  const stripped = source.replace(/^\s*(import|export)\s+type\s[^;]*;?$/gm, '')
  const matches = stripped.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]/g)
  return [...matches].map((m) => m[1])
}

/** Walk the source import graph from `entry`, returning every reachable file + bare specifier. */
function collectGraph(entry: string): { files: string[]; bare: string[] } {
  const seen = new Set<string>()
  const bare = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    for (const specifier of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
      if (!specifier.startsWith('.')) {
        bare.add(specifier)
        continue
      }
      const resolved = resolveRelative(file, specifier)
      if (resolved) queue.push(resolved)
    }
  }
  return { files: [...seen], bare: [...bare] }
}

describe('token-only subpath export (TP-16)', () => {
  it('is declared in the package exports map', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(uiRoot, 'package.json'), 'utf8'))
    expect(pkg.exports['./theme/tokens']).toEqual({
      'react-native': './src/theme/tokens/index.ts',
      types: './dist/theme/tokens.d.ts',
      import: './dist/theme/tokens.mjs',
      require: './dist/theme/tokens.js',
    })
  })

  it('has a matching tsup build entry so the dist files actually exist', () => {
    const tsupConfig = fs.readFileSync(path.join(uiRoot, 'tsup.config.ts'), 'utf8')
    expect(tsupConfig).toContain(`'theme/tokens': 'src/theme/tokens/index.ts'`)
  })

  it('reaches no react / react-native / nativewind module in its import graph', () => {
    const { bare } = collectGraph(TOKEN_ENTRY)
    const leaked = bare.filter((s) => FORBIDDEN.some((f) => s === f || s.startsWith(`${f}/`)))
    expect(leaked).toEqual([])
  })

  it('reaches no gluestack module in its import graph', () => {
    const { bare } = collectGraph(TOKEN_ENTRY)
    expect(bare.filter((s) => s.includes('gluestack'))).toEqual([])
  })

  it('exports getSemanticColors returning real token values in both modes', async () => {
    const tokens = await import('./tokens/index')
    for (const mode of ['dark', 'light'] as const) {
      const colors = tokens.getSemanticColors(mode)
      expect(Object.keys(colors).length).toBeGreaterThan(0)
      expect(colors['brand-primary']).toMatch(/^#|^rgba?\(/)
    }
  })
})
