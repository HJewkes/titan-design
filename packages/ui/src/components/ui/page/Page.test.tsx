import React from 'react'
import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import fc from 'fast-check'
import { Text } from 'react-native'
import { fcAssert } from '../../../test/property'
import { Page, PageHeader } from './Page'

expect.extend(toHaveNoViolations)

// jsdom has no NativeWind transform, so surface className as data-cls for class-name assertions.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const withCls = <P extends { className?: string }>(Base: React.ComponentType<P>) =>
    function WithCls(props: P) {
      return <Base {...props} dataSet={{ cls: props.className ?? '' }} />
    }
  return {
    ...actual,
    View: withCls(actual.View as React.ComponentType<{ className?: string }>),
    ScrollView: withCls(actual.ScrollView as React.ComponentType<{ className?: string }>),
  }
})

const cls = (el: Element | null | undefined) => el?.getAttribute('data-cls') ?? ''

const GUTTERS = ['sm', 'md'] as const
const WIDTHS = ['narrow', 'wide', 'full'] as const
const CAPS = { narrow: 'max-w-[760px]', wide: 'max-w-[1100px]' } as const

function inner() {
  return screen.getByTestId('body').parentElement?.parentElement as HTMLElement
}

function outer() {
  return inner().parentElement as HTMLElement
}

function body() {
  return <Text testID="body">Body content</Text>
}

