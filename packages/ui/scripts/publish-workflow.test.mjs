// A tag push checks out shallow with no origin/main, and ratchet-baseline.test.mjs fails in CI
// without it. Every publish.yml job that runs the suite, directly or through publish's
// prepublishOnly, must check out full history. No YAML parser is a dependency, so this splits the
// workflow by indentation, and the workflow test fails when the split finds no publishing job:
// a parse that recognises nothing must not read as compliant.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const WORKFLOW = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../.github/workflows/publish.yml'
)

const RUNS_TESTS = /\b(?:p?npm|npx)\b[^\n]*\bpublish\b|\bpnpm\b[^\n]*\btest\b|\bvitest\b/
const CHECKOUT = /uses: actions\/checkout@/
const FULL_HISTORY = /^\s+fetch-depth: 0\s*$/m

/** The lines after `jobs:`, or none when the key is missing. Pure. */
function jobLines(yaml) {
  const lines = yaml.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((line) => /^jobs:\s*$/.test(line))
  return start === -1 ? [] : lines.slice(start + 1)
}

/** `{ name: [stepText] }` for each two-space job under `jobs:`; steps at any indent. Pure. */
function jobSteps(yaml) {
  const jobs = {}
  let steps = null
  let stepIndent = null
  for (const line of jobLines(yaml)) {
    const job = /^ {2}([\w-]+):\s*$/.exec(line)
    const item = /^(\s+)- /.exec(line)
    if (job) {
      steps = jobs[job[1]] = []
      stepIndent = null
    } else if (steps && item && (stepIndent ?? item[1]) === item[1]) {
      steps.push(line)
      stepIndent = item[1]
    } else if (steps && steps.length > 0) steps[steps.length - 1] += `\n${line}`
  }
  return jobs
}

/** Names of jobs with a step that runs the tests. Pure. */
const testJobs = (jobs) =>
  Object.keys(jobs).filter((name) => jobs[name].some((step) => RUNS_TESTS.test(step)))

/** Names of test-running jobs without a full-history checkout. Pure. */
const shallowTestJobs = (jobs) =>
  testJobs(jobs).filter(
    (name) => !jobs[name].some((step) => CHECKOUT.test(step) && FULL_HISTORY.test(step))
  )

const workflow = (checkoutWith, publish = 'npx npm@latest publish --provenance') =>
  jobSteps(
    [
      'on: push',
      'jobs:',
      '  publish:',
      '    steps:',
      '      - uses: actions/checkout@v6',
      ...checkoutWith,
      `      - run: ${publish}`,
      '  release:',
      '    steps:',
      '      - uses: actions/checkout@v6',
      '',
    ].join('\n')
  )

const FULL = ['        with:', '          fetch-depth: 0']

describe('publish.yml', () => {
  const jobs = jobSteps(readFileSync(WORKFLOW, 'utf8'))

  it('parses to a publish job that runs the tests, so an unparsed file cannot pass', () => {
    expect(testJobs(jobs)).toContain('publish')
  })

  it('checks out full history in every job that runs the tests', () => {
    expect(shallowTestJobs(jobs)).toEqual([])
  })
})

describe('shallowTestJobs', () => {
  it('reports a publishing job whose checkout is shallow', () => {
    expect(shallowTestJobs(workflow([]))).toEqual(['publish'])
  })

  it('accepts a publishing job that checks out with fetch-depth 0', () => {
    expect(shallowTestJobs(workflow(FULL))).toEqual([])
  })

  it.each([
    'pnpm publish --provenance',
    'pnpm --filter @titan-design/react-ui publish',
    'npm publish',
    'pnpm --filter @titan-design/react-ui test',
    'pnpm exec vitest run',
  ])('reports a shallow job that runs `%s`', (command) => {
    expect(shallowTestJobs(workflow([], command))).toEqual(['publish'])
  })

  it('ignores a shallow job that runs no tests', () => {
    expect(testJobs(workflow(FULL))).toEqual(['publish'])
  })
})

describe('jobSteps', () => {
  it('finds no jobs in a file without a jobs key', () => {
    expect(jobSteps('on: push\n')).toEqual({})
  })

  it('parses CRLF line endings and a trailing space after jobs:', () => {
    const crlf = 'jobs: \r\n  publish:\r\n    steps:\r\n      - run: pnpm publish\r\n'

    expect(testJobs(jobSteps(crlf))).toEqual(['publish'])
  })

  it('parses steps at four-space indent', () => {
    const fourSpace =
      'jobs:\n  publish:\n    steps:\n    - uses: actions/checkout@v6\n    - run: npm publish\n'

    expect(shallowTestJobs(jobSteps(fourSpace))).toEqual(['publish'])
  })
})
