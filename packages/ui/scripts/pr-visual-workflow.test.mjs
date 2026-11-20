// TP-6766: pr-visual selects stories, and writes the manifest, from the PR's merge commit with
// main, so a selector fix on main reaches a PR without moving its head. No YAML parser is a
// dependency, so steps are read by indentation, and a step the split cannot find fails the test.
// The dry run executes the workflow's own shell against throwaway local repositories.
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const WORKFLOW = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../.github/workflows/pr-visual.yml'
  ),
  'utf8'
)
const SELECTOR = 'packages/ui/scripts/pr-visual-stories.mjs'
const CATALOG = 'packages/ui/src/arch/component-catalog.json'

/** The step named `name` as `{ text, run }`: its lines, and its `run:` block unindented. Pure. */
function step(yaml, name) {
  const lines = yaml.split('\n')
  const start = lines.findIndex((line) => line.trim() === `- name: ${name}`)
  if (start === -1) throw new Error(`no step named ${name}`)
  const indent = lines[start].indexOf('-')
  const end = lines.findIndex(
    (line, i) => i > start && line.trim() !== '' && line.search(/\S/) <= indent
  )
  const body = lines.slice(start, end === -1 ? undefined : end)
  const runAt = body.findIndex((line) => /^\s+run: \|$/.test(line))
  const runIndent = runAt === -1 ? 0 : body[runAt].search(/\S/)
  const block = runAt === -1 ? [] : body.slice(runAt + 1)
  const runLines = block.filter((line) => line.trim() === '' || line.search(/\S/) > runIndent)
  const run = runLines.map((line) => line.slice(runIndent + 2)).join('\n')
  return { text: body.join('\n'), run }
}

const stepNames = (yaml) =>
  [...yaml.matchAll(/^\s+- name: (.+)$/gm)].map((match) => match[1].trim())

describe('pr-visual workflow shape (TP-6766)', () => {
  it('runs the selector from the merge commit tree, after creating that tree', () => {
    const names = stepNames(WORKFLOW)
    expect(names.indexOf('Selector at the merge commit')).toBeGreaterThan(-1)
    expect(names.indexOf('Selector at the merge commit')).toBeLessThan(
      names.indexOf('Stories the PR changes')
    )
    expect(step(WORKFLOW, 'Stories the PR changes').text).toContain(
      'node "$SELECT_TREE/packages/ui/scripts/pr-visual-stories.mjs"'
    )
  })

  it('writes the manifest with the merge commit copy of the script', () => {
    expect(step(WORKFLOW, 'Manifest').run).toContain(
      'script="$SELECT_TREE/packages/ui/scripts/pr-visual-manifest.mjs"'
    )
  })

  it('still checks out and names the PR head, not the merge commit', () => {
    expect(WORKFLOW).toContain('ref: ${{ github.event.pull_request.head.sha }}')
    expect(WORKFLOW).toContain('HEAD_SHA: ${{ github.event.pull_request.head.sha }}')
  })
})

describe('pr-visual merge commit selector, dry run (TP-6766)', () => {
  let root
  const env = (extra = {}) => ({
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 't',
    GIT_AUTHOR_EMAIL: 't@example.com',
    GIT_COMMITTER_NAME: 't',
    GIT_COMMITTER_EMAIL: 't@example.com',
    ...extra,
  })
  const git = (dir, ...args) =>
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', env: env() }).trim()
  const commitFile = (dir, file, text) => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), text)
    git(dir, 'add', '-A')
    git(dir, 'commit', '-q', '-m', file)
    return git(dir, 'rev-parse', 'HEAD')
  }

  /** origin: main fixes the selector after the PR branched; the PR edits the catalog. */
  function remoteWithPr() {
    const origin = path.join(root, 'origin')
    git(root, 'init', '-q', '-b', 'main', origin)
    commitFile(origin, SELECTOR, 'selector before the fix\n')
    commitFile(origin, CATALOG, 'catalog on main\n')
    git(origin, 'checkout', '-q', '-b', 'pr')
    const head = commitFile(origin, CATALOG, "the PR's catalog\n")
    git(origin, 'checkout', '-q', 'main')
    const other = commitFile(origin, SELECTOR, 'selector with the fix\n')
    git(origin, 'checkout', '-q', '--detach', 'main')
    git(origin, 'merge', '-q', '--no-ff', '-m', 'merge', 'pr')
    const merge = git(origin, 'rev-parse', 'HEAD')
    git(origin, 'update-ref', 'refs/pull/1/merge', merge)
    git(origin, 'checkout', '-q', 'main')
    return { origin, head, merge, other }
  }

  function runStep(checkout, { GITHUB_SHA, HEAD_SHA }) {
    return spawnSync(
      'bash',
      ['-eo', 'pipefail', '-c', step(WORKFLOW, 'Selector at the merge commit').run],
      {
        cwd: checkout,
        encoding: 'utf8',
        env: env({ GITHUB_SHA, HEAD_SHA, SELECT_TREE: 'pr-visual-select' }),
      }
    )
  }

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'pr-visual-workflow-'))
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it("selects with main's selector and the PR's catalog while the checkout stays on the head", () => {
    const { origin, head, merge } = remoteWithPr()
    const checkout = path.join(root, 'checkout')
    git(root, 'clone', '-q', origin, checkout)
    git(checkout, 'checkout', '-q', '--detach', head)

    const result = runStep(checkout, { GITHUB_SHA: merge, HEAD_SHA: head })

    expect(result.status, result.stderr).toBe(0)
    const tree = path.join(checkout, 'pr-visual-select')
    expect(readFileSync(path.join(tree, SELECTOR), 'utf8')).toBe('selector with the fix\n')
    expect(readFileSync(path.join(tree, CATALOG), 'utf8')).toBe("the PR's catalog\n")
    expect(git(checkout, 'rev-parse', 'HEAD')).toBe(head)
    expect(readFileSync(path.join(checkout, SELECTOR), 'utf8')).toBe('selector before the fix\n')
  })

  it('refuses a commit that is not the merge of the PR head', () => {
    const { origin, head, other } = remoteWithPr()
    const checkout = path.join(root, 'checkout')
    git(root, 'clone', '-q', origin, checkout)
    git(checkout, 'checkout', '-q', '--detach', head)

    const result = runStep(checkout, { GITHUB_SHA: other, HEAD_SHA: head })

    expect(result.status).not.toBe(0)
    expect(result.stdout).toContain(`is not the merge of the PR head ${head}`)
  })
})
