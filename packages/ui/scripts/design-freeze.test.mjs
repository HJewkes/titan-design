import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const extraction = vi.hoisted(() => ({ manifest: vi.fn(), launch: vi.fn() }))

vi.mock('./extract-css-properties.mjs', async (importOriginal) => ({
  ...(await importOriginal()),
  extractCssPropertyManifest: extraction.manifest,
}))
vi.mock('@playwright/test', () => ({ chromium: { launch: extraction.launch } }))

const { runDesignFreeze } = await import('./design-freeze.mjs')

const FREEZE = { htmlPath: 'proto.html', selector: '.dot', component: 'dot', version: '1' }

const fakeBrowser = (outerHtml) => ({
  newPage: async () => ({
    goto: async () => {},
    waitForSelector: async () => {},
    evaluate: async () => outerHtml,
  }),
  close: async () => {},
})

let repo
let savedGitEnv

const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
const tags = () => git('tag', '--list').trim()

// Inherited GIT_DIR / GIT_WORK_TREE would point the script's `git tag` at the real checkout.
function isolateFromAmbientGit() {
  savedGitEnv = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('GIT_'))
  )
  for (const key of Object.keys(savedGitEnv)) delete process.env[key]
}

beforeEach(() => {
  isolateFromAmbientGit()
  repo = mkdtempSync(path.join(tmpdir(), 'design-freeze-'))
  git('init', '-q')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('config', 'commit.gpgSign', 'false')
  git('config', 'tag.gpgSign', 'false')
  writeFileSync(path.join(repo, FREEZE.htmlPath), '<div class="dot"></div>')
  git('add', FREEZE.htmlPath)
  git('commit', '-q', '-m', 'Add prototype')
  extraction.manifest.mockResolvedValue({ component: 'dot', properties: [] })
  extraction.launch.mockResolvedValue(fakeBrowser('<div class="dot"></div>'))
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
  Object.assign(process.env, savedGitEnv)
  vi.clearAllMocks()
})

describe('runDesignFreeze', () => {
  it('creates no tag when the manifest extraction throws', async () => {
    extraction.manifest.mockRejectedValue(new Error('No element matched selector: .dot'))

    await expect(runDesignFreeze({ ...FREEZE, cwd: repo })).rejects.toThrow(/No element matched/)

    expect(tags()).toBe('')
  })

  it('creates no tag when the outerHTML extraction throws', async () => {
    extraction.launch.mockRejectedValue(new Error('page load failed'))

    await expect(runDesignFreeze({ ...FREEZE, cwd: repo })).rejects.toThrow(/page load failed/)

    expect(tags()).toBe('')
  })

  it('tags HEAD once both extractions succeed', async () => {
    const { tagName, skeleton } = await runDesignFreeze({ ...FREEZE, cwd: repo })

    expect(tagName).toBe('design-freeze/dot-1')
    expect(tags()).toBe('design-freeze/dot-1')
    expect(skeleton).toContain('<div class="dot"></div>')
  })
})
