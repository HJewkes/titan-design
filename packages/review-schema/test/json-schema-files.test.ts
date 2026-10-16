import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { feedbackJsonSchema, manifestJsonSchema } from '../src/index.ts'

describe('exported JSON Schema files', () => {
  const onDisk = (name: string) =>
    JSON.parse(readFileSync(new URL(`../schema/${name}`, import.meta.url), 'utf8'))

  it('match the zod schemas (run `pnpm schema` after changing them)', () => {
    expect(onDisk('round.schema.json')).toEqual(manifestJsonSchema())
    expect(onDisk('feedback.schema.json')).toEqual(feedbackJsonSchema())
  })
})
