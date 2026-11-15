import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

/**
 * Wiring of the token-resolution browser spec (TD-1066): the `visual` job in ci.yml runs
 * `test:visual:tokens` after Layer 3, under the same rendered-UI paths gate as every other layer.
 */

const REPO_ROOT = path.resolve(__dirname, '../../../..')
const CI_PATH = path.join(REPO_ROOT, '.github/workflows/ci.yml')
const PATHS_GATE = "if: steps.paths.outputs.run != 'false'"
const LAYER_3_RUN = 'run: pnpm --filter @titan-design/react-ui test:visual:compare'
const TOKENS_RUN = 'run: pnpm --filter @titan-design/react-ui test:visual:tokens'

/** The text of one top-level job in ci.yml, from its `  <name>:` line to the next job's. */
function jobBlock(ci: string, name: string): string | undefined {
  const lines = ci.split('\n')
  const start = lines.indexOf(`  ${name}:`)
  if (start === -1) return undefined
  const end = lines.findIndex((line, i) => i > start && /^ {2}[\w-]+:\s*$/.test(line))
  return lines.slice(start, end === -1 ? undefined : end).join('\n')
}

/** The steps of a job, each as the text from its `      - ` line to the next one. */
function stepsOf(job: string): string[] {
  return job
    .split(/\n(?= {6}- )/)
    .slice(1)
    .map((step) => step.trim())
}

function visualSteps(): string[] {
  const ci = fs.readFileSync(CI_PATH, 'utf-8')
  return stepsOf(jobBlock(ci, 'visual') ?? '')
}

describe('visual job steps', () => {
  it('runs the token-resolution spec under the rendered-UI paths gate', () => {
    const steps = visualSteps()

    const tokens = steps.find((step) => step.includes(TOKENS_RUN))

    expect(tokens).toBeDefined()
    expect(tokens).toContain(PATHS_GATE)
    expect(tokens).not.toMatch(/continue-on-error/)
  })

  it('runs the token-resolution spec after Layer 3', () => {
    const steps = visualSteps()

    const layer3 = steps.findIndex((step) => step.includes(LAYER_3_RUN))
    const tokens = steps.findIndex((step) => step.includes(TOKENS_RUN))

    expect(layer3).toBeGreaterThanOrEqual(0)
    expect(tokens).toBeGreaterThan(layer3)
  })
})
