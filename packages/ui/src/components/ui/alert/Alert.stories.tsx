import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Alert, AlertTitle, AlertDescription } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'Components/Molecules/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Status callout across 4 statuses (success/info/warning/error) × 3 variants ' +
          '(subtle/outline/solid). Two densities via `size`: `default` — the padded ' +
          'icon + title/description block; `compact` — a single-line **cue pill** (tighter, ' +
          'center-aligned, hairline status border on `subtle`) that absorbs the R2 `CueFlag` ' +
          'live-coaching cue. Pass `size="compact"` + `message="…"` for the batteries-included ' +
          "status-colored one-liner (RN doesn't cascade text color, so the `message` prop " +
          'colors it for you). Use `<AlertTitle>` / `<AlertDescription>` children for richer content.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'info', 'warning', 'error'],
    },
    variant: {
      control: 'select',
      options: ['subtle', 'outline', 'solid'],
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'compact'],
    },
    message: { control: 'text' },
    showIcon: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {
  args: {
    status: 'info',
    variant: 'subtle',
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This is an informational alert message.</AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  render: () => (
    <Alert status="success">
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  ),
}

export const Warning: Story = {
  render: () => (
    <Alert status="warning">
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Please review before proceeding.</AlertDescription>
    </Alert>
  ),
}

export const Error: Story = {
  render: () => (
    <Alert status="error">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again.</AlertDescription>
    </Alert>
  ),
}

export const WithCloseButton: Story = {
  render: () => (
    <Alert status="info" onClose={() => console.log('closed')}>
      <AlertTitle>Dismissable Alert</AlertTitle>
      <AlertDescription>Click the X to close this alert.</AlertDescription>
    </Alert>
  ),
}

export const AllStatuses: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Alert status="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed successfully.</AlertDescription>
      </Alert>
      <Alert status="info">
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Here is some useful information.</AlertDescription>
      </Alert>
      <Alert status="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please be careful with this action.</AlertDescription>
      </Alert>
      <Alert status="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>An error occurred.</AlertDescription>
      </Alert>
    </View>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Alert status="info" variant="subtle">
        <AlertTitle>Subtle Variant</AlertTitle>
        <AlertDescription>Light background with colored text.</AlertDescription>
      </Alert>
      <Alert status="info" variant="outline">
        <AlertTitle>Outline Variant</AlertTitle>
        <AlertDescription>Border with transparent background.</AlertDescription>
      </Alert>
      <Alert status="info" variant="solid">
        <AlertTitle>Solid Variant</AlertTitle>
        <AlertDescription>Solid background color.</AlertDescription>
      </Alert>
    </View>
  ),
}

export const SolidVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Alert status="success" variant="solid">
        <AlertDescription>Success solid alert</AlertDescription>
      </Alert>
      <Alert status="info" variant="solid">
        <AlertDescription>Info solid alert</AlertDescription>
      </Alert>
      <Alert status="warning" variant="solid">
        <AlertDescription>Warning solid alert</AlertDescription>
      </Alert>
      <Alert status="error" variant="solid">
        <AlertDescription>Error solid alert</AlertDescription>
      </Alert>
    </View>
  ),
}

export const WithoutIcon: Story = {
  args: {
    showIcon: false,
    status: 'info',
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>No Icon</AlertTitle>
      <AlertDescription>This alert has no icon.</AlertDescription>
    </Alert>
  ),
}

export const DescriptionOnly: Story = {
  render: () => (
    <Alert status="info">
      <AlertDescription>Simple alert with description only, no title.</AlertDescription>
    </Alert>
  ),
}

// --- Compact cue pill (absorbs CueFlag) --------------------------------------
// The across-the-room live coaching cue. Rendered on the north-star wall background
// so the tinted + bordered pill reads the way it will live.

/** Wall-background frame for the compact cue stories. */
const wall: Decorator = (Story) => (
  <View style={{ width: 460, padding: 28, backgroundColor: '#0E0E0E' }}>
    <Story />
  </View>
)

/** Compact warning cue — the VL20 approach-threshold flag (batteries-included `message`). */
export const CompactWarningCue: Story = {
  args: {
    status: 'warning',
    variant: 'subtle',
    size: 'compact',
    message: 'VL20 · target reps met — final rep or end the set.',
  },
  decorators: [wall],
}

/** Compact error cue — the stop-now flag. */
export const CompactErrorCue: Story = {
  args: {
    status: 'error',
    variant: 'subtle',
    size: 'compact',
    message: 'Velocity loss 31% — end the set now.',
  },
  decorators: [wall],
}

/** The consumption target: the north-star live cue (interpolated loss). */
export const CompactLiveCue: Story = {
  args: {
    status: 'warning',
    variant: 'subtle',
    size: 'compact',
    message: 'Approaching threshold · 18% velocity loss — one or two reps left.',
  },
  decorators: [wall],
}

/** Default vs compact, side by side, for the density comparison. */
export const DefaultVsCompact: Story = {
  render: () => (
    <View style={{ gap: 16, width: 460, padding: 28, backgroundColor: '#0E0E0E' }}>
      <Text style={{ color: '#5A5A5A', fontSize: 10, fontWeight: '700' }}>DEFAULT</Text>
      <Alert status="warning" variant="subtle">
        <AlertTitle>Approaching threshold</AlertTitle>
        <AlertDescription>18% velocity loss — one or two reps left in the band.</AlertDescription>
      </Alert>
      <Text style={{ color: '#5A5A5A', fontSize: 10, fontWeight: '700' }}>COMPACT (cue pill)</Text>
      <Alert
        status="warning"
        variant="subtle"
        size="compact"
        message="Approaching threshold · 18% velocity loss — reps left in band."
      />
    </View>
  ),
}
