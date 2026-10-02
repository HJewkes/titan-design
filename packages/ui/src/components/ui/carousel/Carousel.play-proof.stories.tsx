// Deliberately throws, to prove the storybook-play CI job goes red (VW-692). Reverted right after.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from 'react-native'

const meta: Meta = {
  title: 'Components/Molecules/Carousel/PlayProof',
  tags: ['!dev', '!autodocs', 'play'],
  render: () => <Text>play proof</Text>,
}
export default meta

export const DeliberatelyThrowingPlayProof: StoryObj = {
  play: async () => {
    throw new Error('VW-692 deliberate play failure')
  },
}
