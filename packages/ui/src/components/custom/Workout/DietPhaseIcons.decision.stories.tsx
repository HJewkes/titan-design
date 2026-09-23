// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Pill } from '../../ui/pill'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { DIET_PHASE_ICON, type DeclaredDietPhase } from './wholeBodyCardParts'

/** The four declared phases, as the owner named them in round 4. */
const PHASES: { phase: DeclaredDietPhase; name: string }[] = [
  { phase: 'fat-loss', name: 'Cut' },
  { phase: 'gain', name: 'Bulk' },
  { phase: 'maintenance', name: 'Maintenance' },
  { phase: 'recomposition', name: 'Recomp' },
]

const LARGE = 48
const PILL_ICON = 13

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-stack-sm" style={{ alignItems: 'center', width: 150 }}>
      <Typography variant="overline" color="tertiary">
        {title}
      </Typography>
      {children}
    </View>
  )
}

function Row({ phase, name }: { phase: DeclaredDietPhase; name: string }) {
  const Glyph = DIET_PHASE_ICON[phase]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-lg">
      <View style={{ width: 150 }}>
        <Typography variant="body1">{name}</Typography>
      </View>
      <Column title="Glyph">
        <Glyph size={LARGE} />
      </Column>
      <Column title="In the pill">
        <Pill tone="neutral" variant="outline" size="sm" leading={<Glyph size={PILL_ICON} />}>
          {name}
        </Pill>
      </Column>
      <Column title="Collapsed">
        <Pill tone="neutral" variant="outline" size="sm">
          <Glyph size={PILL_ICON} />
        </Pill>
      </Column>
    </View>
  )
}

function DietPhaseIcons() {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-stack-md">
      {PHASES.map((row) => (
        <Row key={row.phase} phase={row.phase} name={row.name} />
      ))}
    </Surface>
  )
}

const meta: Meta<typeof DietPhaseIcons> = {
  title: 'Lab/Decisions/Diet Phase Icons',
  component: DietPhaseIcons,
  tags: ['autodocs', 'status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CHOSEN (VW-455 round 4, owner: "All four work"): the glyph each diet phase carries ' +
          'on the bodyweight card, drawn from the shipped `DIET_PHASE_ICON` map so this record ' +
          'cannot drift from the card. Shown large, inside its pill, and collapsed to the glyph ' +
          'alone, as a narrow card draws it. The alternates shown in round 4 are recorded in ' +
          'REJECTED.md.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof DietPhaseIcons>

/** The four phases and their chosen glyphs. */
export const Default: Story = {}
