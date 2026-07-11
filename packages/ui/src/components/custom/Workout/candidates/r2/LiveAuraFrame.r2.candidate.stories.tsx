// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// background treatment (voltras-mcp, branch feat/VMCP-r2-react-harness). The
// `r2aura` pulse keyframe is stripped (shown as its "on" frame) — this shows
// the LOOK only, in a still state.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/views-live.tsx (`aura-${aura}` on `.r2-live`)
//           + r2.css `.r2-live.aura-amber` / `.aura-red` / `@keyframes r2aura`
// Rating:   Low (background treatment, not a standalone widget) · titan equiv: none
// Why:      The shipped `auraFor()` background wash (radial gradient, amber at VL20 / red +
//           1.3s pulse at VL28) is the SAME mechanism the fable drill-down-pass Direction B
//           ("sticky hero lane" color-flood border+glow) and Direction C (V3 header
//           color-flood) both proposed independently for signaling fatigue state at a glance —
//           R2 shipped a page-background version; B/C proposed a card-border version. Included
//           here as the one fable "color-flood" concept with real shipped code to port
//           faithfully; the border+glow card treatment itself has no implementation yet (see
//           audit doc for that gap).
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, type ViewStyle } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

type Aura = '' | 'amber' | 'red'

const AURA_BG: Record<Aura, string> = {
  '': 'transparent',
  amber: 'radial-gradient(130% 95% at 50% 0%, rgba(255,176,32,0.12), transparent 62%)',
  red: 'radial-gradient(130% 95% at 50% 0%, rgba(209,67,67,0.18), transparent 62%)',
}

/** Static faithful re-render of R2's live-view background aura wash. */
function LiveAuraFrameSpecimen({ aura }: { aura: Aura }) {
  return (
    <View
      style={
        {
          width: 420,
          height: 200,
          borderRadius: 10,
          padding: 18,
          backgroundColor: t['background-base'],
          // react-native-web renders backgroundImage at runtime; not in RN ViewStyle types
          backgroundImage: AURA_BG[aura],
          borderWidth: 1,
          borderColor: t['border-default'],
        } as ViewStyle
      }
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: t['text-tertiary'],
        }}
      >
        Cable Row · Set 4/5
      </Text>
      <Text style={{ marginTop: 8, fontSize: 12, color: t['text-secondary'] }}>
        {aura === 'red'
          ? 'aura: red — VL28+, pulses 1.3s'
          : aura === 'amber'
            ? 'aura: amber — VL20 threshold reached'
            : 'aura: none — productive, quiet background'}
      </Text>
    </View>
  )
}

const meta: Meta<typeof LiveAuraFrameSpecimen> = {
  title: 'Lab/Candidates/R2Live/LiveAuraFrame',
  component: LiveAuraFrameSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). The live-view ' +
          'background wash that floods amber at VL20 and pulses red at VL28 — a fable-mined ' +
          '"color-flood" fatigue signal (Direction B/C both proposed it as a card border+glow; ' +
          'R2 shipped it as a page background). No titan equivalent. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LiveAuraFrameSpecimen>

export const Productive: Story = { args: { aura: '' } }
export const AmberThreshold: Story = { args: { aura: 'amber' } }
export const RedStop: Story = { args: { aura: 'red' } }
