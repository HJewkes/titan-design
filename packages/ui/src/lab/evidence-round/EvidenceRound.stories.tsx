import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { cn } from '../../utils/cn'
import { Pill, type PillTone } from '../../components/ui/pill'
import { ScaledPill } from '../../components/ui/pill/ScaledPill'
import { pillScale } from '../../components/ui/pill/pillScale'
import { ChipBand } from '../../components/ui/chip/ChipBand'
import { EvidenceChip } from '../../components/ui/chip/EvidenceChip'
import {
  EVIDENCE_KINDS,
  EVIDENCE_LABEL,
  EVIDENCE_TONE,
  type EvidenceKind,
} from '../../components/ui/chip/evidence'
import { layoutChipBand, type BandChip } from '../../components/ui/chip/chipBandLayout'
import { beatFixture } from '../../components/ui/chip/__fixtures__/evidence-chips'

/**
 * Lab/EvidenceRound — the TD-883 owner round. Every story is a 1920×1080 frame with
 * a 40 px reference bar and a headline for scale. Each `variant` arg is one answer
 * to a round question; the recommended default comes first. Delete once picked.
 */
const meta: Meta = {
  title: 'Lab/EvidenceRound',
  tags: ['status:lab', '!status:review'],
  parameters: { layout: 'fullscreen' },
}
export default meta

const PX = 40
const BAND = 1800
const MACHINE = beatFixture('a7-9-machine').chips
const LEAD = MACHINE[0]

function Frame({
  title,
  children,
  light,
}: {
  title: string
  children: ReactNode
  light?: boolean
}) {
  return (
    <View
      className={cn('bg-background-base', light && 'light')}
      style={{ width: 1920, height: 1080, padding: 60, gap: 36 }}
    >
      <Text className="font-heading font-semibold text-text-primary" style={{ fontSize: 72 }}>
        {title}
      </Text>
      <View className="flex-row items-center" style={{ gap: 16 }}>
        <View className="bg-brand-primary" style={{ width: 240, height: PX }} />
        <Text className="font-mono text-text-secondary" style={{ fontSize: 24 }}>
          40 px reference
        </Text>
      </View>
      {children}
    </View>
  )
}

function Plane({ light, children }: { light?: boolean; children: ReactNode }) {
  return (
    <View
      className={cn('bg-background-base flex-1 flex-row flex-wrap content-start', light && 'light')}
      style={{ padding: 24, gap: 20 }}
    >
      {children}
    </View>
  )
}

const TONES: Record<string, Partial<Record<EvidenceKind, PillTone>>> = {
  A: {},
  B: { 'our-framing': 'warning', computed: 'info' },
  C: { estimated: 'brand-secondary', target: 'brand-secondary' },
}

export const Q1Tones: StoryObj<{ variant: keyof typeof TONES }> = {
  args: { variant: 'A' },
  argTypes: { variant: { control: 'inline-radio', options: Object.keys(TONES) } },
  render: ({ variant }) => (
    <Frame title={`Q1 kind → tone, ${variant}`}>
      <View className="flex-row" style={{ gap: 24, flex: 1 }}>
        {[false, true].map((light) => (
          <Plane key={String(light)} light={light}>
            {EVIDENCE_KINDS.map((kind) => (
              <ScaledPill
                key={kind}
                tone={TONES[variant][kind] ?? EVIDENCE_TONE[kind]}
                label={EVIDENCE_LABEL[kind]}
                fontPx={PX}
              />
            ))}
          </Plane>
        ))}
      </View>
    </Frame>
  ),
}

