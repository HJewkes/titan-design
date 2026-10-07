import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The mirror cannot see voltras-mcp from CI. This pins the sha the header
 * records; the field lists live in `muscleReadModels.mirror.test-d.ts`, where
 * the `types` project typechecks them. A re-sync updates both, or CI fails.
 */
const SYNCED_FROM_SHA = '5a6fadd'

const header = () => readFileSync(join(__dirname, 'muscleReadModels.ts'), 'utf8')

describe('muscleReadModels mirror', () => {
  it('records the voltras-mcp sha the field lists were synced from', () => {
    expect(header()).toContain(`origin/main at \`${SYNCED_FROM_SHA}\``)
  })

  it('no longer claims an exact copy', () => {
    expect(header()).not.toMatch(/exact copy/i)
  })
})
