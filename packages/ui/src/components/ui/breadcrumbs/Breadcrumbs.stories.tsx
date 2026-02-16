import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from 'react-native'
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs'

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  argTypes: {
    maxItems: {
      control: 'number',
      description: 'Maximum items to show (with collapse)',
    },
  },
}

export default meta
type Story = StoryObj<typeof Breadcrumbs>

export const Default: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Products</BreadcrumbItem>
      <BreadcrumbItem isCurrentPage>Widget</BreadcrumbItem>
    </Breadcrumbs>
  ),
}

export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumbs separator=">">
      <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Category</BreadcrumbItem>
      <BreadcrumbItem isCurrentPage>Item</BreadcrumbItem>
    </Breadcrumbs>
  ),
}

export const WithMaxItems: Story = {
  render: () => (
    <Breadcrumbs maxItems={3}>
      <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Category</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Subcategory</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Section</BreadcrumbItem>
      <BreadcrumbItem isCurrentPage>Current Page</BreadcrumbItem>
    </Breadcrumbs>
  ),
}

export const SingleItem: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem isCurrentPage>Home</BreadcrumbItem>
    </Breadcrumbs>
  ),
}

export const LongPath: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Settings</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Account</BreadcrumbItem>
      <BreadcrumbItem onPress={() => {}}>Security</BreadcrumbItem>
      <BreadcrumbItem isCurrentPage>Two-Factor Authentication</BreadcrumbItem>
    </Breadcrumbs>
  ),
}
