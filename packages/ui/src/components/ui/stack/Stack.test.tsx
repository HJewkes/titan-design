import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Stack, HStack, VStack } from './Stack'

describe('Stack', () => {
  it('renders children correctly', () => {
    render(
      <Stack>
        <span>Item 1</span>
        <span>Item 2</span>
      </Stack>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('renders with testID', () => {
    render(
      <Stack testID="my-stack">
        <span>Child</span>
      </Stack>
    )
    expect(screen.getByTestId('my-stack')).toBeInTheDocument()
  })

  it('renders with gap prop without crashing', () => {
    const { container } = render(
      <Stack gap={4}>
        <span>A</span>
        <span>B</span>
      </Stack>
    )
    expect(container.firstChild).toBeTruthy()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('renders with align and justify props without crashing', () => {
    const { container } = render(
      <Stack align="center" justify="between">
        <span>Child</span>
      </Stack>
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with wrap prop without crashing', () => {
    const { container } = render(
      <Stack wrap>
        <span>Child</span>
      </Stack>
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with className prop without crashing', () => {
    const { container } = render(
      <Stack className="p-4">
        <span>Child</span>
      </Stack>
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with all props combined', () => {
    render(
      <Stack gap={8} align="center" justify="between" wrap className="mt-2" testID="full-stack">
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </Stack>
    )
    expect(screen.getByTestId('full-stack')).toBeInTheDocument()
    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
    expect(screen.getByText('Three')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Stack gap={4}>
          <span>Item 1</span>
          <span>Item 2</span>
        </Stack>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('HStack', () => {
  it('renders children correctly', () => {
    render(
      <HStack>
        <span>Left</span>
        <span>Right</span>
      </HStack>
    )
    expect(screen.getByText('Left')).toBeInTheDocument()
    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('renders with gap and alignment props', () => {
    render(
      <HStack gap={2} align="center" testID="hstack">
        <span>A</span>
        <span>B</span>
      </HStack>
    )
    expect(screen.getByTestId('hstack')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('merges custom className without crashing', () => {
    render(
      <HStack className="bg-red-500" testID="styled-hstack">
        <span>Child</span>
      </HStack>
    )
    expect(screen.getByTestId('styled-hstack')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <HStack gap={4}>
          <span>Left</span>
          <span>Right</span>
        </HStack>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

describe('VStack', () => {
  it('renders children correctly', () => {
    render(
      <VStack>
        <span>Top</span>
        <span>Bottom</span>
      </VStack>
    )
    expect(screen.getByText('Top')).toBeInTheDocument()
    expect(screen.getByText('Bottom')).toBeInTheDocument()
  })

  it('renders with gap and alignment props', () => {
    render(
      <VStack gap={6} justify="center" testID="vstack">
        <span>A</span>
        <span>B</span>
      </VStack>
    )
    expect(screen.getByTestId('vstack')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('merges custom className without crashing', () => {
    render(
      <VStack className="mt-4" testID="styled-vstack">
        <span>Child</span>
      </VStack>
    )
    expect(screen.getByTestId('styled-vstack')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <VStack gap={4}>
          <span>Top</span>
          <span>Bottom</span>
        </VStack>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
