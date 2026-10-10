import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders breadcrumb items', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
        <BreadcrumbItem onPress={() => {}}>Products</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Widget</BreadcrumbItem>
      </Breadcrumbs>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Widget')).toBeInTheDocument()
  })

  it('renders default separator between items', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Page</BreadcrumbItem>
      </Breadcrumbs>
    )

    // Default separator is '/'
    const separators = screen.getAllByText('/')
    expect(separators).toHaveLength(1)
  })

  it('renders custom separator', () => {
    render(
      <Breadcrumbs separator=">">
        <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Page</BreadcrumbItem>
      </Breadcrumbs>
    )

    expect(screen.getByText('>')).toBeInTheDocument()
  })

  it('does not render separator after the last item', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
        <BreadcrumbItem onPress={() => {}}>Products</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Widget</BreadcrumbItem>
      </Breadcrumbs>
    )

    const separators = screen.getAllByText('/')
    expect(separators).toHaveLength(2)
  })

  describe('maxItems with collapse', () => {
    it('collapses items when exceeding maxItems', () => {
      render(
        <Breadcrumbs maxItems={3}>
          <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Products</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Category</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Subcategory</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Widget</BreadcrumbItem>
        </Breadcrumbs>
      )

      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Widget')).toBeInTheDocument()
    })

    it('does not collapse when items are within maxItems', () => {
      render(
        <Breadcrumbs maxItems={5}>
          <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Page</BreadcrumbItem>
        </Breadcrumbs>
      )

      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })
  })

  describe('BreadcrumbItem', () => {
    it('renders as link when not current page', () => {
      render(
        <Breadcrumbs>
          <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
        </Breadcrumbs>
      )

      expect(screen.getByRole('link')).toBeInTheDocument()
    })

    it('renders as text when isCurrentPage is true', () => {
      render(
        <Breadcrumbs>
          <BreadcrumbItem isCurrentPage>Current</BreadcrumbItem>
        </Breadcrumbs>
      )

      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('calls onPress handler when clicked', () => {
      const onPress = vi.fn()
      render(
        <Breadcrumbs>
          <BreadcrumbItem onPress={onPress}>Home</BreadcrumbItem>
        </Breadcrumbs>
      )

      fireEvent.click(screen.getByRole('link'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('renders an anchor carrying the href on web', () => {
      render(
        <Breadcrumbs>
          <BreadcrumbItem href="/products">Products</BreadcrumbItem>
        </Breadcrumbs>
      )

      const anchor = screen.getByRole('link')
      expect(anchor.tagName).toBe('A')
      expect(anchor).toHaveAttribute('href', '/products')
    })

    it('fires onPress and keeps routing in the handler on a plain click of an href item', () => {
      const onPress = vi.fn()
      render(
        <Breadcrumbs>
          <BreadcrumbItem href="/products" onPress={onPress}>
            Products
          </BreadcrumbItem>
        </Breadcrumbs>
      )

      const anchor = screen.getByRole('link')
      const notPrevented = fireEvent.click(anchor)
      expect(anchor.tagName).toBe('A')
      expect(onPress).toHaveBeenCalledTimes(1)
      expect(notPrevented).toBe(false)
    })

    it.each([{ metaKey: true }, { ctrlKey: true }])(
      'leaves a modified click %o to the browser so it opens a new tab',
      (modifier) => {
        const onPress = vi.fn()
        render(
          <Breadcrumbs>
            <BreadcrumbItem href="#products" onPress={onPress}>
              Products
            </BreadcrumbItem>
          </Breadcrumbs>
        )

        const notPrevented = fireEvent.click(screen.getByRole('link'), modifier)
        expect(notPrevented).toBe(true)
        expect(onPress).not.toHaveBeenCalled()
      }
    )

    it('renders an anchor only for the item that has an href', () => {
      render(
        <Breadcrumbs>
          <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
          <BreadcrumbItem href="/products">Products</BreadcrumbItem>
        </Breadcrumbs>
      )

      const [withoutHref, withHref] = screen.getAllByRole('link')
      expect(withoutHref.tagName).not.toBe('A')
      expect(withHref.tagName).toBe('A')
    })

    it('sets aria-current on current page item', () => {
      render(
        <Breadcrumbs>
          <BreadcrumbItem isCurrentPage>Current Page</BreadcrumbItem>
        </Breadcrumbs>
      )

      expect(screen.getByText('Current Page')).toHaveAttribute('aria-current', 'page')
    })

    it('accepts custom className', () => {
      render(
        <Breadcrumbs>
          <BreadcrumbItem className="custom-class" isCurrentPage>
            Styled
          </BreadcrumbItem>
        </Breadcrumbs>
      )
      expect(screen.getByText('Styled')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Breadcrumbs>
          <BreadcrumbItem onPress={() => {}}>Home</BreadcrumbItem>
          <BreadcrumbItem onPress={() => {}}>Products</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Widget</BreadcrumbItem>
        </Breadcrumbs>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with href items', async () => {
      const { container } = render(
        <Breadcrumbs>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem href="/products">Products</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Widget</BreadcrumbItem>
        </Breadcrumbs>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
