import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const FAMILY_DIR = __dirname
const OWNER = 'task-stage.ts'
const EXEMPT = /\.(test|test-d|stories)\.(ts|tsx)$|fixture\.ts$/
const STAGE_LITERAL = /['"`](blocked|ready|in-progress|review)['"`]|\b(blocked|ready|review)\s*:/

function sourceFiles(): string[] {
  return readdirSync(FAMILY_DIR).filter(
    (name) => /\.(ts|tsx)$/.test(name) && name !== OWNER && !EXEMPT.test(name)
  )
}

describe('task stage vocabulary', () => {
  it('is named by task-stage.ts alone, so a second stage table cannot be written', () => {
    const offenders = sourceFiles().filter((name) =>
      STAGE_LITERAL.test(readFileSync(join(FAMILY_DIR, name), 'utf8'))
    )
    expect(offenders).toEqual([])
  })

  it('scans the family sources, so an empty glob cannot pass it', () => {
    expect(sourceFiles()).toContain('TaskStagePill.tsx')
  })
})
