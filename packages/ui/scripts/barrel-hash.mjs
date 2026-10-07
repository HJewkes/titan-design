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
import process from 'node:process'
import { fileURLToPath } from 'node:url'

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

const HASH_FIELD = /("componentBarrelHash": ")[^"]*(")/

/**
 * Rewrite only the `componentBarrelHash` value in the graph file, leaving every other
 * byte (key order, metrics, trailing newline) as committed. A full `arch:graph --reindex`
 * also rewrites metrics for components the change never touched.
 */
export function writeBarrelHash(pkgRoot, graphPath) {
  const source = fs.readFileSync(graphPath, 'utf8')
  if (!HASH_FIELD.test(source)) throw new Error(`no componentBarrelHash field in ${graphPath}`)
  const hash = componentBarrelHash(pkgRoot)
  fs.writeFileSync(graphPath, source.replace(HASH_FIELD, `$1${hash}$2`))
  return hash
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  if (process.argv.includes('--write')) {
    console.log(writeBarrelHash(pkgRoot, path.join(pkgRoot, 'src/arch/arch-graph.json')))
  } else {
    console.log(componentBarrelHash(pkgRoot))
  }
}
