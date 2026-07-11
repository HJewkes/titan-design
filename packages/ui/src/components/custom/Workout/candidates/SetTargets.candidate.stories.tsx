// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/SetTargets.tsx
// Rating:   Medium · titan equiv: none (no inline multi-dial target configurator)
// Why:      A row of scroll-dial "combination lock" targets (Reps/RIR, 4-way
//           Tempo, Sets, Rest), each toggleable via a header pill. Dials are
//           frozen at a value here (no drag/scroll).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

function EnablePill({ label, active }: { label: string; active: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: active ? alpha(t['brand-primary'], 0.15) : '#1a1a1a',
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: active ? '700' : '500',
          color: active ? t['brand-primary'] : t['text-disabled'],
        }}
      >
        {label}
      </Text>
    </View>
  )
}

function Divider() {
  return (
    <View
      style={{ width: 1, height: 40, alignSelf: 'center', backgroundColor: alpha('#000000', 0.4) }}
    />
  )
}

/** Static dial: frozen at `value`, faded neighbor rows above/below (no scroll). */
function Dial({ value, active, width = 40 }: { value: string; active: boolean; width?: number }) {
  return (
    <View style={{ width, alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: t['text-disabled'], opacity: 0.3 }}>·</Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: active ? t['brand-primary'] : t['text-disabled'],
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 13, color: t['text-disabled'], opacity: 0.3 }}>·</Text>
    </View>
  )
}

interface SetTargetsSpecimenProps {
  effortOn: boolean
  effortLabel: string
  effortValue: string
  setsOn: boolean
  setsValue: string
  restOn: boolean
  restValue: string
  tempoOn: boolean
  con: string
  hold: string
  ecc: string
  pause: string
}

/** Static re-render of the 3-column SetTargets grid (Volume | Weight | Tempo). */
function SetTargetsSpecimen(p: SetTargetsSpecimenProps) {
  return (
    <View style={{ width: 420, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
      <View
        style={{
          flex: 3,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <View style={{ alignItems: 'center', flex: 1 }}>
          <EnablePill label={p.effortLabel} active={p.effortOn} />
          <View style={{ marginTop: 6 }}>
            <Dial value={p.effortOn ? p.effortValue : '–'} active={p.effortOn} />
          </View>
        </View>
        <Divider />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <EnablePill label="Sets" active={p.setsOn} />
          <View style={{ marginTop: 6 }}>
            <Dial value={p.setsOn ? p.setsValue : '–'} active={p.setsOn} />
          </View>
        </View>
        <Divider />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <EnablePill label="Rest" active={p.restOn} />
          <View style={{ marginTop: 6 }}>
            <Dial value={p.restOn ? p.restValue : '–'} active={p.restOn} />
          </View>
        </View>
      </View>
      <View style={{ flex: 3, alignItems: 'center' }}>
        <EnablePill label="Tempo" active={p.tempoOn} />
        <View style={{ marginTop: 6, flexDirection: 'row', gap: 3 }}>
          <Dial value={p.tempoOn ? p.con : '–'} active={p.tempoOn} width={32} />
          <Dial value={p.tempoOn ? p.hold : '–'} active={p.tempoOn} width={32} />
          <Dial value={p.tempoOn ? p.ecc : '–'} active={p.tempoOn} width={32} />
          <Dial value={p.tempoOn ? p.pause : '–'} active={p.tempoOn} width={32} />
        </View>
      </View>
    </View>
  )
}

const meta: Meta<typeof SetTargetsSpecimen> = {
  title: 'Lab/Candidates/Live/SetTargets',
  component: SetTargetsSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Inline multi-dial target ' +
          'configurator: toggleable Reps/RIR, 4-way Tempo, Sets, and Rest dials. titan has no ' +
          'equivalent inline configurator. Static specimen — dials frozen, no drag/scroll.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SetTargetsSpecimen>

export const AllEnabled: Story = {
  args: {
    effortOn: true,
    effortLabel: 'Reps',
    effortValue: '8',
    setsOn: true,
    setsValue: '4',
    restOn: true,
    restValue: '1:30',
    tempoOn: true,
    con: '3',
    hold: '1',
    ecc: '4',
    pause: '0',
  },
}
export const RepsOnly: Story = {
  args: {
    effortOn: true,
    effortLabel: 'RIR',
    effortValue: '2',
    setsOn: false,
    setsValue: '–',
    restOn: false,
    restValue: '–',
    tempoOn: false,
    con: '–',
    hold: '–',
    ecc: '–',
    pause: '–',
  },
}
export const AllOff: Story = {
  args: {
    effortOn: false,
    effortLabel: 'Reps',
    effortValue: '–',
    setsOn: false,
    setsValue: '–',
    restOn: false,
    restValue: '–',
    tempoOn: false,
    con: '–',
    hold: '–',
    ecc: '–',
    pause: '–',
  },
}
