import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Menu, MenuTrigger, MenuList, MenuItem, MenuDivider, MenuGroup } from './Menu'
import { Button, ButtonText } from '../button/Button'

const meta: Meta<typeof Menu> = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controlled open state',
    },
  },
  decorators: [
    (Story) => (
      <View style={{ minHeight: 300, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Menu>

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Options</ButtonText>
        </Button>
      </MenuTrigger>
      <MenuList>
        <MenuItem onPress={() => {}}>Edit</MenuItem>
        <MenuItem onPress={() => {}}>Duplicate</MenuItem>
        <MenuItem onPress={() => {}}>Share</MenuItem>
      </MenuList>
    </Menu>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Actions</ButtonText>
        </Button>
      </MenuTrigger>
      <MenuList>
        <MenuGroup label="Edit">
          <MenuItem onPress={() => {}}>Cut</MenuItem>
          <MenuItem onPress={() => {}}>Copy</MenuItem>
          <MenuItem onPress={() => {}}>Paste</MenuItem>
        </MenuGroup>
        <MenuDivider />
        <MenuGroup label="View">
          <MenuItem onPress={() => {}}>Zoom In</MenuItem>
          <MenuItem onPress={() => {}}>Zoom Out</MenuItem>
          <MenuItem onPress={() => {}}>Reset Zoom</MenuItem>
        </MenuGroup>
      </MenuList>
    </Menu>
  ),
}

function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, lineHeight: size }}>&#9998;</Text>
  )
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, lineHeight: size }}>&#128465;</Text>
  )
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, lineHeight: size }}>&#128203;</Text>
  )
}

export const WithIcons: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>More</ButtonText>
        </Button>
      </MenuTrigger>
      <MenuList>
        <MenuItem icon={<EditIcon />} onPress={() => {}}>Edit</MenuItem>
        <MenuItem icon={<CopyIcon />} onPress={() => {}}>Duplicate</MenuItem>
        <MenuDivider />
        <MenuItem icon={<TrashIcon />} onPress={() => {}} isDestructive>Delete</MenuItem>
      </MenuList>
    </Menu>
  ),
}

export const DestructiveItem: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Manage</ButtonText>
        </Button>
      </MenuTrigger>
      <MenuList>
        <MenuItem onPress={() => {}}>Edit Profile</MenuItem>
        <MenuItem onPress={() => {}}>Change Password</MenuItem>
        <MenuDivider />
        <MenuItem onPress={() => {}} isDestructive>Delete Account</MenuItem>
      </MenuList>
    </Menu>
  ),
}

export const WithDividers: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>File</ButtonText>
        </Button>
      </MenuTrigger>
      <MenuList>
        <MenuItem onPress={() => {}}>New File</MenuItem>
        <MenuItem onPress={() => {}}>Open File</MenuItem>
        <MenuDivider />
        <MenuItem onPress={() => {}}>Save</MenuItem>
        <MenuItem onPress={() => {}}>Save As</MenuItem>
        <MenuDivider />
        <MenuItem onPress={() => {}}>Export</MenuItem>
      </MenuList>
    </Menu>
  ),
}

export const DisabledItems: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Edit</ButtonText>
        </Button>
      </MenuTrigger>
      <MenuList>
        <MenuItem onPress={() => {}}>Undo</MenuItem>
        <MenuItem onPress={() => {}} isDisabled>Redo</MenuItem>
        <MenuDivider />
        <MenuItem onPress={() => {}}>Cut</MenuItem>
        <MenuItem onPress={() => {}}>Copy</MenuItem>
        <MenuItem onPress={() => {}} isDisabled>Paste</MenuItem>
      </MenuList>
    </Menu>
  ),
}

export const Controlled: Story = {
  render: () => (
    <Menu isOpen>
      <MenuTrigger>
        <Button variant="outline" color="primary">
          <ButtonText>Always Open</ButtonText>
        </Button>
      </MenuTrigger>
      <MenuList>
        <MenuItem onPress={() => {}}>Item One</MenuItem>
        <MenuItem onPress={() => {}}>Item Two</MenuItem>
        <MenuItem onPress={() => {}}>Item Three</MenuItem>
      </MenuList>
    </Menu>
  ),
}
