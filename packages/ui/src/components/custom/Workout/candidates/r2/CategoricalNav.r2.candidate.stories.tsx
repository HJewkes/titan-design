// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). Selection
// state is passed as a static prop rather than owned locally — this shows
// the LOOK only.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/nav.tsx + r2.css `.r2-nav`
// Rating:   Medium · titan equiv: shell `SideNav` / `NavItem` — R2's version is a slim 62px
//           icon-only rail (glyph + tiny label) with NO "Idle" tab (idle is a state of Live);
//           `SideNav` is the wider labeled app-shell nav
// Why:      C's top-level section switch (Live / Review / Program / Body / Specs) — compare
//           against the shipped `SideNav` to decide whether the dashboard needs a second,
//           denser nav tier or should fold into the existing one.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

const ITEMS = [
  { key: 'live', label: 'Live', glyph: '∿' },
  { key: 'review', label: 'Review', glyph: '▮▮' },
  { key: 'program', label: 'Program', glyph: '▦' },
  { key: 'body', label: 'Body', glyph: '☰' },
  { key: 'specimens', label: 'Specs', glyph: '▤' },
] as const

/** Static faithful re-render of the R2 CategoricalNav — slim icon rail. */
function CategoricalNavSpecimen({ active }: { active: (typeof ITEMS)[number]['key'] }) {
  return (
    <View
      style={{
        width: 62,
        paddingTop: 10,
        gap: 4,
        alignItems: 'center',
        backgroundColor: t['background-subtle'],
        borderRightWidth: 1,
        borderRightColor: t['border-default'],
      }}
    >
      {ITEMS.map((it) => {
        const on = it.key === active
        return (
          <Pressable
            key={it.key}
            onPress={() => {}}
            style={{
              width: 48,
              height: 48,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              backgroundColor: on ? 'rgba(255,121,0,0.14)' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 15, color: on ? t['brand-primary'] : t['text-tertiary'] }}>
              {it.glyph}
            </Text>
            <Text
              style={{
                fontSize: 8,
                fontWeight: '700',
                letterSpacing: 0.3,
                color: on ? t['brand-primary'] : t['text-tertiary'],
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const meta: Meta<typeof CategoricalNavSpecimen> = {
  title: 'Lab/Candidates/R2Live/CategoricalNav',
  component: CategoricalNavSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). A 62px ' +
          'icon-only section rail (Live / Review / Program / Body / Specs, no Idle tab — idle ' +
          'is a state of Live). Compare against the shipped shell `SideNav`. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CategoricalNavSpecimen>

export const OnLive: Story = { args: { active: 'live' } }
export const OnReview: Story = { args: { active: 'review' } }
export const OnBody: Story = { args: { active: 'body' } }
