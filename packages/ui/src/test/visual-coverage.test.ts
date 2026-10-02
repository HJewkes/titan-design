// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BASELINE_SUFFIX,
  collectStoryIds,
  findMissingBaselines,
  findMisnamedSnapshots,
  REQUIRED_PREFIXES,
} from './visual-coverage'

const PACKAGE_DIR = fileURLToPath(new URL('../..', import.meta.url))
const STORY_SNAPSHOT_DIR = 'tests/visual/reference/stories.spec.ts-snapshots'

const trackedFiles = (): string[] =>
  execFileSync('git', ['ls-files'], { cwd: PACKAGE_DIR, encoding: 'utf8' }).trim().split('\n')

const storyIds = collectStoryIds(join(PACKAGE_DIR, 'src'))
const trackedSnapshots = trackedFiles().filter((file) => file.includes('-snapshots/'))
const storyBaselines = trackedSnapshots
  .filter((file) => file.startsWith(`${STORY_SNAPSHOT_DIR}/`))
  .map((file) => basename(file))

describe('Layer-2 visual coverage manifest', () => {
  it('matches at least one story for every required prefix', () => {
    const unmatched = REQUIRED_PREFIXES.filter((p) => !storyIds.some((id) => id.startsWith(p)))
    expect(unmatched).toEqual([])
  })

  it('has a committed linux baseline for every story under a required prefix', () => {
    expect(findMissingBaselines(storyIds, storyBaselines)).toEqual([])
  })

  it('commits no darwin or unsuffixed snapshot', () => {
    expect(trackedSnapshots.length).toBeGreaterThan(0)
    expect(findMisnamedSnapshots(trackedSnapshots)).toEqual([])
  })
})

describe('Layer-2 visual coverage manifest against a fixture snapshot directory', () => {
  let fixtureDir: string

  beforeEach(() => {
    fixtureDir = mkdtempSync(join(realpathSync(tmpdir()), 'visual-coverage-'))
    for (const name of storyBaselines) writeFileSync(join(fixtureDir, name), '')
  })

  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('reports a shell story whose baseline was deleted', () => {
    const shellBaseline = storyBaselines.find((name) => name.startsWith('shell-'))
    expect(shellBaseline).toBeDefined()
    unlinkSync(join(fixtureDir, shellBaseline!))

    const missing = findMissingBaselines(storyIds, readdirSync(fixtureDir))

    expect(missing).toEqual([shellBaseline!.slice(0, -BASELINE_SUFFIX.length)])
  })

  it('reports a darwin snapshot', () => {
    writeFileSync(join(fixtureDir, 'shell-topbar--default-chromium-darwin.png'), '')

    expect(findMisnamedSnapshots(readdirSync(fixtureDir))).toEqual([
      'shell-topbar--default-chromium-darwin.png',
    ])
  })

  it('reports a snapshot without the browser and platform suffix', () => {
    writeFileSync(join(fixtureDir, 'shell-topbar--default.png'), '')

    expect(findMisnamedSnapshots(readdirSync(fixtureDir))).toEqual(['shell-topbar--default.png'])
  })
})
