import { describe, expect, it } from 'vitest'
import * as reviewSchema from '../src/index.ts'
import {
  FEEDBACK_SCHEMA_ID,
  LEGACY_MANIFEST_SCHEMA_ID,
  MANIFEST_SCHEMA_ID,
  RoundSchema,
  SHIP_OPTIONS,
  isLoopbackUrl,
  manifestJsonSchema,
} from '../src/index.ts'

describe('the package entry', () => {
  it('exports the schemas, ids and helpers consumers import', () => {
    expect(Object.keys(reviewSchema)).toEqual(
      expect.arrayContaining([
        'RoundSchema',
        'ManifestSchema',
        'FeedbackSchema',
        'RecommendationSchema',
        'MANIFEST_SCHEMA_ID',
        'LEGACY_MANIFEST_SCHEMA_ID',
        'FEEDBACK_SCHEMA_ID',
        'SHIP_OPTIONS',
        'isLoopbackUrl',
        'manifestJsonSchema',
      ])
    )
  })

  it('names the round, legacy round and feedback schema ids', () => {
    expect([MANIFEST_SCHEMA_ID, LEGACY_MANIFEST_SCHEMA_ID, FEEDBACK_SCHEMA_ID]).toEqual([
      'titan-review/round@2',
      'titan-review/round@1',
      'titan-review/feedback@1',
    ])
    expect(SHIP_OPTIONS).toEqual(['Ship', "Don't ship"])
  })

  it('accepts only loopback hosts as a Storybook url', () => {
    expect(isLoopbackUrl('http://127.0.0.1:6006/')).toBe(true)
    expect(isLoopbackUrl('http://localhost:6100')).toBe(true)
    expect(isLoopbackUrl('https://[::1]:6006')).toBe(true)
    expect(isLoopbackUrl('http://example.com:6006')).toBe(false)
    expect(isLoopbackUrl('file:///tmp/x')).toBe(false)
    expect(isLoopbackUrl('not a url')).toBe(false)
  })

  it('refuses a round@1 manifest under the round@2 contract', () => {
    const result = RoundSchema.safeParse({ schema: LEGACY_MANIFEST_SCHEMA_ID })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('predates the review contract')
  })

  it('emits a JSON Schema whose storybookUrl is pinned to loopback hosts', () => {
    const schema = manifestJsonSchema() as {
      properties: { storybookUrl: { pattern: string } }
    }
    expect(new RegExp(schema.properties.storybookUrl.pattern).test('http://localhost:6006')).toBe(
      true
    )
  })
})
