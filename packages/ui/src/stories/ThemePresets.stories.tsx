import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Button, ButtonText } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Progress, CircularProgress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { applyThemePreset, audiobookPreset, defaultPreset } from '../theme/presets'

function PresetShowcase({ preset }: { preset: typeof audiobookPreset }) {
  useEffect(() => {
    const cleanup = applyThemePreset(preset)
    return cleanup
  }, [preset])

  return (
    <View className="gap-6 p-6 bg-background-default min-h-screen">
      <Text className="text-2xl font-bold text-text-primary font-heading">
        {preset.name} preset
      </Text>

      {/* Buttons */}
      <View className="flex-row gap-3 flex-wrap">
        <Button variant="solid" color="primary">
          <ButtonText>Primary</ButtonText>
        </Button>
        <Button variant="solid" color="secondary">
          <ButtonText>Secondary</ButtonText>
        </Button>
        <Button variant="outline" color="primary">
          <ButtonText>Outline</ButtonText>
        </Button>
        <Button variant="ghost" color="primary">
          <ButtonText>Ghost</ButtonText>
        </Button>
      </View>

      {/* Card */}
      <Card className="p-4 gap-3">
        <Text className="text-lg font-semibold text-text-primary">Sample Card</Text>
        <Text className="text-text-secondary">
          This card demonstrates surface elevation and border colors with the current preset.
        </Text>
        <View className="flex-row gap-2">
          <Badge color="success">Complete</Badge>
          <Badge color="warning">Pending</Badge>
          <Badge color="error">Failed</Badge>
        </View>
      </Card>

      {/* Input */}
      <Input placeholder="Type something..." />

      {/* Progress */}
      <View className="gap-3">
        <Progress value={65} label="Processing" showValue color="primary" />
        <View className="flex-row gap-4 items-center">
          <CircularProgress value={25} size={48} showValue color="primary" />
          <CircularProgress value={75} size={48} showValue color="secondary" />
          <CircularProgress value={100} size={48} showValue color="success" />
        </View>
      </View>
    </View>
  )
}

const meta: Meta = {
  title: 'Foundations/Theme Presets',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

export const Default: StoryObj = {
  render: () => <PresetShowcase preset={defaultPreset} />,
  name: 'Default Preset',
}

export const Audiobook: StoryObj = {
  render: () => <PresetShowcase preset={audiobookPreset} />,
  name: 'Audiobook Preset',
}
