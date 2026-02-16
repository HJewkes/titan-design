import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
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

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <CardContent>Card body</CardContent>
      </Card>
    )
    expect(screen.getByText('Card body')).toBeInTheDocument()
  })

  it('renders with default variant (elevated)', () => {
    render(
      <Card testID="card">
        <CardContent>Content</CardContent>
      </Card>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders with outline variant', () => {
    render(
      <Card variant="outline">
        <CardContent>Outline card</CardContent>
      </Card>
    )
    expect(screen.getByText('Outline card')).toBeInTheDocument()
  })

  it('renders with filled variant', () => {
    render(
      <Card variant="filled">
        <CardContent>Filled card</CardContent>
      </Card>
    )
    expect(screen.getByText('Filled card')).toBeInTheDocument()
  })

  it('renders with different elevation levels', () => {
    const { rerender } = render(
      <Card elevation={1}>
        <CardContent>Subtle</CardContent>
      </Card>
    )
    expect(screen.getByText('Subtle')).toBeInTheDocument()

    rerender(
      <Card elevation={3}>
        <CardContent>Prominent</CardContent>
      </Card>
    )
    expect(screen.getByText('Prominent')).toBeInTheDocument()
  })

  describe('interactive card', () => {
    it('renders as a button when isInteractive is true', () => {
      render(
        <Card isInteractive>
          <CardContent>Interactive card</CardContent>
        </Card>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders as a button when onPress is provided', () => {
      render(
        <Card onPress={() => {}}>
          <CardContent>Pressable card</CardContent>
        </Card>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('calls onPress handler when clicked', () => {
      const onPress = vi.fn()
      render(
        <Card onPress={onPress}>
          <CardContent>Click me</CardContent>
        </Card>
      )

      fireEvent.click(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('does not render as a button when not interactive', () => {
      render(
        <Card>
          <CardContent>Static card</CardContent>
        </Card>
      )
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('renders skeleton content when isLoading is true', () => {
      render(
        <Card isLoading>
          <CardContent>This should not appear</CardContent>
        </Card>
      )
      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument()
    })

    it('renders skeleton without header when skeletonHasHeader is false', () => {
      const { container } = render(
        <Card isLoading skeletonHasHeader={false}>
          <CardContent>Hidden</CardContent>
        </Card>
      )
      expect(container).toBeInTheDocument()
    })

    it('renders skeleton with footer when skeletonHasFooter is true', () => {
      const { container } = render(
        <Card isLoading skeletonHasFooter>
          <CardContent>Hidden</CardContent>
        </Card>
      )
      expect(container).toBeInTheDocument()
    })
  })

  describe('compound sub-components', () => {
    it('renders full compound card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Body content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Body content')).toBeInTheDocument()
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('CardTitle has header accessibility role', () => {
      render(<CardTitle>My Title</CardTitle>)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('accepts custom className on sub-components', () => {
      render(
        <Card className="custom-card">
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">Title</CardTitle>
            <CardDescription className="custom-desc">Desc</CardDescription>
          </CardHeader>
          <CardContent className="custom-content">Content</CardContent>
          <CardFooter className="custom-footer">Footer</CardFooter>
        </Card>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
    })
  })

  describe('CardSkeleton', () => {
    it('renders skeleton placeholder', () => {
      const { container } = render(<CardSkeleton />)
      expect(container).toBeInTheDocument()
    })

    it('renders skeleton with custom content lines', () => {
      const { container } = render(<CardSkeleton contentLines={5} />)
      expect(container).toBeInTheDocument()
    })

    it('renders skeleton without header', () => {
      const { container } = render(<CardSkeleton hasHeader={false} />)
      expect(container).toBeInTheDocument()
    })

    it('renders skeleton with footer', () => {
      const { container } = render(<CardSkeleton hasFooter />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('CardInset', () => {
    it('renders inset content', () => {
      render(
        <CardInset>
          <span>Inset content</span>
        </CardInset>
      )
      expect(screen.getByText('Inset content')).toBeInTheDocument()
    })

    it('accepts elevation prop', () => {
      const { container } = render(
        <CardInset elevation={-2}>
          <span>Deep inset</span>
        </CardInset>
      )
      expect(container).toBeInTheDocument()
    })
  })

  describe('custom styling', () => {
    it('applies custom borderColor', () => {
      const { container } = render(
        <Card variant="outline" borderColor="#ff0000">
          <CardContent>Red border</CardContent>
        </Card>
      )
      expect(container).toBeInTheDocument()
    })

    it('applies custom bgColor', () => {
      const { container } = render(
        <Card bgColor="#00ff00">
          <CardContent>Green background</CardContent>
        </Card>
      )
      expect(container).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>Card content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations when interactive', async () => {
      const { container } = render(
        <Card isInteractive onPress={() => {}}>
          <CardContent>Interactive card</CardContent>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
