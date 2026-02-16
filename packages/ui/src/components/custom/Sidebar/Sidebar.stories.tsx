import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarDivider,
} from './Sidebar'

const meta: Meta<typeof Sidebar> = {
  title: 'Custom/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  argTypes: {
    isCollapsed: {
      control: 'boolean',
      description: 'Whether sidebar is collapsed (icon-only mode)',
    },
    activeItem: {
      control: 'text',
      description: 'ID of the currently active item',
    },
    width: {
      control: 'number',
      description: 'Width when expanded',
    },
    collapsedWidth: {
      control: 'number',
      description: 'Width when collapsed',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ height: 500 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Sidebar>

// Simple icon components for demos
function HomeIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <Text style={{ fontSize: size }} className={className}>&#8962;</Text>
}

function ChartIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <Text style={{ fontSize: size }} className={className}>&#9632;</Text>
}

function UserIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <Text style={{ fontSize: size }} className={className}>&#9786;</Text>
}

function GearIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <Text style={{ fontSize: size }} className={className}>&#9881;</Text>
}

function MailIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <Text style={{ fontSize: size }} className={className}>&#9993;</Text>
}

function FileIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <Text style={{ fontSize: size }} className={className}>&#128196;</Text>
}

export const Default: Story = {
  args: {
    activeItem: 'home',
  },
  render: (args) => (
    <Sidebar {...args}>
      <SidebarHeader>
        <Text className="text-text-primary text-lg font-bold">Titan</Text>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection>
          <SidebarItem id="home" label="Home" />
          <SidebarItem id="dashboard" label="Dashboard" />
          <SidebarItem id="projects" label="Projects" />
          <SidebarItem id="settings" label="Settings" />
        </SidebarSection>
      </SidebarContent>
    </Sidebar>
  ),
}

export const WithIcons: Story = {
  args: {
    activeItem: 'dashboard',
  },
  render: (args) => (
    <Sidebar {...args}>
      <SidebarHeader>
        <Text className="text-text-primary text-lg font-bold">Titan</Text>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection>
          <SidebarItem id="home" icon={HomeIcon} label="Home" />
          <SidebarItem id="dashboard" icon={ChartIcon} label="Dashboard" />
          <SidebarItem id="users" icon={UserIcon} label="Users" />
          <SidebarItem id="messages" icon={MailIcon} label="Messages" />
        </SidebarSection>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem id="settings" icon={GearIcon} label="Settings" />
      </SidebarFooter>
    </Sidebar>
  ),
}

export const Collapsed: Story = {
  args: {
    isCollapsed: true,
    activeItem: 'home',
  },
  render: (args) => (
    <Sidebar {...args}>
      <SidebarHeader>
        <Text className="text-text-primary text-lg font-bold text-center">T</Text>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection>
          <SidebarItem id="home" icon={HomeIcon} label="Home" />
          <SidebarItem id="dashboard" icon={ChartIcon} label="Dashboard" />
          <SidebarItem id="users" icon={UserIcon} label="Users" />
          <SidebarItem id="messages" icon={MailIcon} label="Messages" />
        </SidebarSection>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem id="settings" icon={GearIcon} label="Settings" />
      </SidebarFooter>
    </Sidebar>
  ),
}

export const WithSections: Story = {
  args: {
    activeItem: 'dashboard',
  },
  render: (args) => (
    <Sidebar {...args}>
      <SidebarHeader>
        <Text className="text-text-primary text-lg font-bold">Titan</Text>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection title="Main">
          <SidebarItem id="home" icon={HomeIcon} label="Home" />
          <SidebarItem id="dashboard" icon={ChartIcon} label="Dashboard" />
        </SidebarSection>
        <SidebarDivider />
        <SidebarSection title="Content">
          <SidebarItem id="files" icon={FileIcon} label="Files" />
          <SidebarItem id="messages" icon={MailIcon} label="Messages" />
        </SidebarSection>
        <SidebarDivider />
        <SidebarSection title="Account">
          <SidebarItem id="profile" icon={UserIcon} label="Profile" />
          <SidebarItem id="settings" icon={GearIcon} label="Settings" />
        </SidebarSection>
      </SidebarContent>
    </Sidebar>
  ),
}

export const WithBadge: Story = {
  args: {
    activeItem: 'home',
  },
  render: (args) => (
    <Sidebar {...args}>
      <SidebarHeader>
        <Text className="text-text-primary text-lg font-bold">Titan</Text>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSection>
          <SidebarItem id="home" icon={HomeIcon} label="Home" />
          <SidebarItem id="dashboard" icon={ChartIcon} label="Dashboard" />
          <SidebarItem
            id="messages"
            icon={MailIcon}
            label="Messages"
            badge={
              <View className="bg-status-error rounded-full px-1.5 py-0.5">
                <Text className="text-white text-xs font-bold">5</Text>
              </View>
            }
          />
          <SidebarItem id="users" icon={UserIcon} label="Users" />
        </SidebarSection>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem id="settings" icon={GearIcon} label="Settings" />
      </SidebarFooter>
    </Sidebar>
  ),
}

export const WithActiveItem: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, height: 400 }}>
      <Sidebar activeItem="home" width={200}>
        <SidebarContent>
          <SidebarSection>
            <SidebarItem id="home" icon={HomeIcon} label="Home" />
            <SidebarItem id="dashboard" icon={ChartIcon} label="Dashboard" />
            <SidebarItem id="settings" icon={GearIcon} label="Settings" />
          </SidebarSection>
        </SidebarContent>
      </Sidebar>
      <Sidebar activeItem="dashboard" width={200}>
        <SidebarContent>
          <SidebarSection>
            <SidebarItem id="home" icon={HomeIcon} label="Home" />
            <SidebarItem id="dashboard" icon={ChartIcon} label="Dashboard" />
            <SidebarItem id="settings" icon={GearIcon} label="Settings" />
          </SidebarSection>
        </SidebarContent>
      </Sidebar>
    </View>
  ),
}
