/**
 * The freshness key for `src/arch/arch-graph.json`.
 *
 * A barrel (`index.ts`) is what admits a component to the graph, so the set of
 * barrels plus their contents is the smallest input whose change means the graph
 * is out of date. Deliberately a CONTENT hash, not an mtime: CI checks out fresh
 * and every mtime is the checkout time, so an mtime comparison always passes.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

function barrelPaths(dir, root, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) barrelPaths(abs, root, acc)
    else if (entry.name === 'index.ts') acc.push(path.relative(root, abs))
  }
  return acc.sort()
}

/** sha256 over every `index.ts` under `<pkgRoot>/src/components`, path-sorted. */
export function componentBarrelHash(pkgRoot) {
  const componentsDir = path.join(pkgRoot, 'src/components')
  const hash = crypto.createHash('sha256')
  for (const rel of barrelPaths(componentsDir, pkgRoot)) {
    hash.update(rel)
    hash.update('\0')
    hash.update(fs.readFileSync(path.join(pkgRoot, rel)))
    hash.update('\0')
  }
  return `sha256:${hash.digest('hex')}`
}
