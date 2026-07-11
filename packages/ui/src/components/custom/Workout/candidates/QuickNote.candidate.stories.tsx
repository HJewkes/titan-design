// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/QuickNote.tsx
// Rating:   Medium · titan equiv: none (no expandable pill→textarea note input)
// Why:      Compact collapsed pill that expands inline into a multiline note
//           field with a Save button. Rendered here in both fixed states
//           (expand-on-tap behavior removed); the `create-outline` glyph from
//           `@expo/vector-icons` is swapped for a plain text glyph.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, TextInput, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

/** Static faithful re-render of the mobile QuickNote's collapsed pill state. */
function QuickNoteCollapsedSpecimen({ placeholder = 'Add note...' }: { placeholder?: string }) {
  return (
    <Pressable
      onPress={() => {}}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: alpha(t['text-disabled'], 0.08),
      }}
    >
      <Text style={{ fontSize: 12, color: t['text-tertiary'] }}>✎</Text>
      <Text style={{ fontSize: 12, color: t['text-tertiary'] }}>{placeholder}</Text>
    </Pressable>
  )
}

/** Static faithful re-render of the mobile QuickNote's expanded textarea state. */
function QuickNoteExpandedSpecimen({
  text,
  placeholder = 'Add note...',
}: {
  text: string
  placeholder?: string
}) {
  return (
    <View
      style={{
        width: 280,
        borderRadius: 12,
        backgroundColor: alpha(t['text-disabled'], 0.08),
        padding: 10,
      }}
    >
      <TextInput
        value={text}
        editable={false}
        placeholder={placeholder}
        placeholderTextColor={t['text-disabled']}
        style={{
          fontSize: 13,
          color: t['text-primary'],
          minHeight: 56,
          textAlignVertical: 'top',
          padding: 0,
        }}
        multiline
      />
      <Pressable
        onPress={() => {}}
        style={{
          alignSelf: 'flex-end',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          backgroundColor: alpha(t['brand-primary'], 0.15),
          marginTop: 6,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: t['brand-primary'] }}>Save</Text>
      </Pressable>
    </View>
  )
}

const meta: Meta = {
  title: 'Lab/Candidates/Inputs/QuickNote',
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Collapsed pill expands inline into ' +
          'a multiline note field with Save. titan has no expandable pill→textarea input. Static ' +
          'specimen; rebuild for real if promoted.',
      },
    },
  },
}
export default meta

export const Collapsed: StoryObj<typeof QuickNoteCollapsedSpecimen> = {
  render: () => <QuickNoteCollapsedSpecimen />,
}

export const Expanded: StoryObj<typeof QuickNoteExpandedSpecimen> = {
  render: () => (
    <QuickNoteExpandedSpecimen text="Left shoulder felt tight on the last rep, backed off 10lb." />
  ),
}
