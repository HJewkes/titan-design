import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { alpha } from '../utils/colors'
import { getSemanticColors } from './tokens/semantic'
import { primitiveColors } from './tokens/primitives'
import { SectionIntro, SectionTitle, SWATCH_BORDER } from './color-story-kit'

const t = getSemanticColors('dark')

/**
 * Foundations/Color/Alpha — deriving a translucent colour from a token instead
 * of hardcoding an `rgba(...)` triple.
 *
 * `alpha(color, opacity)` (`packages/ui/src/utils/colors.ts`) takes a RESOLVED
 * colour — a hex string or an `rgb()`/`rgba()` string, e.g. a semantic token's
 * value or a primitive — and returns it as `rgba(r, g, b, opacity)`. It does
 * NOT take a token name: `alpha('brand-primary', 0.1)` would try to parse the
 * literal string `'brand-primary'` as a colour and fail. Resolve the token
 * first (`t['brand-primary']`, `primitiveColors.white`, …), then wrap it.
 *
 * The payoff over a hand-picked `rgba(255, 121, 0, 0.1)`: when a ramp gets
 * re-spaced or a semantic mapping moves, every `alpha()` call built on that
 * token moves with it. A literal triple silently drifts from the token it was
 * copied from and stays wrong until someone notices — the failure mode VW-78
 * was opened to burn down (see `eslint-rules/raw-color-baseline.json`,
 * enforced by `no-raw-color`'s `functional` rule).
 */
const meta: Meta = {
  title: 'Foundations/Color/Alpha',
  tags: ['autodocs'],
}

export default meta

const EXAMPLES = [
  { name: 'brand-primary @ 0.12', value: alpha(t['brand-primary'], 0.12) },
  { name: 'status-success @ 0.15', value: alpha(t['status-success'], 0.15) },
  { name: 'status-warning @ 0.25', value: alpha(t['status-warning'], 0.25) },
  { name: 'status-error @ 0.3', value: alpha(t['status-error'], 0.3) },
  { name: 'primitiveColors.white @ 0.08', value: alpha(primitiveColors.white, 0.08) },
] as const

function AlphaSwatch({ name, value }: { name: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', width: 96 }}>
      <View
        style={{
          width: 96,
          height: 64,
          borderRadius: 8,
          backgroundColor: t['surface-elevated'],
          borderWidth: 1,
          borderColor: SWATCH_BORDER,
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1, backgroundColor: value }} />
      </View>
      <Text className="text-text-secondary text-xs mt-1" style={{ textAlign: 'center' }}>
        {name}
      </Text>
      <Text className="text-text-tertiary" style={{ fontSize: 9, marginTop: 1 }}>
        {value}
      </Text>
    </View>
  )
}

export const Default: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Alpha</Text>
      <SectionIntro>
        `alpha(color, opacity)` derives a translucent colour from a RESOLVED token or primitive
        instead of a hand-picked `rgba(...)` triple, so the wash tracks the token it came from. Each
        swatch below is rendered over the elevated surface plane so the translucency is visible.
      </SectionIntro>

      <SectionTitle>Usage</SectionTitle>
      <View
        style={{
          backgroundColor: t['surface-raised'],
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
        }}
      >
        <Text className="text-text-secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {"import { alpha } from '@/utils/colors'\n\n"}
          {"const t = getSemanticColors('dark')\n"}
          {"const wash = alpha(t['brand-primary'], 0.12)"}
        </Text>
      </View>

      <SectionTitle>Examples</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {EXAMPLES.map((example) => (
          <AlphaSwatch key={example.name} {...example} />
        ))}
      </View>
    </View>
  ),
}