function OneCapsule({ dot }: { dot: boolean }) {
  const { fontSize, paddingHorizontal, paddingVertical, gap } = pillScale(PX)
  const text = layoutChipBand([LEAD], { width: BAND }).leadElision.text
  return (
    <Pill
      tone={dot ? 'neutral' : EVIDENCE_TONE[LEAD.kind]}
      style={{ paddingHorizontal, paddingVertical, gap: gap * 2 }}
    >
      {dot ? (
        <View
          className="bg-status-success rounded-full"
          style={{ width: fontSize * 0.4, height: fontSize * 0.4 }}
        />
      ) : null}
      <Text className="font-heading font-semibold text-inherit" style={{ fontSize }}>
        {EVIDENCE_LABEL[LEAD.kind]}
      </Text>
      <Text className="font-mono text-inherit" style={{ fontSize }}>
        {text}
      </Text>
    </Pill>
  )
}

export const Q2Face: StoryObj<{ variant: 'A' | 'B' | 'C' }> = {
  args: { variant: 'A' },
  argTypes: { variant: { control: 'inline-radio', options: ['A', 'B', 'C'] } },
  render: ({ variant }) => (
    <Frame title={`Q2 chip face, ${variant}`}>
      {variant === 'A' ? (
        <ChipBand chips={[LEAD]} width={BAND} progress={1} />
      ) : (
        <OneCapsule dot={variant === 'C'} />
      )}
    </Frame>
  ),
}

export const Q3Size: StoryObj<{ fontPx: number }> = {
  args: { fontPx: 40 },
  argTypes: { fontPx: { control: 'inline-radio', options: [40, 44, 48] } },
  render: ({ fontPx }) => (
    <Frame title={`Q3 size, ${fontPx} px`}>
      <ChipBand chips={[LEAD]} width={BAND} fontPx={fontPx} progress={1} />
      <Text className="font-mono text-text-secondary" style={{ fontSize: 28 }}>
        {`citation budget: ${layoutChipBand([LEAD], { width: BAND, fontPx }).leadMaxChars} chars`}
      </Text>
    </Frame>
  ),
}

function TwoUp({ chips }: { chips: BandChip[] }) {
  const half = (BAND - 48) / 2
  return (
    <View className="flex-row" style={{ gap: 48 }}>
      {chips.slice(0, 2).map((chip) => {
        const { leadMaxChars, fits } = layoutChipBand([chip], { width: half })
        return (
          <View key={chip.text} className="overflow-hidden" style={{ width: half, gap: 8 }}>
            <EvidenceChip kind={chip.kind} text={chip.text} fontPx={PX} maxChars={leadMaxChars} />
            <Text className="font-mono text-text-secondary" style={{ fontSize: 24 }}>
              {`budget ${leadMaxChars} chars${fits ? '' : ', does not fit'}`}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export const Q4Band: StoryObj<{ variant: 'A' | 'B' | '2-up' }> = {
  args: { variant: 'A' },
  argTypes: { variant: { control: 'inline-radio', options: ['A', 'B', '2-up'] } },
  render: ({ variant }) => (
    <Frame title={`Q4 multi-chip band, ${variant}`}>
      {[beatFixture('b5-4-tick').chips, MACHINE].map((chips) =>
        variant === '2-up' ? (
          <TwoUp key={chips[0].text} chips={chips} />
        ) : (
          <ChipBand
            key={chips[0].text}
            chips={chips}
            width={BAND}
            max={variant === 'A' ? 3 : 1}
            progress={1}
          />
        )
      )}
    </Frame>
  ),
}

type EntryArgs = { progress: number; entry: 'rise' | 'fade'; reducedMotion: boolean }

export const Q5Entry: StoryObj<EntryArgs> = {
  args: { progress: 0.12, entry: 'rise', reducedMotion: false },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 1.5, step: 0.01 } },
    entry: { control: 'inline-radio', options: ['rise', 'fade'] },
  },
  render: ({ progress, entry, reducedMotion }) => (
    <Frame title={`Q5 entry, ${reducedMotion ? 'reduced motion' : entry} at ${progress} s`}>
      <ChipBand
        chips={MACHINE}
        width={BAND}
        progress={progress}
        entry={entry}
        reducedMotion={reducedMotion}
      />
    </Frame>
  ),
}
