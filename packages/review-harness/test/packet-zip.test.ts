import { access, mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import zlib from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { readPngTree, unpackArtifact } from '../src/packet-ci.ts'
import { checkArchive, zipEntries } from '../src/packet-zip.ts'
import { png, tempDir } from './packet-fake.ts'

interface FakeEntry {
  name: string
  data: Buffer
  /** Unix mode; a regular file unless set. */
  mode?: number
}

const FILE = 0o100644
const LINK = 0o120777

/** A stored (uncompressed) zip, made by Unix, that unzip reads as written. */
function storedZip(entries: FakeEntry[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const { name, data, mode = FILE } of entries) {
    const nameBytes = Buffer.from(name)
    const crc = zlib.crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE((3 << 8) | 20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt32LE(mode * 0x10000, 38)
    central.writeUInt32LE(offset, 42)
    locals.push(local, nameBytes, data)
    centrals.push(central, nameBytes)
    offset += local.length + nameBytes.length + data.length
  }
  const directory = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}

const SHOT = 'x.test.ts-snapshots/a-chromium-linux.png'
const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false
  )

describe('artifact zip check', () => {
  it('lists each entry with its declared size', () => {
    const zip = storedZip([{ name: SHOT, data: png(4, 4) }])

    expect(zipEntries(zip)).toEqual([{ name: SHOT, size: png(4, 4).length, isLink: false }])
  })

  it('refuses a zip holding a symlink', () => {
    const zip = storedZip([
      { name: SHOT, data: png(4, 4) },
      { name: 'evil.png', data: Buffer.from('/etc/passwd'), mode: LINK },
    ])

    expect(() => checkArchive(zip)).toThrow('holds a symlink, evil.png')
  })

  it('refuses a path that climbs out of the directory', () => {
    const zip = storedZip([{ name: '../outside.png', data: png(4, 4) }])

    expect(() => checkArchive(zip)).toThrow('leaves its directory')
  })

  it('refuses a zip declaring more bytes than the cap', () => {
    const zip = storedZip([
      { name: 'a-chromium-linux.png', data: Buffer.alloc(600) },
      { name: 'b-chromium-linux.png', data: Buffer.alloc(600) },
    ])

    expect(() => checkArchive(zip, { maxTotalBytes: 1000 })).toThrow('over the 1000-byte cap')
    expect(() => checkArchive(zip, { maxTotalBytes: 1200 })).not.toThrow()
  })

  it('refuses bytes that are not a zip', () => {
    expect(() => checkArchive(Buffer.from('not a zip'))).toThrow('not a zip')
  })
})

describe('unpackArtifact', () => {
  it('unzips a checked artifact into its directory', async () => {
    const dir = join(await tempDir(), 'artifact')

    await unpackArtifact(storedZip([{ name: SHOT, data: png(4, 4) }]), dir)

    expect(await readFile(join(dir, SHOT))).toEqual(png(4, 4))
  })

  it('never runs unzip on a zip holding a symlink', async () => {
    const dir = join(await tempDir(), 'artifact')
    const zip = storedZip([{ name: 'evil.png', data: Buffer.from('/etc/passwd'), mode: LINK }])

    await expect(unpackArtifact(zip, dir)).rejects.toThrow('symlink')
    expect(await exists(dir)).toBe(false)
  })
})

describe('readPngTree', () => {
  it('refuses a tree holding more PNG bytes than the cap', async () => {
    const dir = await tempDir()
    await writeFile(join(dir, 'a.png'), Buffer.alloc(600))
    await writeFile(join(dir, 'b.png'), Buffer.alloc(600))

    await expect(readPngTree(dir, { maxTotalBytes: 1000 })).rejects.toThrow('artifact cap')
    expect((await readPngTree(dir, { maxTotalBytes: 1200 })).size).toBe(2)
  })

  it('skips a symlink that landed in the tree', async () => {
    const dir = await tempDir()
    const outside = join(await tempDir(), 'secret.png')
    await writeFile(outside, png(4, 4))
    await mkdir(join(dir, 'sub'))
    await symlink(outside, join(dir, 'sub', 'link.png'))

    expect([...(await readPngTree(dir)).keys()]).toEqual([])
  })
})
