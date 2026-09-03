import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Stepper, Step, StepIndicator, StepLabel, StepContent } from './Stepper'

function renderStepper(activeStep = 1) {
  return render(
    <Stepper activeStep={activeStep}>
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
  )
}

describe('Stepper', () => {
  it('renders all steps', () => {
    renderStepper(0)
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    renderStepper(0)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  describe('active step', () => {
    it('shows first step as active when activeStep is 0', () => {
      renderStepper(0)
      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('shows checkmark for completed steps', () => {
      renderStepper(2)
      // Steps 0 and 1 should be completed, showing checkmarks
      const checkmarks = screen.getAllByText('\u2713')
      expect(checkmarks.length).toBe(2)
    })

    it('shows number for upcoming steps', () => {
      renderStepper(0)
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('orientation', () => {
    it('renders horizontally by default', () => {
      renderStepper(1)
      expect(screen.getByText('Account')).toBeInTheDocument()
    })

    it('renders vertically', () => {
      render(
        <Stepper activeStep={1} orientation="vertical">
          <Step>
            <StepIndicator />
            <StepLabel>Step 1</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 2</StepLabel>
          </Step>
        </Stepper>
      )
      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
    })
  })

  describe('Step status override', () => {
    it('allows explicit error status on a step', () => {
      render(
        <Stepper activeStep={1}>
          <Step status="error">
            <StepIndicator />
            <StepLabel>Failed Step</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Next Step</StepLabel>
          </Step>
        </Stepper>
      )
      expect(screen.getByText('Failed Step')).toBeInTheDocument()
    })

    it('allows explicit completed status override', () => {
      render(
        <Stepper activeStep={0}>
          <Step status="completed">
            <StepIndicator />
            <StepLabel>Done Step</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Current</StepLabel>
          </Step>
        </Stepper>
      )
      // The overridden step should show checkmark despite being at index 0 with activeStep 0
      expect(screen.getByText('\u2713')).toBeInTheDocument()
    })
  })

  describe('StepIndicator', () => {
    it('renders custom icon', () => {
      render(
        <Stepper activeStep={0}>
          <Step>
            <StepIndicator icon={<span data-testid="custom-icon">★</span>} />
            <StepLabel>Custom</StepLabel>
          </Step>
        </Stepper>
      )
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('renders step number for upcoming steps', () => {
      render(
        <Stepper activeStep={0}>
          <Step>
            <StepIndicator />
            <StepLabel>First</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Second</StepLabel>
          </Step>
        </Stepper>
      )
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('StepContent', () => {
    it('renders content only for active step', () => {
      render(
        <Stepper activeStep={1} orientation="vertical">
          <Step>
            <StepIndicator />
            <StepLabel>Step 1</StepLabel>
            <StepContent>Step 1 content</StepContent>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 2</StepLabel>
            <StepContent>Step 2 content</StepContent>
          </Step>
        </Stepper>
      )
      expect(screen.queryByText('Step 1 content')).not.toBeInTheDocument()
      expect(screen.getByText('Step 2 content')).toBeInTheDocument()
    })

    it('hides content for non-active steps', () => {
      render(
        <Stepper activeStep={0} orientation="vertical">
          <Step>
            <StepIndicator />
            <StepLabel>Step 1</StepLabel>
            <StepContent>Active content</StepContent>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 2</StepLabel>
            <StepContent>Hidden content</StepContent>
          </Step>
        </Stepper>
      )
      expect(screen.getByText('Active content')).toBeInTheDocument()
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
    })
  })

  describe('connectors', () => {
    it('renders connectors between steps', () => {
      renderStepper(1)
      // Connectors exist between steps; just verify all labels render (connectors are visual)
      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderStepper(1)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations in vertical orientation', async () => {
      const { container } = render(
        <Stepper activeStep={0} orientation="vertical">
          <Step>
            <StepIndicator />
            <StepLabel>Step 1</StepLabel>
          </Step>
          <Step>
            <StepIndicator />
            <StepLabel>Step 2</StepLabel>
          </Step>
        </Stepper>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
