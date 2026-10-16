import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The index and /motion entries each bundle their own copy of a motion context, so anything the index
// entry ships must take time as a progress prop and never read a clock or cue context itself.
const CLOCK_MODULES =
  /from\s+['"][^'"]*motion(\/(index|hooks|cues|Beat|MotionProvider|clocks))?['"]/
const STAGE_DIRS = ['stage', 'header-lockup', 'count-of-total']

function sources(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f))
      .map((f) => join(dir, f))
  } catch {
    return []
  }
}

describe('stage imports', () => {
  it('reads no motion clock or cue context from the index entry', () => {
    const files = STAGE_DIRS.flatMap((d) => sources(join(__dirname, '..', d)))
    const offenders = files.filter((f) => CLOCK_MODULES.test(readFileSync(f, 'utf8')))

    expect(files.length).toBeGreaterThan(0)
    expect(offenders).toEqual([])
  })
})
