import { describe, expect, it } from 'vitest'
import { parseProseSource } from './parseProseBlocks'
import {
  BLOCK_FAMILIES,
  countingSource,
  type AdversarialFamily,
} from './__fixtures__/proseAdversarial'

/**
 * Reads per input character, at most. 1.5 times the largest count measured over the corpus
 * (block: 22.2, an unclosed container on every line, which each nesting level rescans up to the cap).
 * A fixed literal: deriving it from `n` would let a quadratic scan pass.
 */
const BLOCK_READS_PER_CHAR = 34

const SMALL = 8_000
const LARGE = 16_000
/** Doubling the input may at most double the reads, plus slack for a family's fixed overhead. */
const DOUBLING_SLACK = 2.2

function blockReads(text: string): number {
  const { src, reads } = countingSource(text)
  parseProseSource(src)
  return reads()
}

function expectLinear(family: AdversarialFamily, count: (text: string) => number, k: number) {
  const small = family(SMALL)
  const large = family(LARGE)
  const smallReads = count(small)
  const largeReads = count(large)
  expect(largeReads).toBeLessThanOrEqual(DOUBLING_SLACK * smallReads)
  expect(smallReads).toBeLessThanOrEqual(k * small.length)
  expect(largeReads).toBeLessThanOrEqual(k * large.length)
}

describe('prose scanner cost', () => {
  it.each(Object.entries(BLOCK_FAMILIES))(
    'reads each character of a block body a bounded number of times: %s',
    (_name, family) => {
      expectLinear(family, blockReads, BLOCK_READS_PER_CHAR)
    }
  )
})
