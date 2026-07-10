import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { 
  neumorphicShadows, 
  getHoverColors,
  type ShadowIntensity,
} from './shadows'

const meta: Meta = {
  title: 'Foundations/Shadows',
}

export default meta
type Story = StoryObj

// Sample button component to demonstrate shadows
interface ShadowBoxProps {
  label: string
  style: any
  bgColor?: string
  textColor?: string
}

function ShadowBox({ label, style, bgColor, textColor }: ShadowBoxProps) {
  return (
    <View
      className={bgColor ? undefined : 'bg-surface-elevated'}
      style={[
        bgColor ? { backgroundColor: bgColor } : undefined,
        {
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
          minWidth: 120,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text className={textColor ? undefined : 'text-text-primary font-semibold text-sm'} style={textColor ? { color: textColor, fontWeight: '600', fontSize: 14 } : undefined}>
        {label}
      </Text>
    </View>
  )
}

// Section header
function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="text-text-secondary text-sm font-semibold mb-3 mt-6">
      {children}
    </Text>
  )
}

// Subsection header
function SubHeader({ children }: { children: string }) {
  return (
    <Text className="text-text-secondary text-xs mb-2 mt-4">
      {children}
    </Text>
  )
}

export const NeumorphicShadows: Story = {
  render: () => (
    <View className="p-6">
      <Text className="text-text-primary text-xl font-bold mb-2">
        Neumorphic Shadows
      </Text>
      <Text className="text-text-secondary text-sm mb-6">
        Raised = floating above surface, Pressed = pushed into surface
      </Text>

      {/* Charcoal surface */}
      <View className="bg-surface-elevated p-6 rounded-xl mb-6">
        <Text className="text-text-secondary text-xs mb-4">
          Surface: Charcoal (#2C2C2C)
        </Text>

        <SubHeader>Raised (element floats above surface)</SubHeader>
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          <ShadowBox label="Subtle" style={neumorphicShadows.charcoal.raised.subtle} />
          <ShadowBox label="Medium" style={neumorphicShadows.charcoal.raised.medium} />
          <ShadowBox label="Strong" style={neumorphicShadows.charcoal.raised.strong} />
        </View>

        <SubHeader>Pressed (element pushed into surface)</SubHeader>
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          <ShadowBox label="Subtle" style={neumorphicShadows.charcoal.pressed.subtle} />
          <ShadowBox label="Medium" style={neumorphicShadows.charcoal.pressed.medium} />
          <ShadowBox label="Strong" style={neumorphicShadows.charcoal.pressed.strong} />
        </View>
      </View>

      {/* Code example */}
      <View className="bg-surface-base p-4 rounded-lg">
        <Text className="text-text-secondary text-[11px] font-mono">
{`import { neumorphicShadows } from '@titan-design/react-ui'

// Apply to a View
<View style={neumorphicShadows.charcoal.raised.subtle} />
<View style={neumorphicShadows.charcoal.pressed.medium} />

/* Raised - soft shadow + sharp rim light */
box-shadow: 
  2px 2px 4px rgba(0,0,0,0.5),
  -2px -2px 1px rgba(255,255,255,0.12);

/* Pressed - inset shadow + thin rim light */
box-shadow: 
  inset 2px 2px 4px rgba(0,0,0,0.6),
  inset -1px -1px 1px rgba(255,255,255,0.12);`}
        </Text>
      </View>
    </View>
  ),
  decorators: [
    (Story) => (
      <View className="bg-background-base min-h-screen p-4">
        <Story />
      </View>
    ),
  ],
}

export const IntensityLevels: Story = {
  render: () => (
    <View className="p-6">
      <Text className="text-text-primary text-xl font-bold mb-2">
        Shadow Intensity Levels
      </Text>
      <Text className="text-text-secondary text-sm mb-6">
        subtle (1px/2px) → medium (2px/4px) → strong (2px/5px)
      </Text>

      <View className="bg-surface-elevated p-6 rounded-xl">
        <SubHeader>Raised Intensities</SubHeader>
        <View style={{ flexDirection: 'row', gap: 24, marginBottom: 24 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Subtle" style={neumorphicShadows.charcoal.raised.subtle} />
            <Text className="text-text-secondary text-[10px]">1px / 2px blur</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Medium" style={neumorphicShadows.charcoal.raised.medium} />
            <Text className="text-text-secondary text-[10px]">2px / 4px blur</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Strong" style={neumorphicShadows.charcoal.raised.strong} />
            <Text className="text-text-secondary text-[10px]">2px / 5px blur</Text>
          </View>
        </View>

        <SubHeader>Pressed Intensities (thin 1px rim highlight)</SubHeader>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Subtle" style={neumorphicShadows.charcoal.pressed.subtle} />
            <Text className="text-text-secondary text-[10px]">1px / 2px blur</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Medium" style={neumorphicShadows.charcoal.pressed.medium} />
            <Text className="text-text-secondary text-[10px]">2px / 4px blur</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Strong" style={neumorphicShadows.charcoal.pressed.strong} />
            <Text className="text-text-secondary text-[10px]">2px / 5px blur</Text>
          </View>
        </View>
      </View>
    </View>
  ),
  decorators: [
    (Story) => (
      <View className="bg-background-base min-h-screen p-4">
        <Story />
      </View>
    ),
  ],
}

// Interactive button using color math - adapts to any background brightness
interface ColorMathButtonProps {
  surface: 'charcoal' | 'neutralDark' | 'neutralLight'
  bgColor: string
  textColor?: string
}

function ColorMathButton({ surface, bgColor, textColor = '#fff' }: ColorMathButtonProps) {
  const [isActive, setIsActive] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  
  const shadows = neumorphicShadows[surface]
  const hoverColors = getHoverColors(bgColor, 'medium')
  
  const getShadowStyle = () => {
    if (isActive) {
      return isHovered ? shadows.pressedHover.medium : shadows.pressed.medium
    }
    return isHovered ? shadows.raisedHover.medium : shadows.raised.medium
  }
  
  // Use color math for hover - automatically adapts to brightness!
  const getBgColor = () => {
    if (!isHovered) return bgColor
    return isActive ? hoverColors.pressed : hoverColors.raised
  }
  
  return (
    <View
      // @ts-expect-error - web events
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsActive(!isActive)}
      style={[
        {
          backgroundColor: getBgColor(),
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
          minWidth: 100,
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s ease, background-color 0.15s ease',
        } as any,
        getShadowStyle(),
      ]}
    >
      <Text style={{ color: textColor, fontWeight: '600', fontSize: 14 }}>
        {isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  )
}


export const SurfaceVariants: Story = {
  render: function Render() {
    // Show calculated hover colors for each surface
    const charcoalHover = getHoverColors('#3C3C3C', 'medium')
    const neutralDarkHover = getHoverColors('#374151', 'medium')
    const neutralLightHover = getHoverColors('#E5E7EB', 'medium')
    
    return (
      <View className="p-6">
        <Text className="text-text-primary text-xl font-bold mb-2">
          Surface Variants with Color Math
        </Text>
        <Text className="text-text-secondary text-sm mb-6">
          Hover colors calculated using HSV - just pass any background color!
        </Text>

        {/* Charcoal Surface */}
        <View className="bg-surface-elevated p-6 rounded-xl mb-4">
          <Text className="text-text-secondary text-xs mb-2">Charcoal Surface (#2C2C2C)</Text>
          <Text className="text-text-secondary text-[10px] mb-4">
            Hover: raised → {charcoalHover.raised}, pressed → {charcoalHover.pressed}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <ColorMathButton surface="charcoal" bgColor="#3C3C3C" />
            <ColorMathButton surface="charcoal" bgColor="#3C3C3C" />
          </View>
        </View>

        {/* Neutral Dark Surface */}
        <View className="bg-surface-elevated p-6 rounded-xl mb-4">
          <Text className="text-text-secondary text-xs mb-2">Neutral Dark Surface (#1F2937)</Text>
          <Text className="text-text-secondary text-[10px] mb-4">
            Hover: raised → {neutralDarkHover.raised}, pressed → {neutralDarkHover.pressed}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <ColorMathButton surface="neutralDark" bgColor="#374151" />
            <ColorMathButton surface="neutralDark" bgColor="#374151" />
          </View>
        </View>

        {/* Neutral Light Surface */}
        <View className="bg-surface-elevated p-6 rounded-xl">
          <Text className="text-text-secondary text-xs mb-2">Neutral Light Surface (#E5E7EB)</Text>
          <Text className="text-text-secondary text-[10px] mb-4">
            Hover: raised → {neutralLightHover.raised}, pressed → {neutralLightHover.pressed}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <ColorMathButton surface="neutralLight" bgColor="#E5E7EB" textColor="#374151" />
            <ColorMathButton surface="neutralLight" bgColor="#E5E7EB" textColor="#374151" />
          </View>
        </View>

        {/* Code example */}
        <View className="bg-surface-base p-4 rounded-lg mt-4">
          <Text className="text-text-secondary text-[11px] font-mono">
{`import { getHoverColors, lighten, darken } from '@titan-design/react-ui'

// Get hover colors for a button background
const hover = getHoverColors('#3C3C3C', 'medium')
// → { raised: '#414141', pressed: '#373737' }

// Or use individual functions (HSV-based)
lighten('#3C3C3C', 0.02)  // Increase V by 0.02
darken('#3C3C3C', 0.02)   // Decrease V by 0.02`}
          </Text>
        </View>
      </View>
    )
  },
  decorators: [
    (Story) => (
      <View className="bg-background-base min-h-screen p-4">
        <Story />
      </View>
    ),
  ],
}

export const HoverStates: Story = {
  render: () => (
    <View className="p-6">
      <Text className="text-text-primary text-xl font-bold mb-2">
        Hover State Shadows
      </Text>
      <Text className="text-text-secondary text-sm mb-6">
        Hover reduces shadow depth to indicate interactivity (removes rim light, halves offset/blur)
      </Text>

      <View className="bg-surface-elevated p-6 rounded-xl">
        <SubHeader>Raised → Raised Hover (medium intensity)</SubHeader>
        <View style={{ flexDirection: 'row', gap: 24, marginBottom: 24 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Raised" style={neumorphicShadows.charcoal.raised.medium} />
            <Text className="text-text-secondary text-[10px]">Normal</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Raised Hover" style={neumorphicShadows.charcoal.raisedHover.medium} />
            <Text className="text-text-secondary text-[10px]">Hover</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Flat" style={neumorphicShadows.charcoal.flat} />
            <Text className="text-text-secondary text-[10px]">Alt: Flat</Text>
          </View>
        </View>

        <SubHeader>Pressed → Pressed Hover (medium intensity)</SubHeader>
        <View style={{ flexDirection: 'row', gap: 24, marginBottom: 24 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Pressed" style={neumorphicShadows.charcoal.pressed.medium} />
            <Text className="text-text-secondary text-[10px]">Normal</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Pressed Hover" style={neumorphicShadows.charcoal.pressedHover.medium} />
            <Text className="text-text-secondary text-[10px]">Hover</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Flat" style={neumorphicShadows.charcoal.flat} />
            <Text className="text-text-secondary text-[10px]">Alt: Flat</Text>
          </View>
        </View>

        <SubHeader>All Intensities - Raised Hover</SubHeader>
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Subtle" style={neumorphicShadows.charcoal.raisedHover.subtle} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Medium" style={neumorphicShadows.charcoal.raisedHover.medium} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Strong" style={neumorphicShadows.charcoal.raisedHover.strong} />
          </View>
        </View>

        <SubHeader>All Intensities - Pressed Hover</SubHeader>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Subtle" style={neumorphicShadows.charcoal.pressedHover.subtle} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Medium" style={neumorphicShadows.charcoal.pressedHover.medium} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ShadowBox label="Strong" style={neumorphicShadows.charcoal.pressedHover.strong} />
          </View>
        </View>
      </View>

      <View className="bg-surface-base p-4 rounded-lg mt-4">
        <Text className="text-text-secondary text-[11px] font-mono">
{`/* Hover shadows - reduced depth, rim light preserved */

/* Raised Hover (medium) - rim offset stays same to prevent "shrink" */
box-shadow: 
  1px 1px 2px rgba(0,0,0,0.5),        /* reduced dark shadow */
  -2px -2px 1px rgba(255,255,255,0.12); /* same rim offset */

/* Pressed Hover (medium) */
box-shadow: 
  inset 1px 1px 2px rgba(0,0,0,0.6),  /* reduced dark shadow */
  inset -1px -1px 1px rgba(255,255,255,0.12); /* same rim offset */

/* Alternative: Flat (no shadow) */
box-shadow: none;`}
        </Text>
      </View>
    </View>
  ),
  decorators: [
    (Story) => (
      <View className="bg-background-base min-h-screen p-4">
        <Story />
      </View>
    ),
  ],
}

export const InteractiveDemo: Story = {
  render: function Render() {
    const [activeStates, setActiveStates] = React.useState({
      subtle: false,
      medium: false,
      strong: false,
    })
    const [hoveredStates, setHoveredStates] = React.useState({
      subtle: false,
      medium: false,
      strong: false,
    })
    
    const intensities: ShadowIntensity[] = ['subtle', 'medium', 'strong']
    const bgColor = '#3C3C3C'
    const hoverColors = getHoverColors(bgColor, 'medium')
    
    const getShadowStyle = (intensity: ShadowIntensity) => {
      const isActive = activeStates[intensity]
      const isHovered = hoveredStates[intensity]
      
      if (isActive) {
        return isHovered 
          ? neumorphicShadows.charcoal.pressedHover[intensity]
          : neumorphicShadows.charcoal.pressed[intensity]
      }
      return isHovered 
        ? neumorphicShadows.charcoal.raisedHover[intensity]
        : neumorphicShadows.charcoal.raised[intensity]
    }
    
    const getBgColor = (intensity: ShadowIntensity) => {
      const isActive = activeStates[intensity]
      const isHovered = hoveredStates[intensity]
      if (!isHovered) return bgColor
      return isActive ? hoverColors.pressed : hoverColors.raised
    }
    
    const getStateLabel = (intensity: ShadowIntensity) => {
      const isActive = activeStates[intensity]
      const isHovered = hoveredStates[intensity]
      if (isHovered) return isActive ? 'Pressed + Hover' : 'Raised + Hover'
      return isActive ? 'Pressed' : 'Raised'
    }
    
    return (
      <View className="p-6">
        <Text className="text-text-primary text-xl font-bold mb-2">
          Interactive Neumorphic Buttons
        </Text>
        <Text className="text-text-secondary text-sm mb-6">
          Click to toggle. Hover colors calculated via color math (adapts to brightness).
        </Text>

        <View className="bg-surface-elevated p-8 rounded-xl">
          <View className="flex-row gap-8 justify-center">
            {intensities.map((intensity) => (
              <View key={intensity} className="items-center gap-3">
                <Text className="text-text-secondary text-xs capitalize">
                  {intensity}
                </Text>
                <View
                  // @ts-expect-error - web events
                  onMouseEnter={() => setHoveredStates(s => ({ ...s, [intensity]: true }))}
                  onMouseLeave={() => setHoveredStates(s => ({ ...s, [intensity]: false }))}
                  onClick={() => setActiveStates(s => ({ ...s, [intensity]: !s[intensity] }))}
                  style={[
                    {
                      backgroundColor: getBgColor(intensity),
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s ease, background-color 0.15s ease, transform 0.15s ease',
                      transform: activeStates[intensity] ? 'scale(0.98)' : 'scale(1)',
                      minWidth: 120,
                      alignItems: 'center',
                    } as any,
                    getShadowStyle(intensity),
                  ]}
                >
                  <Text className="text-text-primary font-bold text-sm">
                    {activeStates[intensity] ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Text className="text-text-secondary text-[10px]">
                  {getStateLabel(intensity)}
                </Text>
              </View>
            ))}
          </View>
          
          <View className="mt-6 items-center">
            <Text className="text-text-secondary text-[11px]">
              {bgColor} → raised: {hoverColors.raised} | pressed: {hoverColors.pressed}
            </Text>
          </View>
        </View>
      </View>
    )
  },
  decorators: [
    (Story) => (
      <View className="bg-background-base min-h-screen p-4">
        <Story />
      </View>
    ),
  ],
}

