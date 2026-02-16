/**
 * Elevation System Stories
 * 
 * Demonstrates the elevation hierarchy system with:
 * - All elevation levels (-2 to +5)
 * - Light and dark mode base colors
 * - Custom base colors from theme (orange, steel, etc.)
 * - Stacked layers with inset elements
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  getElevationConfig,
  getElevationSurface,
  getElevationShadow,
  getBaseSurfaceColor,
  type ElevationLevel,
} from './elevation'
import { useTheme } from '../utils/useTheme'
import { Card, CardContent, CardInset } from '../components/ui/card/Card'

const meta: Meta = {
  title: 'Theme/Elevation System',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Helper component to display an elevation level
function ElevationBox({
  level,
  baseColor,
  theme,
  label,
}: {
  level: ElevationLevel
  baseColor: string
  theme: 'light' | 'dark'
  label?: string
}) {
  const config = getElevationConfig(level)
  const surfaceColor = getElevationSurface(baseColor, level, theme)
  const shadowStyle = getElevationShadow(baseColor, level, theme)
  
  return (
    <View className="items-center gap-2">
      <View
        className="w-24 h-24 rounded-lg items-center justify-center"
        style={[
          { backgroundColor: surfaceColor },
          shadowStyle,
        ]}
      >
        <Text
          className="text-xs font-semibold"
          style={{
            color: theme === 'light' ? '#121828' : '#F3F4F6',
          }}
        >
          {level}
        </Text>
      </View>
      <View className="items-center">
        <Text className="text-xs font-medium text-text-primary">
          {label || config.name}
        </Text>
        <Text className="text-[10px] text-text-secondary mt-0.5">
          {surfaceColor}
        </Text>
      </View>
    </View>
  )
}

// Helper to show all elevations for a base color
function ElevationShowcase({
  baseColor,
  baseColorName,
  theme,
}: {
  baseColor: string
  baseColorName: string
  theme: 'light' | 'dark'
}) {
  const levels: ElevationLevel[] = [-2, -1, 0, 1, 2, 3, 4, 5]
  
  return (
    <View className="mb-8">
      <View className="mb-4">
        <Text className="text-lg font-semibold text-text-primary mb-1">
          {baseColorName}
        </Text>
        <Text className="text-sm text-text-secondary">
          Base: {baseColor} ({theme} mode)
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-6 justify-center">
        {levels.map((level) => (
          <ElevationBox
            key={level}
            level={level}
            baseColor={baseColor}
            theme={theme}
          />
        ))}
      </View>
    </View>
  )
}

export const LightModeBase: Story = {
  render: () => {
    const theme = 'light'
    const baseColor = getBaseSurfaceColor(theme)
    
    return (
      <View 
        className="p-6 min-h-screen"
        style={{ backgroundColor: '#EBEBEB' }}  // Light mode background-base
      >
        <View className="max-w-6xl mx-auto">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            Light Mode Base Color
          </Text>
          <Text className="text-sm text-text-secondary mb-6">
            Base color: {baseColor} (neutral[100] - #F3F4F6)
          </Text>
          <ElevationShowcase
            baseColor={baseColor}
            baseColorName="Light Mode Base"
            theme={theme}
          />
        </View>
      </View>
    )
  },
}

export const DarkModeBase: Story = {
  render: () => {
    const theme = 'dark'
    const baseColor = getBaseSurfaceColor(theme)
    
    return (
      <View 
        className="p-6 min-h-screen"
        style={{ backgroundColor: '#101010' }}  // Dark mode background-base
      >
        <View className="max-w-6xl mx-auto">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            Dark Mode Base Color
          </Text>
          <Text className="text-sm text-text-secondary mb-6">
            Base color: {baseColor} (charcoal[600] - #191919)
          </Text>
          <ElevationShowcase
            baseColor={baseColor}
            baseColorName="Dark Mode Base"
            theme={theme}
          />
        </View>
      </View>
    )
  },
}

export const CustomColors: Story = {
  render: () => {
    const theme = useTheme()
    const customColors = [
      { name: 'Orange', color: '#FF7900' },
      { name: 'Steel', color: '#406D87' },
      { name: 'Teal', color: '#14B8A6' },
      { name: 'Neutral Gray', color: '#6B7280' },
    ]
    
    return (
      <View className="p-6 min-h-screen bg-background-base">
        <View className="max-w-6xl mx-auto">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            Custom Base Colors
          </Text>
          <Text className="text-sm text-text-secondary mb-6">
            Elevation system works with any base color. These examples show how
            different colors create elevation hierarchies.
          </Text>
          {customColors.map(({ name, color }) => (
            <ElevationShowcase
              key={name}
              baseColor={color}
              baseColorName={name}
              theme={theme}
            />
          ))}
        </View>
      </View>
    )
  },
}

export const StackedLayers: Story = {
  render: () => {
    const theme = useTheme()
    const backgroundBase = theme === 'light' ? '#EBEBEB' : '#101010'
    
    return (
      <View 
        className="p-6 min-h-screen"
        style={{ backgroundColor: backgroundBase }}
      >
        <View className="max-w-4xl mx-auto gap-6">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            Stacked Layers - All Elevations
          </Text>
          <Text className="text-sm text-text-secondary mb-6">
            Cards at all 5 positive elevations (1-5) stacked to show the full hierarchy.
          </Text>
          
          {/* Stack all 5 elevations */}
          {([1, 2, 3, 4, 5] as const).map((elevation) => {
            const config = getElevationConfig(elevation)
            return (
              <Card key={elevation} elevation={elevation} className="p-6">
                <CardContent className="p-0">
                  <Text className="text-lg font-semibold text-text-primary mb-2">
                    Elevation {elevation} - {config.name}
                  </Text>
                  <Text className="text-sm text-text-secondary mb-4">
                    {config.description}
                  </Text>
                  {elevation >= 2 && (
                    <CardInset elevation={-1} className="p-4">
                      <Text className="text-sm text-text-secondary">
                        Inset element at elevation -1 (shallow inset)
                      </Text>
                    </CardInset>
                  )}
                </CardContent>
              </Card>
            )
          })}
          
          {/* Example with nested insets */}
          <Card elevation={3} className="p-6">
            <CardContent className="p-0">
              <Text className="text-lg font-semibold text-text-primary mb-4">
                Nested Inset Elements
              </Text>
              <CardInset elevation={-1} className="p-4 mb-4">
                <Text className="text-sm text-text-secondary mb-2">
                  Outer inset at -1
                </Text>
                <CardInset elevation={-2} className="p-3">
                  <Text className="text-xs text-text-secondary">
                    Inner inset at -2
                  </Text>
                </CardInset>
              </CardInset>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  },
}

