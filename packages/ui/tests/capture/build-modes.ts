import path from 'node:path'
import type { InlineConfig } from 'vite'

/** The Vite mode that builds the page without the react-native → react-native-web alias. */
export const NO_RNW_ALIAS_MODE = 'no-rnw-alias'

export const CONFIG_FILE = path.join(__dirname, 'vite.config.ts')

/** The page build into `outDir`; `mode` picks the alias mutation. */
export function pageBuild(outDir: string, mode = 'production'): InlineConfig {
  // The no-alias build is expected to fail; its error is asserted, so Vite need not log it.
  const logLevel = mode === NO_RNW_ALIAS_MODE ? 'silent' : undefined
  return { configFile: CONFIG_FILE, mode, logLevel, build: { outDir } }
}
