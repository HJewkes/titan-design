import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Section, SectionHeader, SectionContent } from './Section'

const meta: Meta<typeof Section> = {
  title: 'Components/Atoms/Section',
  component: Section,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Section>

export const Default: Story = {
  render: () => (
    <Section>
      <SectionHeader title="Recent Workouts" />
      <SectionContent>
        <Text style={{ color: '#a0a0a0' }}>Workout items would go here</Text>
      </SectionContent>
    </Section>
  ),
}

export const WithSubtitle: Story = {
  render: () => (
    <Section>
      <SectionHeader
        title="Workout Stats"
        subtitle="Last 7 days"
      />
      <SectionContent>
        <Text style={{ color: '#a0a0a0' }}>Stats content</Text>
      </SectionContent>
    </Section>
  ),
}

export const WithTrailingAction: Story = {
  render: () => (
    <Section>
      <SectionHeader
        title="Exercises"
        trailing={
          <Text style={{ color: '#6366f1', fontSize: 13 }}>View All</Text>
        }
      />
      <SectionContent>
        <Text style={{ color: '#a0a0a0' }}>Exercise list</Text>
      </SectionContent>
    </Section>
  ),
}

export const FullExample: Story = {
  render: () => (
    <Section>
      <SectionHeader
        title="Performance"
        subtitle="Average velocity by set"
        trailing={
          <Text style={{ color: '#6366f1', fontSize: 13 }}>Details</Text>
        }
      />
      <SectionContent className="rounded-lg bg-surface-elevated p-4">
        <Text style={{ color: '#a0a0a0' }}>Chart or data visualization</Text>
      </SectionContent>
    </Section>
  ),
}

export const MultipleSections: Story = {
  render: () => (
    <View>
      <Section>
        <SectionHeader title="Today" subtitle="3 exercises" />
        <SectionContent className="rounded-lg bg-surface-elevated p-4">
          <Text style={{ color: '#a0a0a0' }}>Today&apos;s workout data</Text>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader
          title="This Week"
          subtitle="12 sets completed"
          trailing={
            <Text style={{ color: '#6366f1', fontSize: 13 }}>See All</Text>
          }
        />
        <SectionContent className="rounded-lg bg-surface-elevated p-4">
          <Text style={{ color: '#a0a0a0' }}>Weekly summary</Text>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader title="Personal Records" />
        <SectionContent className="rounded-lg bg-surface-elevated p-4">
          <Text style={{ color: '#a0a0a0' }}>PR list</Text>
        </SectionContent>
      </Section>
    </View>
  ),
}

export const HeaderOnly: Story = {
  render: () => (
    <Section>
      <SectionHeader title="Section Title Only" />
    </Section>
  ),
}
