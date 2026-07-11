// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/coaching/CoachingCueCard.tsx
// Rating:   High · titan equiv: none (no AI coaching-cue card)
// Why:      Color-coded-by-type card (info/load-adjustment/encouragement) with a
//           suggested-weight chip + thumbs-up/down reaction pills. titan has no
//           coaching-cue primitive. Slide-in reanimated entrance stripped — static.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, TouchableOpacity } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'
import { InfoIcon, DumbbellIcon, StarIcon } from '../../../icons'

const t = getSemanticColors('dark')

type CueType = 'informational' | 'load_adjustment' | 'encouragement'
type Reaction = 'thumbs_up' | 'thumbs_down' | null

const CUE_CONFIG: Record<
  CueType,
  { bg: string; accent: string; label: string; Icon: typeof InfoIcon }
> = {
  informational: {
    bg: alpha(t['brand-primary'], 0.12),
    accent: t['brand-primary'],
    label: 'Insight',
    Icon: InfoIcon,
  },
  load_adjustment: {
    bg: alpha(t['status-warning'], 0.12),
    accent: t['status-warning'],
    label: 'Load Adjustment',
    Icon: DumbbellIcon,
  },
  encouragement: {
    bg: alpha(t['status-success'], 0.12),
    accent: t['status-success'],
    label: 'Coach',
    Icon: StarIcon,
  },
}

function ReactionPill({
  active,
  activeColor,
  label,
}: {
  active: boolean
  activeColor: string
  label: string
}) {
  return (
    <TouchableOpacity
      onPress={() => {}}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: active ? alpha(activeColor, 0.2) : alpha(t['text-disabled'], 0.1),
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: active ? activeColor : t['text-disabled'],
        }}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: '500',
          color: active ? activeColor : t['text-disabled'],
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

/** Static faithful re-render of the mobile CoachingCueCard (no slide-in, no auto-dismiss timer). */
function CoachingCueCardSpecimen({
  type,
  message,
  suggestedWeight,
  reaction,
}: {
  type: CueType
  message: string
  suggestedWeight?: number
  reaction: Reaction
}) {
  const cfg = CUE_CONFIG[type]
  return (
    <View style={{ width: 320, borderRadius: 16, padding: 16, backgroundColor: cfg.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <cfg.Icon size={24} color={cfg.accent} />
        <Text
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: '600',
            color: cfg.accent,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {cfg.label}
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={{ fontSize: 16, color: t['text-disabled'] }}>×</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: t['text-primary'] }}>
        {message}
      </Text>

      {type === 'load_adjustment' && suggestedWeight != null && (
        <View
          style={{
            marginTop: 8,
            alignSelf: 'flex-start',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: alpha(cfg.accent, 0.15),
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: cfg.accent }}>
            Suggested: {suggestedWeight} lbs
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <ReactionPill
          active={reaction === 'thumbs_up'}
          activeColor={t['status-success']}
          label="Helpful"
        />
        <ReactionPill
          active={reaction === 'thumbs_down'}
          activeColor={t['status-error']}
          label="Not useful"
        />
      </View>
    </View>
  )
}

const meta: Meta<typeof CoachingCueCardSpecimen> = {
  title: 'Lab/Candidates/Coaching/CoachingCueCard',
  component: CoachingCueCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). AI coaching-cue card, tinted by ' +
          'type (info/load-adjustment/encouragement), with a suggested-weight chip and thumbs-up/down ' +
          'reaction pills. Slide-in entrance + auto-dismiss timer stripped. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CoachingCueCardSpecimen>

export const Informational: Story = {
  args: {
    type: 'informational',
    message: 'Your bar speed has been consistent across all 4 sets — good pacing.',
    reaction: null,
  },
}
export const LoadAdjustmentWithWeight: Story = {
  args: {
    type: 'load_adjustment',
    message: 'Velocity is climbing fast — this weight may be too light for your target zone.',
    suggestedWeight: 205,
    reaction: null,
  },
}
export const EncouragementRated: Story = {
  args: {
    type: 'encouragement',
    message: "That's a rep PR at this weight. Great work pushing through.",
    reaction: 'thumbs_up',
  },
}
