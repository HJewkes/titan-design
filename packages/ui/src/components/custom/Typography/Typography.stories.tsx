import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import {
  Typography,
  Heading,
  Paragraph,
  Caption,
  Label,
  Overline,
} from './Typography'

const meta: Meta<typeof Typography> = {
  title: 'Custom/Typography',
  component: Typography,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'body1', 'body2', 'subtitle1', 'subtitle2',
        'caption', 'overline', 'button',
      ],
    },
    color: {
      control: 'select',
      options: [
        'primary', 'secondary', 'tertiary', 'disabled',
        'inverse', 'success', 'error', 'warning', 'info', 'inherit',
      ],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
    },
    noWrap: { control: 'boolean' },
    gutterBottom: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Typography>

export const Default: Story = {
  args: {
    variant: 'body1',
    children: 'This is body1 text',
  },
}

export const AllHeadings: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Typography variant="h1">Heading 1</Typography>
      <Typography variant="h2">Heading 2</Typography>
      <Typography variant="h3">Heading 3</Typography>
      <Typography variant="h4">Heading 4</Typography>
      <Typography variant="h5">Heading 5</Typography>
      <Typography variant="h6">Heading 6</Typography>
    </View>
  ),
}

export const AllBody: Story = {
  render: () => (
    <View style={{ gap: 16, maxWidth: 400 }}>
      <Typography variant="body1">
        Body 1 - This is the default body text style. It&apos;s used for main content
        and paragraphs throughout the application.
      </Typography>
      <Typography variant="body2">
        Body 2 - This is a smaller body text style. It&apos;s useful for secondary
        content or when you need more compact text.
      </Typography>
      <Typography variant="subtitle1">
        Subtitle 1 - Semi-bold text for emphasis
      </Typography>
      <Typography variant="subtitle2">
        Subtitle 2 - Smaller semi-bold text
      </Typography>
    </View>
  ),
}

export const AllUtility: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Typography variant="caption">Caption - Small helper text</Typography>
      <Typography variant="overline">OVERLINE - SECTION LABEL</Typography>
      <Typography variant="button">Button Text</Typography>
    </View>
  ),
}

export const AllColors: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Typography color="primary">Primary text color</Typography>
      <Typography color="secondary">Secondary text color</Typography>
      <Typography color="tertiary">Tertiary text color</Typography>
      <Typography color="disabled">Disabled text color</Typography>
      <Typography color="success">Success text color</Typography>
      <Typography color="error">Error text color</Typography>
      <Typography color="warning">Warning text color</Typography>
      <Typography color="info">Info text color</Typography>
    </View>
  ),
}

export const HeadingComponent: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Heading level={1}>Heading Level 1</Heading>
      <Heading level={2}>Heading Level 2</Heading>
      <Heading level={3}>Heading Level 3</Heading>
    </View>
  ),
}

export const ParagraphComponent: Story = {
  render: () => (
    <View style={{ gap: 16, maxWidth: 400 }}>
      <Paragraph>
        This is a regular paragraph using the default body1 variant.
        It&apos;s great for main content.
      </Paragraph>
      <Paragraph small>
        This is a small paragraph using the body2 variant.
        It&apos;s useful for secondary content.
      </Paragraph>
    </View>
  ),
}

export const UtilityComponents: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Overline>Section Title</Overline>
      <Label>Form Label</Label>
      <Caption>Helper text or caption</Caption>
    </View>
  ),
}

export const WithTruncation: Story = {
  render: () => (
    <View style={{ width: 200 }}>
      <Typography noWrap>
        This is a very long text that will be truncated with an ellipsis
      </Typography>
    </View>
  ),
}
