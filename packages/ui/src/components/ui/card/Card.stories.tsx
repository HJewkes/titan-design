import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardSkeleton,
  CardInset,
} from './Card'
import { Button, ButtonText } from '../button'

const meta: Meta<typeof Card> = {
  title: 'Components/Molecules/Card',
  component: Card,
  parameters: {
    docs: { description: { component: 'Composes **Surface**.' } },
  },
  tags: ['autodocs', 'status:stable', '!status:review'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'accent', 'filled', 'outline', 'subtle'],
      description:
        'elevated/accent lift with rim + shadow · filled lifts by tone only · outline/subtle stay on the host plane with a hairline edge',
    },
    elevation: {
      control: 'select',
      options: [1, 2, 3],
      description: 'Planes to lift above the enclosing Surface (default 2: page → card plane)',
    },
    isInteractive: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    borderColor: { control: 'color' },
    bgColor: { control: 'color' },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: (args) => (
    <Card {...args} style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <Text className="text-text-secondary">
          This is the card content. You can put any content here.
        </Text>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          <ButtonText>Cancel</ButtonText>
        </Button>
        <Button size="sm">
          <ButtonText>Save</ButtonText>
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args) => (
    <Card {...args} style={{ width: 320 }}>
      <CardContent>
        <Text className="text-text-primary">Elevated card with elevation</Text>
      </CardContent>
    </Card>
  ),
}

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
  render: (args) => (
    <Card {...args} style={{ width: 320 }}>
      <CardContent>
        <Text className="text-text-primary">Outlined card with border</Text>
      </CardContent>
    </Card>
  ),
}

export const Filled: Story = {
  args: {
    variant: 'filled',
  },
  render: (args) => (
    <Card {...args} style={{ width: 320 }}>
      <CardContent>
        <Text className="text-text-primary">Filled card with background</Text>
      </CardContent>
    </Card>
  ),
}

export const Interactive: Story = {
  args: {
    isInteractive: true,
  },
  render: (args) => (
    <Card {...args} style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover to see the effect</CardDescription>
      </CardHeader>
      <CardContent>
        <Text className="text-text-secondary">
          This card has hover effects when isInteractive is true.
        </Text>
      </CardContent>
    </Card>
  ),
}

export const SimpleCard: Story = {
  render: () => (
    <Card style={{ width: 320 }}>
      <CardContent>
        <Text className="text-text-primary">Simple card with just content</Text>
      </CardContent>
    </Card>
  ),
}

// Each level is one more plane up the ramp from the page (base): elevated,
// raised, overlay. The lift (rim + shadow) grows with the number of planes crossed.
export const ElevationLevels: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
      <Card elevation={1} style={{ width: 140 }}>
        <CardContent>
          <Text className="text-text-primary font-semibold">1 · elevated</Text>
        </CardContent>
      </Card>
      <Card elevation={2} style={{ width: 140 }}>
        <CardContent>
          <Text className="text-text-primary font-semibold">2 · raised</Text>
        </CardContent>
      </Card>
      <Card elevation={3} style={{ width: 140 }}>
        <CardContent>
          <Text className="text-text-primary font-semibold">3 · overlay</Text>
        </CardContent>
      </Card>
    </View>
  ),
}

// Depth is relative to the enclosing Surface: the same default Card steps up
// from wherever it is nested. Inside a card, prefer organising with an inset
// well or a tone-only `filled` tile over lifting again; a second lift is for a
// surface that genuinely floats over the first, and it clamps at overlay.
export const InsideACard: Story = {
  render: () => (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <CardTitle>Outer · raised</CardTitle>
        <CardDescription>Two planes up from the page</CardDescription>
      </CardHeader>
      <CardContent className="gap-3">
        <CardInset className="p-3">
          <Text className="text-text-secondary text-sm">CardInset · one plane down, recessed</Text>
        </CardInset>
        <Card variant="filled" elevation={1}>
          <CardContent>
            <Text className="text-text-primary text-sm">filled · one plane up, tone only</Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Text className="text-text-primary text-sm">
              lifted again · overlay (clamped) — sparingly
            </Text>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  ),
}

export const Clickable: Story = {
  render: () => (
    <Card isInteractive onPress={() => console.log('Card clicked!')} style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>Click anywhere on this card</CardDescription>
      </CardHeader>
      <CardContent>
        <Text className="text-text-secondary">
          This card has onPress handler and shows hover/press feedback.
        </Text>
      </CardContent>
    </Card>
  ),
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  render: (args) => (
    <Card {...args} style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>Loading Card</CardTitle>
        <CardDescription>Content is loading...</CardDescription>
      </CardHeader>
      <CardContent>
        <Text className="text-text-secondary">
          This content is hidden behind a loading spinner.
        </Text>
      </CardContent>
    </Card>
  ),
}

