/* eslint-disable no-undef -- Node ESM build tool */
/**
 * Shared output policy for the exporters: write to a gitignored directory by
 * default, and refuse any target git tracks, so real data never lands in the repo.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const TOOLS_DIR = path.dirname(new URL(import.meta.url).pathname)

export const DEFAULT_OUT_DIR = path.join(TOOLS_DIR, '..', '.private-out')

export function defaultOutPath(fileName) {
  return path.join(DEFAULT_OUT_DIR, fileName)
}

export function isTracked(target) {
  const abs = path.resolve(target)
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', path.basename(abs)], {
      cwd: path.dirname(abs),
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

/** Returns the resolved path, creating its directory, or throws if git tracks it. */
export function prepareOutPath(target) {
  const abs = path.resolve(target)
  mkdirSync(path.dirname(abs), { recursive: true })
  if (isTracked(abs))
    throw new Error(`refusing to overwrite tracked file ${abs}; pass an untracked --out path`)
  return abs
}

export function runMain(run) {
  return run().catch((e) => {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  })
}
