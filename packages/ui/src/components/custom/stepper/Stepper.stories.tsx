import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Stepper, Step, StepIndicator, StepLabel, StepContent } from './Stepper'

const meta: Meta<typeof Stepper> = {
  title: 'Components/Molecules/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  argTypes: {
    activeStep: {
      control: { type: 'number', min: 0, max: 4 },
      description: 'Current active step (0-indexed)',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Stepper orientation',
    },
  },
}

export default meta
type Story = StoryObj<typeof Stepper>

export const Default: Story = {
  args: {
    activeStep: 1,
    orientation: 'horizontal',
  },
  render: (args) => (
    <Stepper {...args}>
      <Step>
        <StepIndicator />
        <StepLabel>Account</StepLabel>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Profile</StepLabel>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Review</StepLabel>
      </Step>
    </Stepper>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <View style={{ gap: 32 }}>
      <View>
        <Text className="text-text-secondary text-xs mb-4">Step 1 of 4</Text>
        <Stepper activeStep={0} orientation="horizontal">
          <Step>
            <StepIndicator />
            <StepLabel>Details</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Address</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Payment</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Confirm</StepLabel>
          </Step>
        </Stepper>
      </View>
      <View>
        <Text className="text-text-secondary text-xs mb-4">Step 3 of 4</Text>
        <Stepper activeStep={2} orientation="horizontal">
          <Step>
            <StepIndicator />
            <StepLabel>Details</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Address</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Payment</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Confirm</StepLabel>
          </Step>
        </Stepper>
      </View>
    </View>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Stepper activeStep={1} orientation="vertical">
      <Step>
        <StepIndicator />
        <StepLabel>Create Account</StepLabel>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Set Up Profile</StepLabel>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Configure Settings</StepLabel>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Get Started</StepLabel>
      </Step>
    </Stepper>
  ),
}

export const VerticalWithContent: Story = {
  render: () => (
    <Stepper activeStep={1} orientation="vertical">
      <Step>
        <StepIndicator />
        <StepLabel>Create Account</StepLabel>
        <StepContent>
          <Text className="text-text-secondary text-sm">Account creation is complete.</Text>
        </StepContent>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Set Up Profile</StepLabel>
        <StepContent>
          <View style={{ gap: 8 }}>
            <Text className="text-text-secondary text-sm">
              Fill in your profile details to continue.
            </Text>
            <View className="bg-surface-input border border-hairline rounded-md px-3 py-2">
              <Text className="text-text-secondary text-sm">Display Name</Text>
            </View>
          </View>
        </StepContent>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Configure Settings</StepLabel>
        <StepContent>
          <Text className="text-text-secondary text-sm">Adjust your preferences.</Text>
        </StepContent>
      </Step>
    </Stepper>
  ),
}

export const StepStates: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      <View>
        <Text className="text-text-secondary text-xs mb-4">All steps upcoming</Text>
        <Stepper activeStep={0} orientation="horizontal">
          <Step>
            <StepIndicator />
            <StepLabel>Step 1</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 2</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 3</StepLabel>
          </Step>
        </Stepper>
      </View>
      <View>
        <Text className="text-text-secondary text-xs mb-4">All steps completed</Text>
        <Stepper activeStep={3} orientation="horizontal">
          <Step>
            <StepIndicator />
            <StepLabel>Step 1</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 2</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 3</StepLabel>
          </Step>
        </Stepper>
      </View>
    </View>
  ),
}

export const WithErrorState: Story = {
  render: () => (
    <Stepper activeStep={2} orientation="horizontal">
      <Step>
        <StepIndicator />
        <StepLabel>Account</StepLabel>
      </Step>
      <Step status="error">
        <StepIndicator />
        <StepLabel>Verification</StepLabel>
      </Step>
      <Step>
        <StepIndicator />
        <StepLabel>Complete</StepLabel>
      </Step>
    </Stepper>
  ),
}

export const ActiveStepProgression: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      {[0, 1, 2, 3].map((activeStep) => (
        <View key={activeStep}>
          <Text className="text-text-secondary text-xs mb-2">Active step: {activeStep}</Text>
          <Stepper activeStep={activeStep} orientation="horizontal">
            <Step>
              <StepIndicator />
              <StepLabel>Account</StepLabel>
            </Step>
            <Step>
              <StepIndicator />
              <StepLabel>Profile</StepLabel>
            </Step>
            <Step>
              <StepIndicator />
              <StepLabel>Review</StepLabel>
            </Step>
          </Stepper>
        </View>
      ))}
    </View>
  ),
}
