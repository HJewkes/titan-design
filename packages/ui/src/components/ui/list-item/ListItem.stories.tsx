import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  ListItem,
  ListItemIcon,
  ListItemContent,
  ListItemTrailing,
  ListItemDivider,
} from './ListItem'

function UserIcon({ size = 20 }: { size?: number; className?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.5, fontWeight: '600' }}>U</Text>
    </View>
  )
}

function WifiIcon({ size = 20 }: { size?: number; className?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.7 }}>W</Text>
    </View>
  )
}

function BellIcon({ size = 20 }: { size?: number; className?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.7 }}>B</Text>
    </View>
  )
}

function LockIcon({ size = 20 }: { size?: number; className?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.7 }}>L</Text>
    </View>
  )
}

function ChevronRight({ size = 16 }: { size?: number }) {
  return <Text style={{ color: '#9ca3af', fontSize: size }}>{'>'}</Text>
}

const meta: Meta<typeof ListItem> = {
  title: 'Components/Molecules/ListItem',
  component: ListItem,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ListItem>

export const Basic: Story = {
  render: () => (
    <ListItem>
      <ListItemContent title="Simple list item" />
    </ListItem>
  ),
}

export const WithSubtitle: Story = {
  render: () => (
    <ListItem>
      <ListItemContent title="Wi-Fi" subtitle="Connected to HomeNetwork" />
    </ListItem>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <ListItem>
      <ListItemIcon icon={WifiIcon} />
      <ListItemContent title="Wi-Fi" subtitle="Connected" />
    </ListItem>
  ),
}

export const WithTrailing: Story = {
  render: () => (
    <ListItem onPress={() => {}}>
      <ListItemIcon icon={UserIcon} />
      <ListItemContent title="Account" subtitle="Manage your account" />
      <ListItemTrailing>
        <ChevronRight />
      </ListItemTrailing>
    </ListItem>
  ),
}

export const SettingsList: Story = {
  render: () => (
    <View>
      <ListItem onPress={() => {}}>
        <ListItemIcon icon={UserIcon} />
        <ListItemContent title="Profile" subtitle="Edit your profile details" />
        <ListItemTrailing>
          <ChevronRight />
        </ListItemTrailing>
      </ListItem>
      <ListItemDivider />

      <ListItem onPress={() => {}}>
        <ListItemIcon icon={BellIcon} />
        <ListItemContent title="Notifications" subtitle="Push, email, SMS" />
        <ListItemTrailing>
          <ChevronRight />
        </ListItemTrailing>
      </ListItem>
      <ListItemDivider />

      <ListItem onPress={() => {}}>
        <ListItemIcon icon={LockIcon} />
        <ListItemContent title="Privacy" subtitle="Manage your data" />
        <ListItemTrailing>
          <ChevronRight />
        </ListItemTrailing>
      </ListItem>
      <ListItemDivider />

      <ListItem onPress={() => {}}>
        <ListItemIcon icon={WifiIcon} />
        <ListItemContent title="Wi-Fi" subtitle="HomeNetwork" />
        <ListItemTrailing>
          <Text style={{ color: '#22c55e', fontSize: 12 }}>Connected</Text>
        </ListItemTrailing>
      </ListItem>
    </View>
  ),
}

export const FullWidthDivider: Story = {
  render: () => (
    <View>
      <ListItem>
        <ListItemContent title="First item" />
      </ListItem>
      <ListItemDivider inset={false} />
      <ListItem>
        <ListItemContent title="Second item" />
      </ListItem>
    </View>
  ),
}