export const ElevationComparison: Story = {
  render: () => {
    const theme = useTheme()
    const baseColor = getBaseSurfaceColor(theme)
    const backgroundBase = theme === 'light' ? '#EBEBEB' : '#101010'
    
    return (
      <View 
        className="p-6 min-h-screen"
        style={{ backgroundColor: backgroundBase }}
      >
        <View className="max-w-6xl mx-auto">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            Elevation Comparison
          </Text>
          <Text className="text-sm text-text-secondary mb-6">
            Side-by-side comparison of all elevation levels showing the visual hierarchy.
          </Text>
          
          <View className="flex-row flex-wrap gap-8 justify-center">
            {([-2, -1, 0, 1, 2, 3, 4, 5] as ElevationLevel[]).map((level) => {
              const config = getElevationConfig(level)
              const surfaceColor = getElevationSurface(baseColor, level, theme)
              const shadowStyle = getElevationShadow(baseColor, level, theme)
              
              return (
                <View key={level} className="items-center gap-3">
                  <View
                    className="w-32 h-32 rounded-xl items-center justify-center p-4"
                    style={[
                      { backgroundColor: surfaceColor },
                      shadowStyle,
                    ]}
                  >
                    <Text
                      className="text-2xl font-bold mb-1"
                      style={{
                        color: theme === 'light' ? '#121828' : '#F3F4F6',
                      }}
                    >
                      {level}
                    </Text>
                    <Text
                      className="text-xs text-center"
                      style={{
                        color: theme === 'light' ? '#65748B' : '#9CA3AF',
                      }}
                    >
                      {config.name}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xs font-medium text-text-primary text-center">
                      {config.description}
                    </Text>
                    <Text className="text-[10px] text-text-secondary mt-1 text-center">
                      {surfaceColor}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </View>
    )
  },
}

export const ComponentElevationRanges: Story = {
  render: () => {
    const theme = useTheme()
    const baseColor = getBaseSurfaceColor(theme)
    const backgroundBase = theme === 'light' ? '#EBEBEB' : '#101010'
    
    const componentRanges = [
      { name: 'Button', elevations: [2] as const },
      { name: 'Card', elevations: [1, 2, 3] as const },
      { name: 'Input', elevations: [-2, -1, 0] as const },
      { name: 'Overlay', elevations: [4, 5] as const },
    ]
    
    return (
      <View 
        className="p-6 min-h-screen"
        style={{ backgroundColor: backgroundBase }}
      >
        <View className="max-w-6xl mx-auto">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            Component Elevation Ranges
          </Text>
          <Text className="text-sm text-text-secondary mb-6">
            Each component type has a specific range of allowed elevations for visual consistency.
          </Text>
          
          {componentRanges.map(({ name, elevations }) => (
            <View key={name} className="mb-8">
              <Text className="text-lg font-semibold text-text-primary mb-4">
                {name}
              </Text>
              <View className="flex-row flex-wrap gap-6">
                {elevations.map((level) => {
                  const config = getElevationConfig(level)
                  const surfaceColor = getElevationSurface(baseColor, level, theme)
                  const shadowStyle = getElevationShadow(baseColor, level, theme)
                  
                  return (
                    <View key={level} className="items-center gap-2">
                      <View
                        className="w-20 h-20 rounded-lg items-center justify-center"
                        style={[
                          { backgroundColor: surfaceColor },
                          shadowStyle,
                        ]}
                      >
                        <Text
                          className="text-lg font-bold"
                          style={{
                            color: theme === 'light' ? '#121828' : '#F3F4F6',
                          }}
                        >
                          {level}
                        </Text>
                      </View>
                      <Text className="text-xs text-text-secondary">
                        {config.name}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  },
}
