// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/ui/navigation/LinkCard.tsx
// Rating:   Medium · titan equiv: none (no icon-avatar nav-grid card)
// Why:      Square icon-avatar card used in menu grids (Workout / History /
//           Programs / Settings). titan has no equivalent nav-grid primitive.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

interface LinkCardItem {
  glyph: string
  iconColor: string
  iconBgColor: string
  title: string
  subtitle?: string
}

/** Static faithful re-render of a single mobile LinkCard (no navigation). */
function LinkCardSpecimen({ glyph, iconColor, iconBgColor, title, subtitle }: LinkCardItem) {
  return (
    <Pressable onPress={() => {}} style={{ flex: 1 }}>
      <View style={{ borderRadius: 16, backgroundColor: t['surface-elevated'], padding: 16 }}>
        <View
          style={{
            marginBottom: 16,
            width: 56,
            height: 56,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: iconBgColor,
          }}
        >
          <Text style={{ fontSize: 26, color: iconColor }}>{glyph}</Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '600', color: t['text-primary'] }}>{title}</Text>
        {subtitle && (
          <Text style={{ marginTop: 4, fontSize: 12, color: t['text-tertiary'] }}>{subtitle}</Text>
        )}
      </View>
    </Pressable>
  )
}

/** Grid layout wrapper — mirrors how LinkCard is used in menu screens. */
function LinkCardGridSpecimen({ items }: { items: LinkCardItem[] }) {
  return (
    <View style={{ width: 340, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {items.map((item) => (
        <View key={item.title} style={{ width: 158 }}>
          <LinkCardSpecimen {...item} />
        </View>
      ))}
    </View>
  )
}

const meta: Meta<typeof LinkCardGridSpecimen> = {
  title: 'Lab/Candidates/Nav/LinkCard',
  component: LinkCardGridSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Square icon-avatar navigation ' +
          'card used in menu grids. titan has no equivalent nav-grid primitive. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LinkCardGridSpecimen>

export const MainMenu: Story = {
  args: {
    items: [
      {
        glyph: '🏋️',
        iconColor: t['brand-primary'],
        iconBgColor: 'rgba(255,121,0,0.14)',
        title: 'Workout',
        subtitle: 'Start training',
      },
      {
        glyph: '📈',
        iconColor: t['status-info'],
        iconBgColor: 'rgba(59,130,246,0.14)',
        title: 'History',
        subtitle: 'Past sessions',
      },
      {
        glyph: '📋',
        iconColor: t['status-success'],
        iconBgColor: 'rgba(74,222,128,0.14)',
        title: 'Programs',
        subtitle: '3 active',
      },
      {
        glyph: '⚙️',
        iconColor: t['text-secondary'],
        iconBgColor: 'rgba(255,255,255,0.08)',
        title: 'Settings',
      },
    ],
  },
}

export const AnalyticsMenu: Story = {
  args: {
    items: [
      {
        glyph: '📊',
        iconColor: t['brand-secondary'],
        iconBgColor: 'rgba(48,123,155,0.14)',
        title: 'Fatigue Trends',
      },
      {
        glyph: '🎯',
        iconColor: t['status-warning'],
        iconBgColor: 'rgba(251,191,36,0.14)',
        title: 'PR Tracker',
      },
      {
        glyph: '⚖️',
        iconColor: t['status-error'],
        iconBgColor: 'rgba(239,68,68,0.14)',
        title: 'Balance',
        subtitle: 'Left vs right',
      },
    ],
  },
}
