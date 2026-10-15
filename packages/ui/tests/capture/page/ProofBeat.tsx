import type { ReactNode } from 'react'
import { View } from 'react-native'
import {
  AnimatedNumber,
  ChapterCard,
  ProgressSteps,
  StatCard,
  StatCardHeader,
  Timeline,
  type TimelineItem,
} from '../../../src'
import { Beat, BeatFrame, EvidenceChip, localTime, useRawLocalTime } from '../../../src/motion'

import { PROOF_COMPONENTS, PROOF_DURATION_S, type ProofComponent } from './proof-components'

/** Each cell starts this much after the previous one, so one frame shows several progress values. */
const STAGGER_S = 0.2
const CELL_DURATION_S = 1.6

const CHAPTERS: TimelineItem[] = [
  { id: 'intro', at: 0, label: 'Intro', tone: 'primary' },
  { id: 'problem', at: 40, label: 'Problem' },
  { id: 'fix', at: 70, label: 'Fix', tone: 'success' },
  { id: 'outro', at: 100, label: 'Outro' },
]

const STEP_LABELS = ['Plan', 'Build', 'Verify', 'Ship']

function Cell({ name, children }: { name: ProofComponent; children: ReactNode }) {
  return (
    <View testID={`proof-${name}`} className="w-[560px] justify-center">
      {children}
    </View>
  )
}

function ProofCells() {
  const raw = useRawLocalTime()
  const p = PROOF_COMPONENTS.map((_, i) => localTime(raw - i * STAGGER_S, CELL_DURATION_S).progress)
  return (
    <View className="flex-1 flex-row flex-wrap content-center justify-center gap-x-16 gap-y-20 p-16">
      <Cell name="ChapterCard">
        <ChapterCard index={1} kicker="Proof" title="Rendering under capture" progress={p[0]} />
      </Cell>
      <Cell name="AnimatedNumber">
        <AnimatedNumber value={1280} progress={p[1]} size="lg" />
      </Cell>
      <Cell name="StatCard">
        <StatCard
          header={<StatCardHeader title="Frames captured" />}
          figure={<AnimatedNumber value={90} progress={p[2]} mode="reel" size="lg" />}
          caption="at 30 fps"
        />
      </Cell>
      <Cell name="ProgressSteps">
        <ProgressSteps
          variant="rail"
          currentStep={0}
          totalSteps={STEP_LABELS.length}
          labels={STEP_LABELS}
          progress={p[3] * (STEP_LABELS.length - 1)}
          size="lg"
        />
      </Cell>
      <Cell name="Timeline">
        <Timeline accessibilityLabel="Video chapters" items={CHAPTERS} playhead={p[4]} />
      </Cell>
      <Cell name="EvidenceChip">
        <View style={{ opacity: p[5] }}>
          <EvidenceChip kind="verified" text="ab@1a2b3c4:src/capture/page.ts:12-30" fontPx={28} />
        </View>
      </Cell>
    </View>
  )
}

/** One beat across the whole timeline: six react-ui components, each driven by its own window. */
export function ProofBeat() {
  return (
    <Beat startS={0} durationS={PROOF_DURATION_S}>
      <BeatFrame kind="rnw-proof" className="bg-background-base">
        <ProofCells />
      </BeatFrame>
    </Beat>
  )
}
