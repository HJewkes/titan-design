// The stage-fit throw under real layout, which jsdom cannot give the unit tests. Hidden from the
// sidebar and docs (`!dev`, `!autodocs`); `pnpm test:storybook` runs the play function in Chromium.
import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import { Text, View } from 'react-native'
import { expect, waitFor, within } from 'storybook/test'
import { BeatStage } from './BeatStage'

class ShowError extends React.Component<{ children: React.ReactNode }, { message?: string }> {
  state: { message?: string } = {}

  static getDerivedStateFromError(error: Error) {
    return { message: error.message }
  }

  render() {
    if (this.state.message === undefined) return this.props.children
    return (
      <Text testID="stage-error" className="font-mono text-base text-text-primary">
        {this.state.message}
      </Text>
    )
  }
}

const meta: Meta<typeof BeatStage> = {
  title: 'Components/Organisms/BeatStage/Interactions',
  component: BeatStage,
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof BeatStage>

export const Overflow: Story = {
  render: () => (
    <ShowError>
      <BeatStage
        frame={{ width: 1920, height: 1080 }}
        chrome={{ header: { headline: 'body' }, chipRows: 2 }}
        units="frame"
        label="queue"
      >
        <View style={{ width: 400, height: 900 }} />
      </BeatStage>
    </ShowError>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByTestId('stage-error').textContent).toContain(
        'queue overflows its stage box by 126 px (bottom 126)'
      )
    )
  },
}
