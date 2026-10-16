import type { EvidenceKind } from '../evidence'

export interface EvidenceChipFixture {
  kind: EvidenceKind
  text: string
}

export interface EvidenceBeatFixture {
  beat: string
  chips: EvidenceChipFixture[]
}

// Synthetic, shaped like real explainer citations: a `name@hex:` prefix pin or a
// ` @hex` suffix pin, `path:L` ranges, `§` doc tails, prose refs, and up to three
// refs per chip. Lengths span 25 to 155 characters, the range real chips cover.
export const EVIDENCE_BEATS: EvidenceBeatFixture[] = [
  {
    beat: 'a1-1-hook',
    chips: [{ kind: 'computed', text: '~/.relay/queue-ticks.jsonl (16:01:25Z row)' }],
  },
  {
    beat: 'a2-3-thesis',
    chips: [
      {
        kind: 'verified',
        text: 'ab@3f9c21e:src/engine/scheduler/rebalance.ts:283-307, 430-435, 566-579',
      },
    ],
  },
  {
    beat: 'a4-2-collision',
    chips: [
      {
        kind: 'verified',
        text: 'ab@3f9c21e:src/engine/scheduler/conflict.ts:14-19, 107-118, 174-189',
      },
    ],
  },
  {
    beat: 'a4-7-budget',
    chips: [
      {
        kind: 'verified',
        text: 'notes.md:54; ab@3f9c21e:src/engine/limits/budget-check.ts:40-52; queue status',
      },
    ],
  },
  {
    beat: 'a5-1-land',
    chips: [{ kind: 'verified', text: 'cd@7b2e04a1:apps/runner/src/flows/settle.ts:202-224' }],
  },
  {
    beat: 'a6-8-verdict',
    chips: [
      {
        kind: 'verified',
        text: 'cd@7b2e04a1:packages/review-kit/src/accept-result.ts:61-77; apps/runner/src/guard/take-result.ts:95-105',
      },
    ],
  },
  {
    beat: 'a6-12-merged',
    chips: [{ kind: 'computed', text: 'runner-cli guard status --json (run row 1419)' }],
  },
  {
    beat: 'a7-3-adversary',
    chips: [
      {
        kind: 'verified',
        text: 'cd@7b2e04a1:apps/runner/src/guard/hold-release.ts:13-22; notes.md:371-378',
      },
      { kind: 'our-framing', text: 'hand layout of the pipeline map' },
    ],
  },
  {
    beat: 'a7-7-wakes',
    chips: [
      {
        kind: 'verified',
        text: 'cd@7b2e04a1:apps/runner/src/guard/route-table.ts:55-67; repair.ts:20-26',
      },
    ],
  },
  {
    beat: 'a7-9-machine',
    chips: [
      {
        kind: 'verified',
        text:
          'ab@3f9c21e:src/engine/workers/stop-rules.ts:361-385; ~/.config/runner/config.json spawnLimit; ' +
          'cd@7b2e04a1:apps/runner/src/guard/spawn-limit.ts:96-104',
      },
      { kind: 'our-framing', text: 'hand layout of the pipeline map' },
      { kind: 'computed', text: '~/.relay/queue.json; relay queue config show' },
    ],
  },
  {
    beat: 'a2-4-actors',
    chips: [
      { kind: 'our-framing', text: 'colour = actor type: blue software, amber agent, red human' },
    ],
  },
  {
    beat: 'b1-5-seams',
    chips: [
      {
        kind: 'estimated',
        text: 'critique-pass-2026-09-30.md §1, §5.5; flow-rework-2026-09-30.md §9',
      },
      { kind: 'docs-claim', text: 'flow-rework-2026-09-30.md §2.4 steps 2-3' },
    ],
  },
  {
    beat: 'b1-6-seat',
    chips: [
      {
        kind: 'measured',
        text: 'flow-rework-2026-09-30.md §9; critique-pass-2026-09-30.md §1, §2 row 1',
      },
    ],
  },
  {
    beat: 'b3-5-runtime',
    chips: [
      { kind: 'docs-claim', text: 'flow-rework-2026-09-30.md §2.4 (after step 11)' },
      { kind: 'target', text: 'flow-rework-2026-09-30.md §11 Q1, §2.4 step 8' },
    ],
  },
  {
    beat: 'b5-4-tick',
    chips: [
      {
        kind: 'measured',
        text: 'cd@7b2e04a1:apps/runner/src/guard/heartbeat.ts:120-148; flow-rework-2026-09-30.md §6',
      },
      { kind: 'docs-claim', text: 'critique-pass-2026-09-30.md §1' },
      { kind: 'estimated', text: 'flow-rework-2026-09-30.md §7.2 (cost table)' },
    ],
  },
  {
    beat: 't3-4-call',
    chips: [
      { kind: 'reconstructed', text: 'entry-tools.ts:L44 @5d8e1a9c' },
      { kind: 'illustrative', text: 'example payload, not a real record' },
    ],
  },
  {
    beat: 't5-2-walk',
    chips: [{ kind: 'verified', text: 'ledger.ts:L1225, L1399, L1446 @5d8e1a9c' }],
  },
  { beat: 't3-5-brief', chips: [{ kind: 'verified', text: 'entry-guide.md · pr 469 @5d8e1a9c' }] },
]

export const beatFixture = (beat: string): EvidenceBeatFixture => {
  const found = EVIDENCE_BEATS.find((b) => b.beat === beat)
  if (!found) throw new Error(`No evidence fixture for beat ${beat}`)
  return found
}

export const ALL_EVIDENCE_CHIPS = EVIDENCE_BEATS.flatMap((b) => b.chips)
