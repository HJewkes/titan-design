// Writes ramps.json and colors.json for the color-system-derivation skill tools
// (cvd-solve.mjs reads RAMPS, audit.mjs reads COLORS). Local tooling, not run in CI.
// Usage: node scripts/export-color-inventory.mjs <output-dir>   (after `pnpm build`)
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HEX = /^#[0-9A-Fa-f]{6}$/
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// `dist/theme/index` imports react-native, which plain Node cannot load; the tokens
// entry in the same directory carries the same colour objects.
const THEME_ENTRY = path.join(PACKAGE_ROOT, 'dist/theme/tokens.mjs')

function byStep(steps) {
  return Object.fromEntries(Object.entries(steps).filter(([, hex]) => HEX.test(hex)))
}

/** Pure: theme objects in, the two JSON values out. Non-hex values (rgba) are skipped. */
export function shapeColorInventory({
  primitiveRamps,
  greyRamp,
  semanticColorsDark,
  semanticColorsLight,
}) {
  const ramps = { ...primitiveRamps, grey: greyRamp }
  const roles = (palette, colors) =>
    Object.entries(colors)
      .filter(([, hex]) => HEX.test(hex))
      .map(([role, hex]) => ({ hex, role, palette }))
  return {
    ramps: {
      ramps: Object.fromEntries(Object.entries(ramps).map(([hue, steps]) => [hue, byStep(steps)])),
    },
    colors: [...roles('dark', semanticColorsDark), ...roles('light', semanticColorsLight)],
  }
}

async function main(outDir) {
  if (!outDir) throw new Error('Usage: export-color-inventory.mjs <output-dir>')
  if (!fs.existsSync(THEME_ENTRY)) {
    throw new Error(`${THEME_ENTRY} is missing. Run \`pnpm build\` in packages/ui first.`)
  }
  const { ramps, colors } = shapeColorInventory(await import(pathToFileURL(THEME_ENTRY).href))
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'ramps.json'), `${JSON.stringify(ramps, null, 2)}\n`)
  fs.writeFileSync(path.join(outDir, 'colors.json'), `${JSON.stringify(colors, null, 2)}\n`)
  console.log(`Wrote ramps.json and colors.json to ${outDir}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2]).catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
