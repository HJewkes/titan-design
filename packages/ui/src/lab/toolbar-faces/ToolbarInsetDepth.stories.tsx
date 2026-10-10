import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Surface, useOnSurfaceColor, useSurfaceMode } from '../../components/ui/surface'
import { ToolbarButton, ToolbarButtonGroup } from '../../components/ui/toolbar-button'
import { getPressedRecessShadow } from '../../theme/elevation'
import { getSemanticColors } from '../../theme/tokens/semantic'

/**
 * Lab/ToolbarFaces — the owner's pick for the toolbar inset depth (Gate 2 batch 7,
 * td10-ship / td265-ship): the active face now comes from the elevation system,
 * one plane DOWN from the toolbar with the recess. Row B shows the same face two
 * planes down, built from `<Surface elevation={-2}>`; the control row is the
 * `control-face-active` token #747 painted. Switch the toolbar theme to compare
 * light and dark. Delete once the depth is recorded.
 */
const meta: Meta = {
  title: 'Lab/ToolbarFaces/Inset Depth',
  tags: ['status:lab', '!status:review'],
}
export default meta

const Glyph = ({ glyph }: { glyph: string }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <Text className="text-on-control-active" style={{ fontSize: 16 }}>
      {glyph}
    </Text>
  </View>
)

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: useOnSurfaceColor('secondary'),
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
      }}
    >
      {children}
    </Text>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>{children}</View>
    </View>
  )
}

/** A face built straight from Surface, with the ToolbarButton md box and label. */
function SurfaceFace({ label, elevation }: { label: string; elevation: -2 | 1 }) {
  return (
    <Surface elevation={elevation} rounded={false} className="px-2.5 py-1 min-h-[30px] rounded">
      <View className="flex-row items-center justify-center">
        <Glyph glyph="⏣" />
        <Text className="font-bold text-sm ml-2 text-on-control-active">{label}</Text>
      </View>
    </Surface>
  )
}

/** The #747 control: the silver / grey-900 `control-face-active` token with the recess. */
function TokenFace({ label }: { label: string }) {
  const fill = getSemanticColors(useSurfaceMode())['control-face-active']
  return (
    <View
      className="flex-row items-center justify-center px-2.5 py-1 min-h-[30px] rounded"
      style={{ backgroundColor: fill, ...getPressedRecessShadow(fill) }}
    >
      <Glyph glyph="⏣" />
      <Text className="font-bold text-sm ml-2 text-on-control-active">{label}</Text>
    </View>
  )
}

function InsetDepth() {
  return (
    <Surface level="elevated" rounded className="p-6 gap-6">
      <Row label="A — SHIPPED: ONE PLANE DOWN (SURFACE PRESSED), RAISED ONE PLANE UP">
        <ToolbarButtonGroup gap="sm">
          <ToolbarButton label="Filters" icon={<Glyph glyph="⏣" />} isActive />
          <ToolbarButton label="Settings" icon={<Glyph glyph="⚙" />} isActive={false} />
          <ToolbarButton label="View" icon={<Glyph glyph="◉" />} isActive={false} />
        </ToolbarButtonGroup>
      </Row>
      <Row label="B — TWO PLANES DOWN (SURFACE ELEVATION -2), SAME RAISED FACE">
        <SurfaceFace label="Filters" elevation={-2} />
        <SurfaceFace label="Settings" elevation={1} />
        <SurfaceFace label="View" elevation={1} />
      </Row>
      <Row label="CONTROL — #747 AS REVIEWED: CONTROL-FACE-ACTIVE TOKEN WITH THE RECESS">
        <TokenFace label="Filters" />
        <SurfaceFace label="Settings" elevation={1} />
        <SurfaceFace label="View" elevation={1} />
      </Row>
    </Surface>
  )
}

export const Default: StoryObj = {
  render: () => <InsetDepth />,
}
