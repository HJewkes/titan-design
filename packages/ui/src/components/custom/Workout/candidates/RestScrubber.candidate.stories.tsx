// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/RestScrubber.tsx
// Rating:   Medium · titan equiv: none (no horizontal scrub-to-set-duration control)
// Why:      Track + pill-on-track control that morphs across editing/resting/complete
//           states — titan has no comparable horizontal duration scrubber.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

const SCRUBBER_HEIGHT = 32

type RestScrubberMode = 'editing' | 'resting' | 'complete'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface RestScrubberSpecimenProps {
  restSeconds: number
  mode: RestScrubberMode
  elapsedMs?: number
}

/** Static re-render of the mobile RestScrubber. Drag (JogPill/PanResponder) stripped;
 * the 'editing' pill is rendered at rest with no stretch. */
function RestScrubberSpecimen({ restSeconds, mode, elapsedMs = 0 }: RestScrubberSpecimenProps) {
  const progress =
    mode === 'resting' ? Math.min(1, elapsedMs / (restSeconds * 1000)) : mode === 'complete' ? 1 : 0
  const elapsedS = Math.round(elapsedMs / 1000)
  const trackColor =
    mode === 'resting' ? alpha(t['brand-primary'], 0.2) : alpha(t['text-disabled'], 0.08)
  const fillColor = mode === 'resting' ? t['brand-primary'] : alpha(t['text-disabled'], 0.25)
  const label =
    mode === 'resting'
      ? `${formatTime(elapsedS)} / ${formatTime(restSeconds)}`
      : formatTime(restSeconds)

  return (
    <View
      style={{
        width: 220,
        height: SCRUBBER_HEIGHT,
        justifyContent: 'center',
        paddingHorizontal: 12,
      }}
    >
      <View
        style={{ height: 3, borderRadius: 1.5, backgroundColor: trackColor, overflow: 'hidden' }}
      >
        {progress > 0 && (
          <View
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              borderRadius: 1.5,
              backgroundColor: fillColor,
            }}
          />
        )}
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
        {mode === 'editing' ? (
          <View
            style={{
              minWidth: 64,
              minHeight: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: alpha(t['text-tertiary'], 0.15),
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: t['text-tertiary'],
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatTime(restSeconds)}
            </Text>
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor:
                mode === 'resting' ? alpha(t['brand-primary'], 0.25) : alpha('#000', 0.6),
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: mode === 'resting' ? t['brand-primary'] : t['text-secondary'],
                fontVariant: ['tabular-nums'],
              }}
            >
              {label}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const meta: Meta<typeof RestScrubberSpecimen> = {
  title: 'Lab/Candidates/Rest/RestScrubber',
  component: RestScrubberSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Horizontal pill-on-track for rest ' +
          'duration; the pill morphs across editing (draggable jog), resting (progress fill), and ' +
          'complete (muted) states. titan has no comparable scrubber. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RestScrubberSpecimen>

export const Editing: Story = { args: { restSeconds: 90, mode: 'editing' } }
export const Resting: Story = { args: { restSeconds: 90, mode: 'resting', elapsedMs: 52000 } }
export const Complete: Story = { args: { restSeconds: 90, mode: 'complete', elapsedMs: 90000 } }
