/**
 * TD-486 — a declared pair is only evidence while the primitive still paints it.
 * If a primitive swaps its class, the pair keeps passing against a token nobody
 * uses; this test names the primitive and the class that went missing.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NON_TEXT_PAIRS } from './pairs'

const COMPONENTS = join(__dirname, '../../components')
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wholeToken = (paints: string) => new RegExp(`(?<![\\w-])${escape(paints)}(?![\\w-])`)

describe('non-text pairs name what primitives still paint (TD-486)', () => {
  const cases = NON_TEXT_PAIRS.flatMap((pair) =>
    pair.sources.map((source) => ({ pair: pair.id, ...source }))
  )

  it.each(cases)('$file still contains $paints ($pair)', ({ pair, file, paints }) => {
    const text = readFileSync(join(COMPONENTS, file), 'utf8')
    expect(
      wholeToken(paints).test(text),
      `${file} no longer contains '${paints}', which pair ${pair} declares it paints. ` +
        `Move the pair to the token the primitive paints now.`
    ).toBe(true)
  })
})
