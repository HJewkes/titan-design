import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  STORYBOOK_SCHEMA,
  buildStorybook,
  readTreeState,
  repoName,
  type StorybookBuildIo,
} from '../src/storybook-build.ts'

const SHA = 'c'.repeat(40)
const BUILT_AT = Date.UTC(2026, 0, 2, 3, 4, 5)

const INDEX = JSON.stringify({
  v: 5,
  entries: {
    'components-atoms-button--default': { type: 'story' },
    'components-atoms-button--docs': { type: 'docs' },
    'custom-demo-card--default': { type: 'story' },
  },
})

/** A tiny static build: nested dirs, names that sort differently by segment and by path. */
const FIXTURE: Record<string, string> = {
  'index.json': INDEX,
  'iframe.html': '<!doctype html><title>iframe</title>',
  'assets/main-abc123.js': 'console.log("main")',
  'assets/z/deep.css': 'body{}',
  'assets-extra.txt': 'not inside assets/',
}

async function writeTree(root: string, files: Record<string, string>) {
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), text)
  }
}

function fakeIo(build: StorybookBuildIo['build'], calls: string[][] = []): StorybookBuildIo {
  const ticks = [BUILT_AT - 42_000, BUILT_AT]
  return {
    build: async (tree, outDir) => {
      calls.push([tree, outDir])
      await build(tree, outDir)
    },
    treeState: async () => ({ sha: SHA, dirty: false, repo: 'owner/name' }),
    storybookVersion: async () => '10.2.0',
    now: () => ticks.shift() ?? BUILT_AT,
  }
}

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

describe('titan-review build --storybook-build', () => {
  it('storybook.json lists every built file, sorted by path, with its sha256 and size', async () => {
    const roundDir = await mkdtemp(join(tmpdir(), 'titan-sb-'))
    const calls: string[][] = []
    const io = fakeIo((_tree, outDir) => writeTree(outDir, FIXTURE), calls)

    const { sidecar, path, elapsedMs } = await buildStorybook('/checkouts/tree', roundDir, io)

    const staticDir = join(roundDir, 'storybook', 'static')
    expect(calls).toEqual([['/checkouts/tree', staticDir]])
    const expected = Object.keys(FIXTURE)
      .sort()
      .map((p) => ({ path: p, sha256: sha256(FIXTURE[p]), bytes: Buffer.byteLength(FIXTURE[p]) }))
    expect(sidecar.files).toEqual(expected)
    expect(sidecar).toMatchObject({
      schema: STORYBOOK_SCHEMA,
      repo: 'owner/name',
      sha: SHA,
      dirty: false,
      builtAt: '2026-01-02T03:04:05.000Z',
      storybookVersion: '10.2.0',
      storyIds: 2,
    })
    expect(elapsedMs).toBe(42_000)
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(sidecar)
  })

  it('a rebuild drops the files of the earlier build', async () => {
    const roundDir = await mkdtemp(join(tmpdir(), 'titan-sb-'))
    await buildStorybook(
      '/t',
      roundDir,
      fakeIo((_t, out) => writeTree(out, FIXTURE))
    )
    const second = { 'index.json': INDEX }

    const { sidecar } = await buildStorybook(
      '/t',
      roundDir,
      fakeIo((_t, out) => writeTree(out, second))
    )

    expect(sidecar.files.map((f) => f.path)).toEqual(['index.json'])
    expect(await readdir(join(roundDir, 'storybook', 'static'))).toEqual(['index.json'])
  })

  it('a symlink in the build refuses it and writes no storybook.json', async () => {
    const roundDir = await mkdtemp(join(tmpdir(), 'titan-sb-'))
    const io = fakeIo(async (_tree, outDir) => {
      await writeTree(outDir, { 'index.json': INDEX })
      await symlink('/etc/hosts', join(outDir, 'hosts'))
    })

    await expect(buildStorybook('/t', roundDir, io)).rejects.toThrow(/non-file at hosts/)
    expect(await readdir(join(roundDir, 'storybook'))).toEqual(['static'])
  })

  it('a build that writes no index.json is refused', async () => {
    const roundDir = await mkdtemp(join(tmpdir(), 'titan-sb-'))
    const io = fakeIo((_tree, outDir) => writeTree(outDir, { 'iframe.html': '' }))

    await expect(buildStorybook('/t', roundDir, io)).rejects.toThrow(/no index.json/)
  })
})

function git(tree: string, ...args: string[]) {
  return execFileSync('git', ['-C', tree, ...args], { encoding: 'utf8' }).trim()
}

async function committedTree() {
  const tree = await mkdtemp(join(tmpdir(), 'titan-sb-tree-'))
  git(tree, 'init', '--quiet')
  git(tree, 'remote', 'add', 'origin', 'git@github.com:owner/name.git')
  await writeFile(join(tree, 'tracked.txt'), 'one\n')
  git(tree, 'add', 'tracked.txt')
  git(tree, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '--quiet', '-m', 'c')
  return tree
}

describe('the tree state a build records', () => {
  it('a clean tree is not dirty, and names its HEAD and origin', async () => {
    const tree = await committedTree()

    expect(await readTreeState(tree)).toEqual({
      sha: git(tree, 'rev-parse', 'HEAD'),
      dirty: false,
      repo: 'owner/name',
    })
  })

  it('an uncommitted edit to a tracked file makes the build dirty', async () => {
    const tree = await committedTree()
    await writeFile(join(tree, 'tracked.txt'), 'two\n')

    expect((await readTreeState(tree)).dirty).toBe(true)
  })

  it('an untracked file makes the build dirty', async () => {
    const tree = await committedTree()
    await writeFile(join(tree, 'new.txt'), 'new\n')

    expect((await readTreeState(tree)).dirty).toBe(true)
  })

  it('reads owner/name from https and ssh remotes', () => {
    expect(repoName('https://github.com/owner/name.git')).toBe('owner/name')
    expect(repoName('https://github.com/owner/name')).toBe('owner/name')
    expect(repoName('git@github.com:owner/name.git')).toBe('owner/name')
  })
})
