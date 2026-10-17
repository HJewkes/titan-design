// Checks a CI artifact zip before unzip touches it. Artifacts come from PR-controlled CI, so the
// central directory is read in code first: no links, no paths out of the directory, and a cap on
// the bytes it declares. readPngTree enforces the same cap on what actually landed.
import { ReviewError } from './review.ts'

/**
 * The largest real artifact (storybook-visual-baselines, 199 PNGs) is 13.5 MB zipped, and PNGs barely
 * compress, so it unpacks to about 14 MB. 128 MB leaves about 9x headroom for the story set to grow
 * while bounding what one hostile artifact can put on disk.
 */
export const ARTIFACT_LIMITS = { maxTotalBytes: 128 * 1024 * 1024 }

const EOCD_SIG = 0x06054b50
const CEN_SIG = 0x02014b50
const EOCD_BYTES = 22
const CEN_BYTES = 46
const MAX_COMMENT = 0xffff
const MADE_BY_UNIX = 3
const S_IFMT = 0o170000
const S_IFLNK = 0o120000

export interface ZipEntry {
  name: string
  size: number
  isLink: boolean
}

function endOfCentralDirectory(zip: Buffer): number {
  const floor = Math.max(0, zip.length - EOCD_BYTES - MAX_COMMENT)
  for (let at = zip.length - EOCD_BYTES; at >= floor; at--)
    if (zip.readUInt32LE(at) === EOCD_SIG) return at
  throw new ReviewError('artifact is not a zip: no end of central directory')
}

function entryAt(zip: Buffer, at: number): { entry: ZipEntry; next: number } {
  if (at + CEN_BYTES > zip.length || zip.readUInt32LE(at) !== CEN_SIG)
    throw new ReviewError('artifact zip has a broken central directory')
  const size = zip.readUInt32LE(at + 24)
  if (size === 0xffffffff) throw new ReviewError('artifact zip uses zip64, which is refused')
  const nameEnd = at + CEN_BYTES + zip.readUInt16LE(at + 28)
  const mode = zip.readUInt32LE(at + 38) >>> 16
  const isUnix = zip.readUInt16LE(at + 4) >> 8 === MADE_BY_UNIX
  return {
    entry: {
      name: zip.toString('utf8', at + CEN_BYTES, nameEnd),
      size,
      isLink: isUnix && (mode & S_IFMT) === S_IFLNK,
    },
    next: nameEnd + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32),
  }
}

/** Every entry the central directory lists, as unzip will see them. */
export function zipEntries(zip: Buffer): ZipEntry[] {
  const eocd = endOfCentralDirectory(zip)
  const entries: ZipEntry[] = []
  let at = zip.readUInt32LE(eocd + 16)
  for (let i = 0; i < zip.readUInt16LE(eocd + 10); i++) {
    const { entry, next } = entryAt(zip, at)
    entries.push(entry)
    at = next
  }
  return entries
}

const escapes = (name: string) => name.startsWith('/') || name.split(/[/\\]/).includes('..')

/** Refuses a link, a path out of the directory, or more than the cap in declared bytes. */
export function checkArchive(zip: Buffer, limits = ARTIFACT_LIMITS): void {
  const entries = zipEntries(zip)
  const link = entries.find((e) => e.isLink)
  if (link) throw new ReviewError(`artifact zip holds a symlink, ${link.name}; refused`)
  const outside = entries.find((e) => escapes(e.name))
  if (outside) throw new ReviewError(`artifact zip path ${outside.name} leaves its directory`)
  const total = entries.reduce((sum, e) => sum + e.size, 0)
  if (total > limits.maxTotalBytes)
    throw new ReviewError(
      `artifact zip declares ${total} bytes, over the ${limits.maxTotalBytes}-byte cap`
    )
}
