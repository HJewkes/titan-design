// Sorts one CI layer's baselines into unchanged, changed, new and removed by comparing the files a
// run regenerated with main's tree. Equality is the git blob id, so main's bytes need no reading.
import { createHash } from 'node:crypto'
import { basename } from 'node:path'
import type { FrameChange } from '@titan-design/review-schema'

/** Only Linux Chromium shots are baselines; spec files and other platforms ride along in artifacts. */
export const BASELINE_SUFFIX = '-chromium-linux.png'

export type ShownChange = Exclude<FrameChange, 'unchanged'>

export interface Classified {
  /** Every shown baseline by repo path, sorted by path. */
  shown: { path: string; change: ShownChange }[]
  unchanged: number
}

export function isBaseline(path: string): boolean {
  return path.endsWith(BASELINE_SUFFIX)
}

/** The file name without `-chromium-linux.png`, as Playwright names its `-diff` and `-expected` files. */
export function stemOf(path: string): string {
  const name = basename(path)
  return isBaseline(name) ? name.slice(0, -BASELINE_SUFFIX.length) : name
}

/** The id git gives `bytes` as a blob: sha1 of `blob <length>\0` followed by the bytes. */
export function gitBlobId(bytes: Buffer): string {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

/**
 * `mainBlobs` maps main's repo paths to blob ids; `artifactFiles` maps the run's repo paths to
 * bytes. A layer that was not regenerated has no artifact, so it shows nothing rather than every
 * main baseline as removed.
 */
export function classify(
  mainBlobs: ReadonlyMap<string, string>,
  artifactFiles: ReadonlyMap<string, Buffer>,
  regenerated: boolean
): Classified {
  if (!regenerated) return { shown: [], unchanged: 0 }
  const shown: Classified['shown'] = []
  let unchanged = 0
  for (const [path, bytes] of artifactFiles) {
    if (!isBaseline(path)) continue
    const mainBlob = mainBlobs.get(path)
    if (mainBlob === undefined) shown.push({ path, change: 'new' })
    else if (mainBlob === gitBlobId(bytes)) unchanged++
    else shown.push({ path, change: 'changed' })
  }
  for (const path of mainBlobs.keys())
    if (isBaseline(path) && !artifactFiles.has(path)) shown.push({ path, change: 'removed' })
  shown.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  return { shown, unchanged }
}
