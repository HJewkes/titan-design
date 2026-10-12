import { describe, expect, it } from 'vitest'
import {
  TOOL_FAMILY_META,
  TOOL_FAMILY_ORDER,
  TOOL_OUTCOME_META,
  TURN_ORIGIN_META,
  toolFamilyMeta,
  toolOutcomeMeta,
  turnOriginMeta,
} from './session-vocabulary'

describe('session vocabulary', () => {
  it('gives every tool family a distinct label and a one-character glyph', () => {
    const labels = TOOL_FAMILY_ORDER.map((family) => TOOL_FAMILY_META[family].label)

    expect(TOOL_FAMILY_ORDER).toHaveLength(12)
    expect(new Set(labels).size).toBe(12)
    for (const family of TOOL_FAMILY_ORDER) {
      expect(TOOL_FAMILY_META[family].glyph).toHaveLength(1)
    }
  })

  it('falls back to other_tool for a family the union does not know', () => {
    expect(toolFamilyMeta('future_family')).toBe(TOOL_FAMILY_META.other_tool)
    expect(toolFamilyMeta('toString')).toBe(TOOL_FAMILY_META.other_tool)
    expect(toolFamilyMeta('bash')).toBe(TOOL_FAMILY_META.bash)
  })

  it('labels every outcome and never marks unknown or pending as a success', () => {
    for (const meta of Object.values(TOOL_OUTCOME_META)) expect(meta.label).not.toBe('')
    expect(TOOL_OUTCOME_META.unknown.indicator).not.toBe('success')
    expect(TOOL_OUTCOME_META.pending.indicator).not.toBe('success')
    expect(TOOL_OUTCOME_META.pending.pulse).toBe(true)
  })

  it('reads an outcome the union does not know as unknown', () => {
    expect(toolOutcomeMeta('cancelled')).toBe(TOOL_OUTCOME_META.unknown)
    expect(toolOutcomeMeta('error')).toBe(TOOL_OUTCOME_META.error)
  })

  it('labels only a prompt opener as the user', () => {
    expect(turnOriginMeta({ origin: 'prompt', injectedMarker: null }).label).toBe('User')
    for (const origin of ['injected', 'compaction', 'none'] as const) {
      expect(turnOriginMeta({ origin, injectedMarker: null }).label).not.toBe('User')
    }
  })

  it('reads an injected opener with the channel marker as Channel, other markers as Injected', () => {
    expect(turnOriginMeta({ origin: 'injected', injectedMarker: 'channel' }).label).toBe('Channel')
    expect(turnOriginMeta({ origin: 'injected', injectedMarker: 'reminder' }).label).toBe(
      TURN_ORIGIN_META.injected.label
    )
    expect(turnOriginMeta({ origin: 'compaction', injectedMarker: 'channel' }).label).toBe(
      TURN_ORIGIN_META.compaction.label
    )
  })
})