export const Skeleton: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <CardSkeleton style={{ width: 320 }} />
      <CardSkeleton hasHeader hasFooter style={{ width: 320 }} />
      <CardSkeleton hasHeader={false} contentLines={2} style={{ width: 320 }} />
    </View>
  ),
}

// A CardInset is a pressed well one plane DOWN from the card, with the insetWell
// recess. Nesting one inside another steps down again.
export const InsetElements: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Card style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>Card with Inset</CardTitle>
          <CardDescription>A well one plane below the card</CardDescription>
        </CardHeader>
        <CardContent>
          <CardInset className="p-4">
            <Text className="text-text-secondary text-sm">Inset element (card − 1)</Text>
          </CardInset>
        </CardContent>
      </Card>

      <Card style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>Nested Insets</CardTitle>
        </CardHeader>
        <CardContent>
          <CardInset className="p-4 mb-4">
            <Text className="text-text-secondary text-sm mb-2">Outer inset (card − 1)</Text>
            <CardInset className="p-3">
              <Text className="text-text-secondary text-xs">Inner inset (card − 2)</Text>
            </CardInset>
          </CardInset>
        </CardContent>
      </Card>
    </View>
  ),
}

// Status colors from the theme (using CSS custom properties for theme compliance)
const statusColors = {
  success: 'var(--color-status-success)',
  successSubtle: 'var(--color-status-success-subtle)',
  error: 'var(--color-status-error)',
  errorSubtle: 'var(--color-status-error-subtle)',
  warning: 'var(--color-status-warning)',
  warningSubtle: 'var(--color-status-warning-subtle)',
  info: 'var(--color-status-info)',
  infoSubtle: 'var(--color-status-info-subtle)',
}

export const StatusOutlineCards: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-lg font-semibold text-text-primary mb-2">
        Status Cards with Custom Border Colors
      </Text>

      <Card variant="outline" borderColor={statusColors.success} style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>Success</CardTitle>
          <CardDescription>Operation completed successfully</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">Your changes have been saved.</Text>
        </CardContent>
      </Card>

      <Card variant="outline" borderColor={statusColors.error} style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">Please try again or contact support.</Text>
        </CardContent>
      </Card>

      <Card variant="outline" borderColor={statusColors.warning} style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>Warning</CardTitle>
          <CardDescription>Proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">This action cannot be undone.</Text>
        </CardContent>
      </Card>

      <Card variant="outline" borderColor={statusColors.info} style={{ width: 320 }}>
        <CardHeader>
          <CardTitle>Information</CardTitle>
          <CardDescription>Good to know</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">New features are available in this release.</Text>
        </CardContent>
      </Card>
    </View>
  ),
}

export const StatusFilledCards: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-lg font-semibold text-text-primary mb-2">
        Status Cards with Custom Background Colors
      </Text>

      <Card
        variant="outline"
        borderColor={statusColors.success}
        bgColor={statusColors.successSubtle}
        style={{ width: 320 }}
      >
        <CardHeader>
          <CardTitle>Success</CardTitle>
          <CardDescription>Operation completed successfully</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">Your changes have been saved.</Text>
        </CardContent>
      </Card>

      <Card
        variant="outline"
        borderColor={statusColors.error}
        bgColor={statusColors.errorSubtle}
        style={{ width: 320 }}
      >
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">Please try again or contact support.</Text>
        </CardContent>
      </Card>

      <Card
        variant="outline"
        borderColor={statusColors.warning}
        bgColor={statusColors.warningSubtle}
        style={{ width: 320 }}
      >
        <CardHeader>
          <CardTitle>Warning</CardTitle>
          <CardDescription>Proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">This action cannot be undone.</Text>
        </CardContent>
      </Card>

      <Card
        variant="outline"
        borderColor={statusColors.info}
        bgColor={statusColors.infoSubtle}
        style={{ width: 320 }}
      >
        <CardHeader>
          <CardTitle>Information</CardTitle>
          <CardDescription>Good to know</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">New features are available in this release.</Text>
        </CardContent>
      </Card>
    </View>
  ),
}

export const BrandColoredCards: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-lg font-semibold text-text-primary mb-2">Brand Colored Cards</Text>

      <Card
        variant="outline"
        borderColor="var(--color-brand-primary)"
        bgColor="var(--color-brand-primary-subtle)"
        style={{ width: 320 }}
      >
        <CardHeader>
          <CardTitle>Primary Brand</CardTitle>
          <CardDescription>Orange brand color</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">Card with primary brand color styling.</Text>
        </CardContent>
      </Card>

      <Card
        variant="outline"
        borderColor="var(--color-brand-secondary)"
        bgColor="var(--color-brand-secondary-subtle)"
        style={{ width: 320 }}
      >
        <CardHeader>
          <CardTitle>Secondary Brand</CardTitle>
          <CardDescription>Steel brand color</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-text-secondary">Card with secondary brand color styling.</Text>
        </CardContent>
      </Card>
    </View>
  ),
}
