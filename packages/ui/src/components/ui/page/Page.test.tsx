import React from 'react'
import { vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import fc from 'fast-check'
import { Text } from 'react-native'
import { fcAssert } from '../../../test/property'
import { Surface } from '../surface'
import { surfaceBackground } from '../../../theme/surface-planes'
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
    Text: withCls(actual.Text as React.ComponentType<{ className?: string }>),
    ScrollView: function ScrollViewWithCls(props: {
      className?: string
      stickyHeaderIndices?: number[]
    }) {
      const Base = actual.ScrollView as React.ComponentType<Record<string, unknown>>
      return (
        <Base
          {...props}
          dataSet={{ cls: props.className ?? '', sticky: String(props.stickyHeaderIndices ?? '') }}
        />
      )
    },
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
    ['md', ['p-gutter-sm', 'sm:p-gutter-md']],
    ['sm', ['p-gutter-sm']],
  ] as const)('gutter %s carries %j', (gutter, want) => {
    render(<Page gutter={gutter}>{body()}</Page>)
    const classes = cls(outer()).split(/\s+/)
    expect(classes.filter((c) => c.includes('p-gutter-')).sort()).toEqual([...want].sort())
  })

  it('defaults to p-gutter-md', () => {
    render(<Page>{body()}</Page>)
    expect(cls(outer())).toContain('sm:p-gutter-md')
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
    expect(cls(outer()).split(/\s+/)).not.toContain('p-gutter-md')
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

  it('a pinned header sits in a band inside page-scroll, with the rule and the gutter', () => {
    const { container } = render(
      <Page isHeaderPinned gutter="sm" maxWidth="narrow" header={<Text>Header content</Text>}>
        {body()}
      </Page>
    )
    const scroller = container.querySelector('[data-testid="page-scroll"]') as HTMLElement
    const band = screen.getByTestId('page-header-band')
    expect(scroller.contains(band)).toBe(true)
    expect(band.contains(screen.getByText('Header content'))).toBe(true)
    expect(band.contains(screen.getByText('Body content'))).toBe(false)
    expect(cls(band).split(/\s+/)).toEqual(
      expect.arrayContaining(['border-b', 'border-hairline-strong', 'p-gutter-sm'])
    )
    const bandInner = band.firstElementChild
    expect(cls(bandInner)).toContain('max-w-[760px]')
    expect(cls(bandInner)).toContain('self-center')
  })

  it('a pinned header is the scroller sticky header; an unpinned page has none', () => {
    const { container, unmount } = render(
      <Page isHeaderPinned header={<Text>Header content</Text>}>
        {body()}
      </Page>
    )
    const scroller = () => container.querySelector('[data-testid="page-scroll"]') as HTMLElement
    expect(scroller().getAttribute('data-sticky')).toBe('0')
    unmount()
    const unpinned = render(<Page header={<Text>Header content</Text>}>{body()}</Page>)
    expect(
      unpinned.container.querySelector('[data-testid="page-scroll"]')?.getAttribute('data-sticky')
    ).toBe('')
  })

  it('the band paints the plane of the enclosing surface', () => {
    const colour = (value: string) => {
      const probe = document.createElement('div')
      probe.style.backgroundColor = value
      return probe.style.backgroundColor
    }
    const bandColour = (ui: React.ReactElement) => {
      const { unmount } = render(ui)
      const value = (screen.getByTestId('page-header-band') as HTMLElement).style.backgroundColor
      unmount()
      return value
    }
    const page = (
      <Page isHeaderPinned header={<Text>Header content</Text>}>
        {body()}
      </Page>
    )
    expect(bandColour(<Surface level="overlay">{page}</Surface>)).toBe(
      colour(surfaceBackground('overlay', 'dark'))
    )
    expect(bandColour(<Surface level="base">{page}</Surface>)).toBe(
      colour(surfaceBackground('base', 'dark'))
    )
    expect(surfaceBackground('overlay', 'dark')).not.toBe(surfaceBackground('base', 'dark'))
  })

  it('a pinned header renders before the body in document order', () => {
    render(
      <Page isHeaderPinned header={<Text>Header content</Text>}>
        {body()}
      </Page>
    )
    const band = screen.getByTestId('page-header-band')
    expect(
      band.compareDocumentPosition(screen.getByText('Body content')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('pinned spacing is 24 above the rule and 12 below it', () => {
    render(
      <Page isHeaderPinned header={<Text>Header content</Text>}>
        {body()}
      </Page>
    )
    expect(cls(screen.getByTestId('page-header-band')).split(/\s+/)).toEqual(
      expect.arrayContaining(['pb-gutter-sm', 'sm:pb-section-sm'])
    )
    expect(cls(outer()).split(/\s+/)).toEqual(
      expect.arrayContaining(['pt-inset-md', 'sm:pt-inset-md'])
    )
  })

  it('an unpinned page keeps the full gutter above the body', () => {
    render(<Page header={<Text>Header content</Text>}>{body()}</Page>)
    expect(cls(outer())).not.toContain('pt-inset-md')
  })

  it.each([[undefined], [null], [false], ['']])(
    'isHeaderPinned with header %j renders no band',
    (header) => {
      render(
        <Page isHeaderPinned header={header as React.ReactNode}>
          {body()}
        </Page>
      )
      expect(screen.queryByTestId('page-header-band')).toBeNull()
    }
  )

  it.each([
    ['pinned', true],
    ['pinned and not scrollable', true],
    ['unpinned', false],
  ])('a %s page reserves no scrollbar gutter', (name, isHeaderPinned) => {
    const { container } = render(
      <Page
        isHeaderPinned={isHeaderPinned}
        isScrollable={!name.includes('not scrollable')}
        header={<Text>Header content</Text>}
      >
        {body()}
      </Page>
    )
    expect(container.innerHTML).not.toContain('scrollbar-gutter')
  })

  describe('scroll shadow', () => {
    function renderPinned(hasScrollShadow: boolean) {
      const { container } = render(
        <Page isHeaderPinned hasScrollShadow={hasScrollShadow} header={<Text>Header content</Text>}>
          {body()}
        </Page>
      )
      return container.querySelector('[data-testid="page-scroll"]') as HTMLElement
    }
    const shadowOf = () => (screen.getByTestId('page-header-band') as HTMLElement).style.boxShadow

    it('casts no shadow until content scrolls under the band', async () => {
      const scroller = renderPinned(true)
      expect(shadowOf()).toBe('none')
      scroller.scrollTop = 40
      fireEvent.scroll(scroller)
      expect(shadowOf()).not.toBe('none')
      await new Promise((resolve) => setTimeout(resolve, 30))
      scroller.scrollTop = 0
      fireEvent.scroll(scroller)
      expect(shadowOf()).toBe('none')
    })

    it('is off by default', () => {
      const { container } = render(
        <Page isHeaderPinned header={<Text>Header content</Text>}>
          {body()}
        </Page>
      )
      const scroller = container.querySelector('[data-testid="page-scroll"]') as HTMLElement
      scroller.scrollTop = 40
      fireEvent.scroll(scroller)
      expect(shadowOf()).toBe('none')
    })
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
  it('the title column keeps flex-1 min-w-0 and the row never wraps, with or without an action', () => {
    const titleColumn = (trailing?: React.ReactNode) => {
      const { unmount } = render(<PageHeader title="Overview" trailing={trailing} testID="hdr" />)
      const row = screen.getByTestId('hdr')
      const column = screen.getByRole('heading').parentElement as HTMLElement
      const result = { column: cls(column).split(/\s+/), row: cls(row).split(/\s+/) }
      unmount()
      return result
    }
    for (const result of [titleColumn(), titleColumn(<Text>Action</Text>)]) {
      expect(result.column).toEqual(expect.arrayContaining(['flex-1', 'min-w-0']))
      expect(result.row).toEqual(expect.arrayContaining(['flex-row', 'items-start']))
      expect(result.row).not.toContain('flex-wrap')
    }
  })

  it('keeps the action in its own corner without shrinking and lets the title shrink', () => {
    render(<PageHeader title="Overview" trailing={<Text>Act</Text>} testID="hdr" />)
    const [titleColumn, action] = Array.from(screen.getByTestId('hdr').children)
    expect(cls(titleColumn)).toContain('min-w-0')
    expect(cls(action)).toContain('shrink-0')
  })

  it('tightens spacing and type on small screens with breakpoint variants', () => {
    render(<PageHeader title="Overview" testID="hdr" />)
    expect(cls(screen.getByTestId('hdr'))).toContain('gap-inline-md')
    expect(cls(screen.getByTestId('hdr'))).toContain('sm:gap-inline-lg')
    expect(cls(screen.getByRole('heading')).split(/\s+/)).toEqual(
      expect.arrayContaining(['text-lg', 'sm:text-xl', 'leading-tight'])
    )
  })

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
