import { expectTypeOf, test } from 'vitest'
import type {
  BandChip,
  ChipBandProps,
  ElidedSource,
  ElisionLevel,
  EvidenceChipProps,
  EvidenceChipSize,
  EvidenceKind,
} from './motion'
import type * as Root from './index'

test('video-only types come from the motion entry', () => {
  expectTypeOf<EvidenceChipProps['kind']>().toEqualTypeOf<EvidenceKind>()
  expectTypeOf<EvidenceChipSize>().not.toBeNever()
  expectTypeOf<ElidedSource['level']>().toEqualTypeOf<ElisionLevel>()
  expectTypeOf<ChipBandProps['chips']>().toEqualTypeOf<BandChip[]>()
})

test('video-only types are absent from the root entry', () => {
  expectTypeOf<typeof Root>().not.toHaveProperty('EvidenceChip')
  expectTypeOf<typeof Root>().not.toHaveProperty('elideSource')
  expectTypeOf<typeof Root>().not.toHaveProperty('ChipBand')
  // @ts-expect-error EvidenceChipProps exports from /motion only
  expectTypeOf<Root.EvidenceChipProps>().not.toBeNever()
  // @ts-expect-error ElidedSource exports from /motion only
  expectTypeOf<Root.ElidedSource>().not.toBeNever()
  // @ts-expect-error ChipBandProps exports from /motion only
  expectTypeOf<Root.ChipBandProps>().not.toBeNever()
})
