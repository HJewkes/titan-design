import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { HelpTip, LabelWithHelp } from './HelpTip'

const meta: Meta<typeof HelpTip> = {
  title: 'Components/Molecules/HelpTip',
  component: HelpTip,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    icon: {
      control: 'select',
      options: ['help', 'info', 'warning'],
    },
    color: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'muted'],
    },
    hasArrow: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof HelpTip>

export const Default: Story = {
  args: {
    content: 'This is helpful information about the feature.',
    size: 'md',
    placement: 'top',
    icon: 'help',
  },
}

export const AllIcons: Story = {
  render: () => (
    <View className="flex-row gap-8 items-center">
      <View className="items-center gap-2">
        <HelpTip content="Help icon tooltip" icon="help" />
        <Text className="text-xs text-text-secondary">Help</Text>
      </View>
      <View className="items-center gap-2">
        <HelpTip content="Info icon tooltip" icon="info" />
        <Text className="text-xs text-text-secondary">Info</Text>
      </View>
      <View className="items-center gap-2">
        <HelpTip content="Warning icon tooltip" icon="warning" />
        <Text className="text-xs text-text-secondary">Warning</Text>
      </View>
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View className="flex-row gap-8 items-center">
      <View className="items-center gap-2">
        <HelpTip content="Small help tip" size="sm" />
        <Text className="text-xs text-text-secondary">Small</Text>
      </View>
      <View className="items-center gap-2">
        <HelpTip content="Medium help tip" size="md" />
        <Text className="text-xs text-text-secondary">Medium</Text>
      </View>
      <View className="items-center gap-2">
        <HelpTip content="Large help tip" size="lg" />
        <Text className="text-xs text-text-secondary">Large</Text>
      </View>
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View className="flex-row gap-6 items-center">
      <HelpTip content="Default color" color="default" />
      <HelpTip content="Primary color" color="primary" />
      <HelpTip content="Secondary color" color="secondary" />
      <HelpTip content="Muted color" color="muted" />
    </View>
  ),
}

export const AllPlacements: Story = {
  render: () => (
    <View className="gap-8 items-center py-16">
      <View className="flex-row items-center gap-2">
        <Text className="text-text-secondary w-16">Top:</Text>
        <HelpTip content="Tooltip on top" placement="top" />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-text-secondary w-16">Bottom:</Text>
        <HelpTip content="Tooltip on bottom" placement="bottom" />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-text-secondary w-16">Left:</Text>
        <HelpTip content="Tooltip on left" placement="left" />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-text-secondary w-16">Right:</Text>
        <HelpTip content="Tooltip on right" placement="right" />
      </View>
    </View>
  ),
}

export const WithLongContent: Story = {
  args: {
    content: 'This is a longer tooltip that contains more detailed information about the feature. It will wrap to multiple lines if needed, and you can customize the max width.',
    maxWidth: 300,
  },
}

export const WithRichContent: Story = {
  render: () => (
    <HelpTip
      content={
        <View className="gap-1">
          <Text className="text-sm font-semibold text-text-primary">API Rate Limits</Text>
          <Text className="text-xs text-text-secondary">
            • Free tier: 100 requests/hour
          </Text>
          <Text className="text-xs text-text-secondary">
            • Pro tier: 1000 requests/hour
          </Text>
          <Text className="text-xs text-text-secondary">
            • Enterprise: Unlimited
          </Text>
        </View>
      }
      icon="info"
      maxWidth={220}
    />
  ),
}

export const InlineWithLabel: Story = {
  render: () => (
    <View className="gap-4">
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-text-primary">Email Address</Text>
        <HelpTip
          content="We'll never share your email with third parties."
          size="sm"
        />
      </View>

      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-text-primary">Password</Text>
        <HelpTip
          content="Must be at least 8 characters with one uppercase, one lowercase, and one number."
          size="sm"
        />
      </View>

      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-text-primary">API Key</Text>
        <HelpTip
          content="Keep this secret! Anyone with this key can access your account."
          icon="warning"
          size="sm"
          color="primary"
        />
      </View>
    </View>
  ),
}

export const LabelWithHelpComponent: Story = {
  render: () => (
    <View className="gap-4">
      <LabelWithHelp
        label="Username"
        helpContent="Choose a unique username for your account."
      />

      <LabelWithHelp
        label="Email Address"
        helpContent="We'll use this for account notifications."
        isRequired
      />

      <LabelWithHelp
        label="Bio"
        helpContent="Tell others a bit about yourself. Max 500 characters."
        helpSize="sm"
      />
    </View>
  ),
}

export const FormExample: Story = {
  render: () => (
    <View className="gap-4 p-4 bg-surface-base rounded-lg max-w-sm">
      <Text className="text-lg font-semibold text-text-primary">Account Settings</Text>

      <View className="gap-1">
        <LabelWithHelp
          label="Display Name"
          helpContent="This is how your name will appear to other users."
          isRequired
        />
        <View className="border border-border-input rounded-md px-3 py-2 bg-surface-input">
          <Text className="text-text-primary">John Doe</Text>
        </View>
      </View>

      <View className="gap-1">
        <LabelWithHelp
          label="Timezone"
          helpContent="All dates and times will be displayed in this timezone."
        />
        <View className="border border-border-input rounded-md px-3 py-2 bg-surface-input">
          <Text className="text-text-primary">America/New_York (EST)</Text>
        </View>
      </View>

      <View className="gap-1">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-medium text-text-primary">Two-Factor Authentication</Text>
          <HelpTip
            content="Enable 2FA for additional account security. You'll need an authenticator app."
            icon="info"
            size="sm"
            color="primary"
          />
        </View>
        <View className="border border-border-input rounded-md px-3 py-2 bg-surface-input">
          <Text className="text-status-success">Enabled ✓</Text>
        </View>
      </View>
    </View>
  ),
}

export const NoArrow: Story = {
  args: {
    content: 'This tooltip has no arrow.',
    hasArrow: false,
  },
}
