import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadCsf } from 'storybook/internal/csf-tools'

/**
 * The Layer-2 visual coverage manifest: which stories must have a committed baseline.
 * `visual-coverage.test.ts` checks it against the snapshot directory.
 */
export const REQUIRED_PREFIXES = [
  'shell-',
  'foundations-icons--',
  'custom-workout-mesoprogressbar--',
] as const

export const BASELINE_SUFFIX = '-chromium-linux.png'

const collectStoryFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return collectStoryFiles(full)
    return /\.stories\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })

const requireTitle = (fileName: string) => (title: string) => {
  if (!title) throw new Error(`${fileName} has no explicit story title`)
  return title
}

/** Story ids as Storybook's indexer derives them, parsed statically from every story file. */
export function collectStoryIds(srcDir: string): string[] {
  return collectStoryFiles(srcDir).flatMap((fileName) => {
    const csf = loadCsf(readFileSync(fileName, 'utf8'), {
      fileName,
      makeTitle: requireTitle(fileName),
    }).parse()
    return csf.stories.map((story) => story.id)
  })
}

/** Story ids under a required prefix with no `<id>-chromium-linux.png` among the snapshot names. */
export function findMissingBaselines(
  storyIds: readonly string[],
  snapshotFiles: readonly string[],
  required: readonly string[] = REQUIRED_PREFIXES
): string[] {
  const present = new Set(snapshotFiles)
  return storyIds.filter(
    (id) => required.some((prefix) => id.startsWith(prefix)) && !present.has(id + BASELINE_SUFFIX)
  )
}

/** Snapshots only the pinned Linux container may produce; anything else (darwin, unsuffixed) is misnamed. */
export function findMisnamedSnapshots(snapshotFiles: readonly string[]): string[] {
  return snapshotFiles.filter((file) => !file.endsWith(BASELINE_SUFFIX))
}
