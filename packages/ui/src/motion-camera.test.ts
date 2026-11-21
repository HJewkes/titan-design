import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as entry from './motion-camera'

const srcDir = path.dirname(fileURLToPath(import.meta.url))
const FROM =
  /(?:^|\n)\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g

function resolveSource(from: string, specifier: string): string {
  const base = path.resolve(path.dirname(from), specifier)
  const candidates = [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]
  const found = candidates.find((file) => fs.existsSync(file))
  if (!found) throw new Error(`cannot resolve ${specifier} from ${from}`)
  return found
}

/** Every bare package specifier reachable from `file` through relative imports. */
function packagesReachableFrom(file: string, seen = new Set<string>()): Set<string> {
  const packages = new Set<string>()
  if (seen.has(file)) return packages
  seen.add(file)
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(FROM)) {
    const specifier = match[1] ?? match[2]
    if (specifier.startsWith('.')) {
      packagesReachableFrom(resolveSource(file, specifier), seen).forEach((p) => packages.add(p))
    } else {
      packages.add(specifier)
    }
  }
  return packages
}

describe('the ./motion/camera entry', () => {
  it('imports nothing from react or react-native, directly or through a relative import', () => {
    const packages = packagesReachableFrom(path.join(srcDir, 'motion-camera.ts'))

    expect([...packages].filter((name) => /^(react|react-native)(\/|$)/.test(name))).toEqual([])
  })

  it('exposes the camera, its declared motion and the frame helpers', () => {
    expect(Object.keys(entry).sort()).toEqual([
      'CAMERA_MOTION',
      'camera',
      'fitBox',
      'project',
      'unproject',
    ])
  })
})
