import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { View, Text } from 'react-native'
import { SupersetWrapper } from './SupersetWrapper'

describe('SupersetWrapper', () => {
  describe('label', () => {
    it('renders default label "SS"', () => {
      render(
        <SupersetWrapper>
          <View />
        </SupersetWrapper>,
      )
      expect(screen.getByTestId('superset-label')).toHaveTextContent('SS')
    })

    it('renders custom label', () => {
      render(
        <SupersetWrapper label="A1/A2">
          <View />
        </SupersetWrapper>,
      )
      expect(screen.getByTestId('superset-label')).toHaveTextContent('A1/A2')
    })
  })

  describe('color', () => {
    it('applies default color #FF7900 to border and label background', () => {
      render(
        <SupersetWrapper>
          <View />
        </SupersetWrapper>,
      )
      const wrapper = screen.getByTestId('superset-wrapper')
      expect(wrapper).toHaveStyle({ borderLeftColor: '#FF7900' })

      const label = screen.getByTestId('superset-label')
      expect(label).toHaveStyle({ backgroundColor: '#FF7900' })
    })

    it('applies custom color to border and label background', () => {
      render(
        <SupersetWrapper color="#22C55E">
          <View />
        </SupersetWrapper>,
      )
      const wrapper = screen.getByTestId('superset-wrapper')
      expect(wrapper).toHaveStyle({ borderLeftColor: '#22C55E' })

      const label = screen.getByTestId('superset-label')
      expect(label).toHaveStyle({ backgroundColor: '#22C55E' })
    })
  })

  describe('children', () => {
    it('renders children', () => {
      render(
        <SupersetWrapper>
          <Text testID="child-1">Exercise A</Text>
          <Text testID="child-2">Exercise B</Text>
        </SupersetWrapper>,
      )
      expect(screen.getByTestId('child-1')).toHaveTextContent('Exercise A')
      expect(screen.getByTestId('child-2')).toHaveTextContent('Exercise B')
    })
  })

  describe('accessibility', () => {
    it('has group role', () => {
      render(
        <SupersetWrapper>
          <View />
        </SupersetWrapper>,
      )
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('has correct accessibility label with default label', () => {
      render(
        <SupersetWrapper>
          <View />
        </SupersetWrapper>,
      )
      expect(screen.getByLabelText('Superset: SS')).toBeInTheDocument()
    })

    it('has correct accessibility label with custom label', () => {
      render(
        <SupersetWrapper label="A1/A2">
          <View />
        </SupersetWrapper>,
      )
      expect(screen.getByLabelText('Superset: A1/A2')).toBeInTheDocument()
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <SupersetWrapper>
          <Text>Exercise A</Text>
          <Text>Exercise B</Text>
        </SupersetWrapper>,
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('label positioning', () => {
    it('positions label absolutely', () => {
      render(
        <SupersetWrapper>
          <View />
        </SupersetWrapper>,
      )
      const label = screen.getByTestId('superset-label')
      expect(label).toHaveStyle({ position: 'absolute' })
    })

    it('positions label at top -1 and left -3', () => {
      render(
        <SupersetWrapper>
          <View />
        </SupersetWrapper>,
      )
      const label = screen.getByTestId('superset-label')
      expect(label).toHaveStyle({ top: '-1px', left: '-3px' })
    })
  })
})
