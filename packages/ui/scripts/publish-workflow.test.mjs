// A tag push checks out shallow with no origin/main, and ratchet-baseline.test.mjs fails in CI
// without it. Every publish.yml job that runs the suite, directly or through npm publish's
// prepublishOnly, must check out full history. No YAML parser is a dependency, so this splits the
// workflow by its two-space job and six-space step indentation.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const WORKFLOW = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../.github/workflows/publish.yml'
)

const RUNS_TESTS = /\bpnpm test\b|\bnpm(@\S+)? publish\b/
const CHECKOUT = /uses: actions\/checkout@/
const FULL_HISTORY = /^\s+fetch-depth: 0\s*$/m

/** `{ name: [stepText] }` for each job under `jobs:`. Pure. */
function jobSteps(yaml) {
  const jobs = {}
  let steps = null
  for (const line of yaml.slice(yaml.indexOf('\njobs:\n')).split('\n')) {
    const job = /^ {2}([\w-]+):\s*$/.exec(line)
    if (job) steps = jobs[job[1]] = []
    else if (steps && line.startsWith('      - ')) steps.push(line)
    else if (steps && steps.length > 0) steps[steps.length - 1] += `\n${line}`
  }
  return jobs
}

/** Names of jobs that run the tests without a full-history checkout. Pure. */
function shallowTestJobs(yaml) {
  return Object.entries(jobSteps(yaml))
    .filter(([, steps]) => steps.some((step) => RUNS_TESTS.test(step)))
    .filter(([, steps]) => !steps.some((s) => CHECKOUT.test(s) && FULL_HISTORY.test(s)))
    .map(([name]) => name)
}

const workflow = (checkoutWith) =>
  [
    'on: push',
    'jobs:',
    '  publish:',
    '    steps:',
    '      - uses: actions/checkout@v6',
    ...checkoutWith,
    '      - run: npx npm@latest publish --provenance',
    '  release:',
    '    steps:',
    '      - uses: actions/checkout@v6',
    '',
  ].join('\n')

describe('publish.yml', () => {
  it('checks out full history in every job that runs the tests', () => {
    expect(shallowTestJobs(readFileSync(WORKFLOW, 'utf8'))).toEqual([])
  })
})

describe('shallowTestJobs', () => {
  it('reports a publishing job whose checkout is shallow', () => {
    expect(shallowTestJobs(workflow([]))).toEqual(['publish'])
  })

  it('accepts a publishing job that checks out with fetch-depth 0', () => {
    expect(shallowTestJobs(workflow(['        with:', '          fetch-depth: 0']))).toEqual([])
  })

  it('ignores a shallow job that runs no tests', () => {
    expect(shallowTestJobs(workflow(['        with:', '          fetch-depth: 0']))).not.toContain(
      'release'
    )
  })
})