describe('Page', () => {
  it('renders the header above the body in document order', () => {
    render(
      <Page header={<Text>Header content</Text>}>
        <Text>Body content</Text>
      </Page>
    )
    const header = screen.getByText('Header content')
    const content = screen.getByText('Body content')
    expect(header.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('omitting header renders no header node and the body still renders', () => {
    render(<Page>{body()}</Page>)
    expect(screen.getByText('Body content')).toBeTruthy()
    expect(inner().children).toHaveLength(1)
  })

  it.each([
    ['md', 'p-gutter-md', 'p-gutter-sm'],
    ['sm', 'p-gutter-sm', 'p-gutter-md'],
  ] as const)('gutter %s carries %s and not %s', (gutter, want, notWant) => {
    render(<Page gutter={gutter}>{body()}</Page>)
    expect(cls(outer())).toContain(want)
    expect(cls(outer())).not.toContain(notWant)
  })

  it('defaults to p-gutter-md', () => {
    render(<Page>{body()}</Page>)
    expect(cls(outer())).toContain('p-gutter-md')
  })

  it.each([
    ['full', undefined],
    ['narrow', 'max-w-[760px]'],
    ['wide', 'max-w-[1100px]'],
  ] as const)('maxWidth %s sets cap %s', (maxWidth, cap) => {
    render(<Page maxWidth={maxWidth}>{body()}</Page>)
    const classes = cls(inner())
    if (cap) expect(classes).toContain(cap)
    else expect(classes).not.toContain('max-w-')
  })

  it('defaults to no cap', () => {
    render(<Page>{body()}</Page>)
    expect(cls(inner())).not.toContain('max-w-')
  })

  it.each(GUTTERS.flatMap((g) => WIDTHS.map((w) => [g, w] as const)))(
    'gutter %s with maxWidth %s yields one gutter class and at most one cap class',
    (gutter, maxWidth) => {
      render(
        <Page gutter={gutter} maxWidth={maxWidth}>
          {body()}
        </Page>
      )
      const gutters = cls(outer()).split(/\s+/)
      const classes = cls(inner()).split(/\s+/)
      expect(gutters.filter((c) => c.startsWith('p-gutter-'))).toHaveLength(1)
      expect(classes.filter((c) => c.startsWith('p-gutter-'))).toHaveLength(0)
      expect(classes.filter((c) => c.startsWith('max-w-'))).toHaveLength(
        maxWidth === 'full' ? 0 : 1
      )
      if (maxWidth !== 'full') expect(classes).toContain(CAPS[maxWidth])
    }
  )

  it('the header and body are separated by gap-section-sm', () => {
    render(<Page header={<Text>Header content</Text>}>{body()}</Page>)
    expect(cls(inner()).split(/\s+/)).toContain('gap-section-sm')
  })

  it('the root is the main landmark', () => {
    render(<Page>{body()}</Page>)
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('isScrollable renders the scroll view by default', () => {
    const { container } = render(<Page>{body()}</Page>)
    expect(container.querySelector('[data-testid="page-scroll"]')).not.toBeNull()
  })

  it('isScrollable={false} renders no scroll view and gives the body flex-1', () => {
    const { container } = render(<Page isScrollable={false}>{body()}</Page>)
    expect(container.querySelector('[data-testid="page-scroll"]')).toBeNull()
    expect(cls(screen.getByTestId('body').parentElement)).toContain('flex-1')
    expect(cls(inner())).toContain('flex-1')
    expect(cls(outer())).toContain('flex-1')
  })

  it('className lands on the root and contentClassName on the column, and a consumer class wins through cn()', () => {
    render(
      <Page testID="root" className="root-x" contentClassName="p-gutter-sm col-x">
        {body()}
      </Page>
    )
    const root = screen.getByTestId('root')
    expect(cls(root)).toContain('root-x')
    expect(cls(root)).not.toContain('col-x')
    expect(cls(outer())).toContain('col-x')
    expect(cls(outer())).not.toContain('root-x')
    expect(cls(outer())).not.toContain('p-gutter-md')
  })

  it.each([
    ['full', false],
    ['narrow', true],
    ['wide', true],
  ] as const)('maxWidth %s centres the inner column: %s', (maxWidth, centred) => {
    render(<Page maxWidth={maxWidth}>{body()}</Page>)
    expect(cls(inner()).split(/\s+/).includes('self-center')).toBe(centred)
    expect(cls(outer())).not.toContain('self-center')
  })

  it('the inner column fills below its cap with w-full', () => {
    render(<Page maxWidth="narrow">{body()}</Page>)
    expect(cls(inner()).split(/\s+/)).toContain('w-full')
  })

  it('a default header scrolls inside page-scroll and renders no band', () => {
    const { container } = render(<Page header={<Text>Header content</Text>}>{body()}</Page>)
    const scroller = container.querySelector('[data-testid="page-scroll"]') as HTMLElement
    expect(scroller.contains(screen.getByText('Header content'))).toBe(true)
    expect(screen.queryByTestId('page-header-band')).toBeNull()
    expect(container.innerHTML).not.toContain('border-hairline-strong')
  })

  it('a pinned header sits in the band outside page-scroll, with the rule and the gutter', () => {
    const { container } = render(
      <Page isHeaderPinned gutter="sm" maxWidth="narrow" header={<Text>Header content</Text>}>
        {body()}
      </Page>
    )
    const scroller = container.querySelector('[data-testid="page-scroll"]') as HTMLElement
    const band = screen.getByTestId('page-header-band')
    expect(scroller.contains(screen.getByText('Header content'))).toBe(false)
    expect(band.contains(screen.getByText('Header content'))).toBe(true)
    expect(scroller.contains(screen.getByText('Body content'))).toBe(true)
    expect(cls(band).split(/\s+/)).toEqual(
      expect.arrayContaining(['border-b', 'border-hairline-strong', 'p-gutter-sm'])
    )
    const bandInner = band.firstElementChild
    expect(cls(bandInner)).toContain('max-w-[760px]')
    expect(cls(bandInner)).toContain('self-center')
  })

  it('a pinned header renders before the scroller in document order', () => {
    const { container } = render(
      <Page isHeaderPinned header={<Text>Header content</Text>}>
        {body()}
      </Page>
    )
    const band = screen.getByTestId('page-header-band')
    const scroller = container.querySelector('[data-testid="page-scroll"]') as HTMLElement
    expect(band.compareDocumentPosition(scroller) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('isHeaderPinned without a header renders no band', () => {
    render(<Page isHeaderPinned>{body()}</Page>)
    expect(screen.queryByTestId('page-header-band')).toBeNull()
  })

  it('PageHeader pulls its row up by the cap offset', () => {
    render(<PageHeader title="Overview" testID="hdr" />)
    expect(cls(screen.getByTestId('hdr'))).toContain('-mt-1.5')
  })

  it('ViewProps such as testID reach the root', () => {
    render(<Page testID="root">{body()}</Page>)
    expect(screen.getByTestId('root').getAttribute('role')).toBe('main')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Page
        header={<PageHeader title="Overview" description="About" trailing={<Text>Act</Text>} />}
      >
        {body()}
      </Page>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each([
    ['no header', <Page key="a">{body()}</Page>],
    [
      'pinned',
      <Page key="p" isHeaderPinned maxWidth="wide" header={<PageHeader title="Overview" />}>
        {body()}
      </Page>,
    ],
    ['empty body', <Page key="b" header={<PageHeader title="Overview" />} />],
    [
      'fill',
      <Page key="c" isScrollable={false} header={<PageHeader title="Overview" />}>
        {body()}
      </Page>,
    ],
    [
      'tall body',
      <Page key="d" header={<PageHeader title="Overview" />}>
        {Array.from({ length: 40 }, (_, i) => (
          <Text key={i}>Row {i}</Text>
        ))}
      </Page>,
    ],
  ])('has no axe violations: %s', async (_name, ui) => {
    const { container } = render(ui)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('PageHeader', () => {
  it('renders the title as the only level-1 heading', () => {
    render(<PageHeader title="Overview" description="Some description" />)
    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(1)
    expect(headings[0].textContent).toBe('Overview')
    expect(headings[0].getAttribute('aria-level')).toBe('1')
  })

  it('renders no description node and no trailing node when they are omitted', () => {
    const { container } = render(<PageHeader title="Overview" testID="hdr" />)
    const text = screen.getByTestId('hdr').children[0]
    expect(screen.getByTestId('hdr').children).toHaveLength(1)
    expect(text.children).toHaveLength(1)
    expect(container.textContent).toBe('Overview')
  })

  it('keeps a 120-character title and its trailing action both in the document', () => {
    const title = 'T'.repeat(120)
    render(<PageHeader title={title} trailing={<Text>Action</Text>} />)
    expect(screen.getByRole('heading').textContent).toBe(title)
    expect(screen.getByText('Action')).toBeTruthy()
  })

  it('renders exactly one heading whose text is the title for any non-blank title', () => {
    fcAssert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (title) => {
          const { unmount } = render(<PageHeader title={title} />)
          const headings = screen.getAllByRole('heading')
          const ok = headings.length === 1 && headings[0].textContent === title
          unmount()
          return ok
        }
      )
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <PageHeader title="Overview" description="About" trailing={<Text>Act</Text>} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
