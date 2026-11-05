import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { isEntryPoint } from './lib/entry.mjs'

/**
 * Writes the `manifest.json` of a `pr-visual-<head sha>` artifact (TP-1697), in the shape
 * Shepherd's `PrVisualManifestSchema` reads. A shot captured on one side only is dropped and named
 * in `reason`, so the manifest never offers an after-only image: a change shown without its
 * before cannot be judged.
 */
const SHOT_FILE = /^(.+)@(\d+)\.png$/

function parseShots(files) {
  const shots = new Map()
  for (const file of files) {
    const match = SHOT_FILE.exec(file)
    if (match) shots.set(file, { story: match[1], width: match[2] })
  }
  return shots
}

function pairShots(before, after) {
  const [beforeShots, afterShots] = [parseShots(before), parseShots(after)]
  const files = [...new Set([...beforeShots.keys(), ...afterShots.keys()])].sort()
  const shots = []
  const dropped = []
  for (const file of files) {
    if (beforeShots.has(file) && afterShots.has(file))
      shots.push({ ...beforeShots.get(file), before: `before/${file}`, after: `after/${file}` })
    else dropped.push(`${file} (${beforeShots.has(file) ? 'before' : 'after'} only)`)
  }
  return { shots, dropped }
}

/**
 * The manifest for one run. `selection` is what `storiesFor` chose, or undefined when selection
 * never ran; `before` and `after` are the PNG file names each side captured.
 */
export function buildManifest({ repo, pr, baseSha, headSha, selection, before, after }) {
  const header = { v: 1, repo, pr, baseSha, headSha }
  if (!selection)
    return { ...header, rendered: false, reason: 'story selection did not run', shots: [] }
  if (selection.storyIds.length === 0)
    return { ...header, rendered: false, reason: selection.reason, shots: [] }
  const { shots, dropped } = pairShots(before, after)
  const droppedNote = dropped.length > 0 ? `dropped one-sided shots: ${dropped.join(', ')}` : ''
  if (shots.length === 0) {
    const reason = ['no story rendered on both sides', droppedNote].filter(Boolean).join('; ')
    return { ...header, rendered: false, reason, shots: [] }
  }
  return { ...header, rendered: true, ...(droppedNote && { reason: droppedNote }), shots }
}

const listPngs = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')) : []

function main() {
  const { OUT_DIR, STORIES_FILE, GITHUB_REPOSITORY, PR_NUMBER, BASE_SHA, HEAD_SHA } = process.env
  const manifest = buildManifest({
    repo: GITHUB_REPOSITORY,
    pr: Number(PR_NUMBER),
    baseSha: BASE_SHA,
    headSha: HEAD_SHA,
    selection: existsSync(STORIES_FILE)
      ? JSON.parse(readFileSync(STORIES_FILE, 'utf8'))
      : undefined,
    before: listPngs(join(OUT_DIR, 'before')),
    after: listPngs(join(OUT_DIR, 'after')),
  })
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`pr-visual-manifest: rendered=${manifest.rendered}, ${manifest.shots.length} shots`)
  if (manifest.reason) console.log(`pr-visual-manifest: ${manifest.reason}`)
}

if (isEntryPoint(import.meta.url, process.argv[1])) main()
