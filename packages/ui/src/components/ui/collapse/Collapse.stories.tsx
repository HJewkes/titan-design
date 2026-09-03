import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  Collapse,
  CollapseButton,
  CollapseContent,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
} from './Collapse'

const meta: Meta<typeof Accordion> = {
  title: 'Components/Organisms/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    allowMultiple: {
      control: 'boolean',
      description: 'Allow multiple items to be open simultaneously',
    },
  },
}

export default meta
type Story = StoryObj<typeof Accordion>

export const Default: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Accordion>
        <AccordionItem>
          <AccordionButton>What is Titan Design?</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              Titan Design is a cross-platform React and React Native design system built on
              Gluestack UI, NativeWind v4, and Tailwind CSS.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>How do I install it?</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              Install via pnpm: pnpm add @titan-design/react-ui. Then import the global CSS and
              components as needed.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Is it accessible?</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              Yes, all components are built with WCAG 2.1 AA compliance in mind and tested with
              jest-axe for accessibility violations.
            </Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </View>
  ),
}

export const AllowMultiple: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Accordion allowMultiple>
        <AccordionItem>
          <AccordionButton>Section One</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              With allowMultiple enabled, you can open multiple accordion items at the same time.
              Try opening this and another section.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Section Two</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              This section can be open alongside Section One. In single mode, opening a new section
              would close any previously open one.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Section Three</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              All three sections can be expanded simultaneously when allowMultiple is true.
            </Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </View>
  ),
}

export const DefaultOpen: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Accordion defaultIndex={[0]}>
        <AccordionItem>
          <AccordionButton>Initially Open</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              This section is open by default using defaultIndex=[0]. The user can close it by
              clicking the header.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Initially Closed</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              This section starts closed and opens when the user clicks on it.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Also Closed</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">Another closed section.</Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </View>
  ),
}

export const MultipleDefaultOpen: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Accordion allowMultiple defaultIndex={[0, 2]}>
        <AccordionItem>
          <AccordionButton>First (Open)</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              This section starts open via defaultIndex.
            </Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Second (Closed)</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">This section starts closed.</Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Third (Open)</AccordionButton>
          <AccordionPanel>
            <Text className="text-text-secondary text-sm">
              This section also starts open via defaultIndex.
            </Text>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </View>
  ),
}

export const WithRichContent: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Accordion allowMultiple>
        <AccordionItem>
          <AccordionButton>Pricing Details</AccordionButton>
          <AccordionPanel>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text className="text-text-primary text-sm">Base plan</Text>
                <Text className="text-text-primary text-sm font-semibold">$29/mo</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text className="text-text-primary text-sm">Pro plan</Text>
                <Text className="text-text-primary text-sm font-semibold">$79/mo</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text className="text-text-primary text-sm">Enterprise</Text>
                <Text className="text-text-primary text-sm font-semibold">Custom</Text>
              </View>
            </View>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Features Included</AccordionButton>
          <AccordionPanel>
            <View style={{ gap: 6 }}>
              {[
                'Unlimited projects',
                'Custom domains',
                'Priority support',
                'API access',
                'Team collaboration',
              ].map((feature) => (
                <View key={feature} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text className="text-status-success text-sm">&#10003;</Text>
                  <Text className="text-text-primary text-sm">{feature}</Text>
                </View>
              ))}
            </View>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>Frequently Asked Questions</AccordionButton>
          <AccordionPanel>
            <View style={{ gap: 12 }}>
              <View style={{ gap: 2 }}>
                <Text className="text-text-primary text-sm font-medium">Can I cancel anytime?</Text>
                <Text className="text-text-secondary text-sm">
                  Yes, you can cancel your subscription at any time with no penalties.
                </Text>
              </View>
              <View style={{ gap: 2 }}>
                <Text className="text-text-primary text-sm font-medium">
                  Is there a free trial?
                </Text>
                <Text className="text-text-secondary text-sm">
                  We offer a 14-day free trial for all plans.
                </Text>
              </View>
            </View>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </View>
  ),
}

export const ManyItems: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Accordion>
        {Array.from({ length: 10 }).map((_, i) => (
          <AccordionItem key={i}>
            <AccordionButton>Item {i + 1}</AccordionButton>
            <AccordionPanel>
              <Text className="text-text-secondary text-sm">
                Content for accordion item {i + 1}. Only one item can be expanded at a time in
                single mode.
              </Text>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </View>
  ),
}

export const SingleCollapse: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Collapse>
        <CollapseButton>
          <Text className="text-text-primary font-medium">Click to expand</Text>
        </CollapseButton>
        <CollapseContent>
          <View className="px-4 pb-3">
            <Text className="text-text-secondary text-sm">
              This is a standalone Collapse component, useful when you only need a single
              collapsible section rather than an accordion group.
            </Text>
          </View>
        </CollapseContent>
      </Collapse>
    </View>
  ),
}

export const CollapseDefaultOpen: Story = {
  render: () => (
    <View style={{ width: 400 }}>
      <Collapse defaultIsOpen>
        <CollapseButton>
          <Text className="text-text-primary font-medium">Details (starts open)</Text>
        </CollapseButton>
        <CollapseContent>
          <View className="px-4 pb-3">
            <Text className="text-text-secondary text-sm">
              This collapse starts in the open state via defaultIsOpen. The user can toggle it
              closed by clicking the header.
            </Text>
          </View>
        </CollapseContent>
      </Collapse>
    </View>
  ),
}

export const CollapseControlled: Story = {
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <View style={{ width: 400, gap: 8 }}>
        <Text className="text-sm text-text-secondary">State: {isOpen ? 'Open' : 'Closed'}</Text>
        <Collapse isOpen={isOpen} onToggle={setIsOpen}>
          <CollapseButton>
            <Text className="text-text-primary font-medium">Controlled Collapse</Text>
          </CollapseButton>
          <CollapseContent>
            <View className="px-4 pb-3">
              <Text className="text-text-secondary text-sm">
                This collapse is controlled externally. The isOpen prop and onToggle callback manage
                state outside the component.
              </Text>
            </View>
          </CollapseContent>
        </Collapse>
      </View>
    )
  },
}
