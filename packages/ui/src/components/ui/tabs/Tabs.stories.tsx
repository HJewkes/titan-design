import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['line', 'enclosed', 'soft-rounded'],
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultIndex={0}>
      <TabList>
        <Tab>Account</Tab>
        <Tab>Security</Tab>
        <Tab>Notifications</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text className="text-text-primary">Account settings content</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Security settings content</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Notification settings content</Text>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

export const LineVariant: Story = {
  render: () => (
    <Tabs variant="line">
      <TabList>
        <Tab>Overview</Tab>
        <Tab>Analytics</Tab>
        <Tab>Reports</Tab>
        <Tab>Settings</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text className="text-text-primary">Overview content</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Analytics content</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Reports content</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Settings content</Text>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

export const EnclosedVariant: Story = {
  render: () => (
    <Tabs variant="enclosed">
      <TabList>
        <Tab>Day</Tab>
        <Tab>Week</Tab>
        <Tab>Month</Tab>
        <Tab>Year</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text className="text-text-primary">Daily view</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Weekly view</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Monthly view</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Yearly view</Text>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

export const SoftRoundedVariant: Story = {
  render: () => (
    <Tabs variant="soft-rounded">
      <TabList>
        <Tab>All</Tab>
        <Tab>Active</Tab>
        <Tab>Completed</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text className="text-text-primary">All items</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Active items</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Completed items</Text>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

export const VerticalOrientation: Story = {
  render: () => (
    <View style={{ height: 300 }}>
      <Tabs orientation="vertical" variant="line">
        <TabList>
          <Tab>Profile</Tab>
          <Tab>Account</Tab>
          <Tab>Security</Tab>
          <Tab>Billing</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Text className="text-text-primary">Profile settings</Text>
          </TabPanel>
          <TabPanel>
            <Text className="text-text-primary">Account settings</Text>
          </TabPanel>
          <TabPanel>
            <Text className="text-text-primary">Security settings</Text>
          </TabPanel>
          <TabPanel>
            <Text className="text-text-primary">Billing settings</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </View>
  ),
}

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs>
      <TabList>
        <Tab>Available</Tab>
        <Tab isDisabled>Disabled</Tab>
        <Tab>Also Available</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text className="text-text-primary">First tab content</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">This won&apos;t show</Text>
        </TabPanel>
        <TabPanel>
          <Text className="text-text-primary">Third tab content</Text>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 32 }}>
      <View>
        <Text className="text-text-secondary mb-2">Line Variant</Text>
        <Tabs variant="line">
          <TabList>
            <Tab>Tab 1</Tab>
            <Tab>Tab 2</Tab>
            <Tab>Tab 3</Tab>
          </TabList>
        </Tabs>
      </View>

      <View>
        <Text className="text-text-secondary mb-2">Enclosed Variant</Text>
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Tab 1</Tab>
            <Tab>Tab 2</Tab>
            <Tab>Tab 3</Tab>
          </TabList>
        </Tabs>
      </View>

      <View>
        <Text className="text-text-secondary mb-2">Soft Rounded Variant</Text>
        <Tabs variant="soft-rounded">
          <TabList>
            <Tab>Tab 1</Tab>
            <Tab>Tab 2</Tab>
            <Tab>Tab 3</Tab>
          </TabList>
        </Tabs>
      </View>
    </View>
  ),
}
