// Synthetic packet inputs: an invented repo, run and baselines, every PNG built in code.
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Collected } from '../src/packet.ts'
import { solidImage, writePng } from '../src/packet-png.ts'
import type { LayerSources } from '../src/packet-types.ts'

export const REPO = 'acme/widgets'
export const PR = 42
export const HEAD = 'a1'.repeat(20)
export const MAIN = 'b2'.repeat(20)
export const MERGE_BASE = 'c3'.repeat(20)
export const TREE = 'd4'.repeat(20)
export const RUN = '1234'

export const GREY = [128, 128, 128, 255]

/** A solid `w`x`h` PNG, with the pixels `changes` lists painted their own colour. */
export function png(w: number, h: number, rgba = GREY, changes: [number, number, number[]][] = []) {
  const image = solidImage(w, h, rgba)
  for (const [x, y, colour] of changes) image.data.set(colour, (y * w + x) * 4)
  return writePng(image)
}

export const tempDir = () => mkdtemp(join(tmpdir(), 'titan-packet-test-'))

/** A layer with nothing regenerated and nothing shown, to override. */
export function layer(over: Partial<LayerSources> & Pick<LayerSources, 'layer'>): LayerSources {
  return { regenerated: false, diagnostics: false, unchanged: 0, shown: [], ...over }
}

/** What a packet is written from, bound to the invented run, head and main. */
export function collected(layers: LayerSources[] = [], over: Partial<Collected> = {}): Collected {
  const of = (name: LayerSources['layer']) => layers.find((l) => l.layer === name)
  return {
    target: { repo: REPO, pr: PR, head: HEAD, run: RUN, clone: '/nonexistent-clone' },
    binding: {
      url: `https://example.test/runs/${RUN}`,
      conclusion: 'failure',
      visualJob: 'failure',
      headTree: TREE,
      mainSha: MAIN,
      mergeBase: MERGE_BASE,
    },
    layers: [
      of('component') ?? layer({ layer: 'component' }),
      of('story') ?? layer({ layer: 'story' }),
    ],
    warnings: [],
    side: [],
    ...over,
  }
}
