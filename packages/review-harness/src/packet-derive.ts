// packet lint --clone: re-derives a packet's images from git in a local clone. A before image is
// main's blob, a git-sourced after is the head's blob, and every computed diff and every montage is
// rebuilt bit-exact from the two sides. A CI-regenerated after and a CI diff have no git source, so
// they stay trusted on their sha alone. Messages name packet paths and git specs, never the clone.
import { createHash } from 'node:crypto'
import { montageEntry, type CiPacket } from './packet.ts'
import type { CiIo } from './packet-ci.ts'
import { diffImages } from './packet-diff.ts'
import type { PacketLintProblem } from './packet-lint.ts'
import { montage } from './packet-montage.ts'
import { readPng, writePng, type Rgba } from './packet-png.ts'

/** The one git read the re-derivation makes: `git show <spec>` in the clone. */
export type DeriveIo = Pick<CiIo, 'gitBlob'>

/** A named file's bytes, or null when it is missing or not a regular file (the file rules say so). */
export type ReadNamed = (file: string) => Promise<Buffer | null>

type PacketImage = CiPacket['images'][number]
type Side = NonNullable<PacketImage['before']>

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

interface Source {
  rule: 'before-source' | 'after-source'
  side: Side
  ref: string
}

function sourcesOf(image: PacketImage, packet: CiPacket): Source[] {
  const sources: Source[] = []
  if (image.before) sources.push({ rule: 'before-source', side: image.before, ref: packet.mainSha })
  if (image.after && image.source === 'git')
    sources.push({ rule: 'after-source', side: image.after, ref: packet.headSha })
  return sources
}

async function sourceProblem(
  { rule, side, ref }: Source,
  path: string,
  clone: string,
  io: DeriveIo
): Promise<PacketLintProblem | null> {
  const spec = `${ref}:${path}`
  const blob = await io.gitBlob(clone, spec).catch(() => null)
  if (!blob) return { rule, message: `${side.file}: git has no ${spec}` }
  if (sha256(blob) !== side.sha256) return { rule, message: `${side.file} is not git's ${spec}` }
  return null
}

/** Why an image cannot be re-derived; an empty message means the file rules already say why. */
class Underived extends Error {}

async function decodeSide(read: ReadNamed, side: Side | undefined): Promise<Rgba | undefined> {
  if (!side) return undefined
  const bytes = await read(side.file)
  if (!bytes) throw new Underived()
  try {
    return readPng(bytes)
  } catch {
    throw new Underived(`${side.file} is not a readable PNG`)
  }
}

/** The diff the montage shows, after checking the recorded diff against a recompute. */
async function shownDiff(image: PacketImage, before: Rgba, after: Rgba, read: ReadNamed) {
  const result = diffImages(before, after)
  const { diff } = image
  if (result.kind === 'aligned') {
    if (diff) throw new Underived(`${diff.file}: the sides differ in size, so there is no diff`)
    return null
  }
  if (!diff) return null
  if (diff.diffPixels !== result.diffPixels || diff.anyChannelPixels !== result.anyChannelPixels)
    throw new Underived(`${diff.file}: the recorded pixel counts are not the recomputed ones`)
  if (diff.source === 'computed') {
    if (sha256(writePng(result.image)) !== diff.sha256)
      throw new Underived(`${diff.file} is not the recomputed diff`)
    return result.image
  }
  return decodeSide(read, { ...diff, width: after.width, height: after.height })
}

async function derivedProblem(image: PacketImage, read: ReadNamed): Promise<string | null> {
  try {
    const before = await decodeSide(read, image.before)
    const after = await decodeSide(read, image.after)
    const shown = before && after ? await shownDiff(image, before, after, read) : null
    if (sha256(montage(montageEntry(before, after, shown))) !== image.sha256)
      return `${image.file} is not the montage of its before, after and diff`
    return null
  } catch (err) {
    if (err instanceof Underived) return err.message || null
    throw err
  }
}

/** Every way the packet's images differ from what git in `clone` and a recompute give. */
export async function deriveProblems(
  packet: CiPacket,
  clone: string,
  read: ReadNamed,
  io: DeriveIo
): Promise<PacketLintProblem[]> {
  const problems: PacketLintProblem[] = []
  for (const image of packet.images) {
    for (const source of sourcesOf(image, packet)) {
      const problem = await sourceProblem(source, image.path, clone, io)
      if (problem) problems.push(problem)
    }
    const derived = await derivedProblem(image, read)
    if (derived) problems.push({ rule: 'derived', message: derived })
  }
  return problems
}
