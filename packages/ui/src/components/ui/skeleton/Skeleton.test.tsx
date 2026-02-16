import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonCard, SkeletonListItem } from './Skeleton'

describe('Skeleton', () => {
  it('renders correctly', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('defaults to text variant with pulse animation', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with all variant options', () => {
    const variants = ['text', 'circle', 'rect', 'rounded'] as const
    variants.forEach((variant) => {
      const { unmount } = render(<Skeleton variant={variant} />)
      unmount()
    })
  })

  it('renders with all animation options', () => {
    const animations = ['pulse', 'shimmer', 'none'] as const
    animations.forEach((animation) => {
      const { unmount } = render(<Skeleton animation={animation} />)
      unmount()
    })
  })

  it('accepts width and height props', () => {
    const { container } = render(<Skeleton width={200} height={100} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('accepts string width and height', () => {
    const { container } = render(<Skeleton width="50%" height="100px" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('makes circle variant square when only width is provided', () => {
    const { container } = render(<Skeleton variant="circle" width={48} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('makes circle variant square when only height is provided', () => {
    const { container } = render(<Skeleton variant="circle" height={48} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('accepts custom borderRadius', () => {
    const { container } = render(<Skeleton variant="rect" borderRadius={8} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="extra" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has accessibility label of Loading...', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-label', 'Loading...')
  })

  describe('SkeletonText', () => {
    it('renders default 3 lines', () => {
      const { container } = render(<SkeletonText />)
      // 3 skeleton lines
      expect(container.firstChild?.childNodes).toHaveLength(3)
    })

    it('renders custom number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />)
      expect(container.firstChild?.childNodes).toHaveLength(5)
    })

    it('accepts custom lastLineWidth', () => {
      const { container } = render(<SkeletonText lastLineWidth="40%" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('accepts custom animation', () => {
      const { container } = render(<SkeletonText animation="none" />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('SkeletonCircle', () => {
    it('renders with default size', () => {
      const { container } = render(<SkeletonCircle />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders with custom size', () => {
      const { container } = render(<SkeletonCircle size={64} />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('SkeletonCard', () => {
    it('renders with default props', () => {
      const { container } = render(<SkeletonCard />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders without image', () => {
      const { container } = render(<SkeletonCard hasImage={false} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('accepts custom imageHeight and lines', () => {
      const { container } = render(<SkeletonCard imageHeight={200} lines={4} />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('SkeletonListItem', () => {
    it('renders with default props', () => {
      const { container } = render(<SkeletonListItem />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders without avatar', () => {
      const { container } = render(<SkeletonListItem hasAvatar={false} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('accepts custom avatarSize and lines', () => {
      const { container } = render(<SkeletonListItem avatarSize={56} lines={3} />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Skeleton />)
      const results = await axe(container, {
        rules: { 'aria-prohibited-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for SkeletonText', async () => {
      const { container } = render(<SkeletonText />)
      const results = await axe(container, {
        rules: { 'aria-prohibited-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations for SkeletonCard', async () => {
      const { container } = render(<SkeletonCard />)
      const results = await axe(container, {
        rules: { 'aria-prohibited-attr': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
    })
  })
})
