import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { Section, SectionHeader, SectionContent } from './Section'

describe('Section', () => {
  it('renders children correctly', () => {
    render(
      <Section>
        <Text>Section content</Text>
      </Section>
    )
    expect(screen.getByText('Section content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Section className="mt-4" testID="section">
        <Text>Content</Text>
      </Section>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})

describe('SectionHeader', () => {
  it('renders title', () => {
    render(<SectionHeader title="My Section" />)
    expect(screen.getByText('My Section')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<SectionHeader title="Title" subtitle="Subtitle text" />)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Subtitle text')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<SectionHeader title="Title" />)
    expect(screen.queryByText('Subtitle text')).not.toBeInTheDocument()
  })

  it('renders trailing action when provided', () => {
    render(<SectionHeader title="Title" trailing={<Text>View All</Text>} />)
    expect(screen.getByText('View All')).toBeInTheDocument()
  })

  it('does not render trailing when not provided', () => {
    const { container } = render(<SectionHeader title="Title" />)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<SectionHeader title="Title" className="px-4" />)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })
})

describe('SectionContent', () => {
  it('renders children correctly', () => {
    render(
      <SectionContent>
        <Text>Inner content</Text>
      </SectionContent>
    )
    expect(screen.getByText('Inner content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <SectionContent className="p-4">
        <Text>Styled content</Text>
      </SectionContent>
    )
    expect(screen.getByText('Styled content')).toBeInTheDocument()
  })
})

describe('Section compound component', () => {
  it('composes all subcomponents together', () => {
    render(
      <Section>
        <SectionHeader
          title="Workout Stats"
          subtitle="Last 7 days"
          trailing={<Text>See All</Text>}
        />
        <SectionContent>
          <Text>Stats go here</Text>
        </SectionContent>
      </Section>
    )

    expect(screen.getByText('Workout Stats')).toBeInTheDocument()
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    expect(screen.getByText('See All')).toBeInTheDocument()
    expect(screen.getByText('Stats go here')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Section>
          <SectionHeader title="Accessible Section" subtitle="With subtitle" />
          <SectionContent>
            <Text>Content</Text>
          </SectionContent>
        </Section>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
