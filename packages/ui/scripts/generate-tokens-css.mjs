/**
 * Build-time codegen: write `dist/tokens.css` from the theme token maps.
 *
 * Runs after `tsup` (which cleans and populates `dist/`), consuming the built
 * generator so the emitted CSS uses the exact same resolved token values as
 * the published design system.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateTokensCss } from '../dist/theme/tokens-css.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, '../dist/tokens.css')

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, generateTokensCss(), 'utf8')

console.log(`Generated ${path.relative(process.cwd(), outputPath)}`)
