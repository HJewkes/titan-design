import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text, View } from 'react-native'

import { Carousel, CarouselSlide, type CarouselProps } from './Carousel'

/** A slide's name is its position; the scroller's group is named after the carousel. */
const SLIDE_NAME = /^\d+ of \d+/

const LIFTS = ['Bench press', 'Back squat', 'Cable overhead tricep extension']

function renderCarousel(names: string[] = LIFTS, props: Partial<CarouselProps> = {}) {
  return render(
    <Carousel label="Per-lift" {...props}>
      {names.map((name) => (
        <CarouselSlide key={name} value={name} label={name}>
          <View>
            <Text>{name}</Text>
          </View>
        </CarouselSlide>
      ))}
    </Carousel>
  )
}

describe('Carousel', () => {
  it('labels the region and every slide by position and name', () => {
    renderCarousel()

    expect(screen.getByRole('region', { name: 'Per-lift' })).toHaveAttribute(
      'aria-roledescription',
      'carousel'
    )
    const slide = screen.getByRole('group', { name: '3 of 3: Cable overhead tricep extension' })
    expect(slide).toHaveAttribute('aria-roledescription', 'slide')
  })

  it('keeps every slide in the accessibility tree, not only the one in view', () => {
    renderCarousel()

    expect(screen.getAllByRole('group', { name: SLIDE_NAME })).toHaveLength(3)
    screen
      .getAllByRole('group')
      .forEach((slide) => expect(slide).not.toHaveAttribute('aria-hidden'))
  })

  it('shows the position between the arrows, as a polite live region', () => {
    renderCarousel()

    const position = screen.getByTestId('carousel-position')
    expect(position).toHaveTextContent('1 of 3')
    expect(position.parentElement).toHaveAttribute('aria-live', 'polite')
  })

  it('moves one slide per arrow press and, without a loop, stops at the ends', () => {
    const onValueChange = vi.fn()
    renderCarousel(LIFTS, { onValueChange, loop: false })
    const previous = screen.getByRole('button', { name: 'Previous slide' })
    const next = screen.getByRole('button', { name: 'Next slide' })

    expect(previous).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(next)
    fireEvent.click(next)

    expect(screen.getByTestId('carousel-position')).toHaveTextContent('3 of 3')
    expect(next).toHaveAttribute('aria-disabled', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('Cable overhead tricep extension', 2)
  })

  it('stays on the same card when a card before it disappears on a refresh', () => {
    const { rerender } = renderCarousel(LIFTS, { defaultValue: 'Back squat' })

    rerender(
      <Carousel label="Per-lift" defaultValue="Back squat">
        {LIFTS.slice(1).map((name) => (
          <CarouselSlide key={name} value={name} label={name}>
            <Text>{name}</Text>
          </CarouselSlide>
        ))}
      </Carousel>
    )

    expect(screen.getByTestId('carousel-position')).toHaveTextContent('1 of 2')
    expect(screen.getByRole('group', { name: '1 of 2: Back squat' })).toBeInTheDocument()
  })

  it('makes a slide current when focus moves into it', () => {
    const onValueChange = vi.fn()
    renderCarousel(LIFTS, { onValueChange })

    fireEvent.focus(screen.getByTestId('carousel-slide-Back squat'))

    expect(onValueChange).toHaveBeenCalledWith('Back squat', 1)
    expect(screen.getByTestId('carousel-position')).toHaveTextContent('2 of 3')
  })

  it('renders one card plainly, with no region, arrows or counter', () => {
    renderCarousel(['Bench press'])

    expect(screen.getByText('Bench press')).toBeInTheDocument()
    expect(screen.queryByRole('region')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders nothing with no cards', () => {
    const { container } = renderCarousel([])

    expect(container).toBeEmptyDOMElement()
  })

  it('ignores children that are not slides', () => {
    render(
      <Carousel label="Mixed">
        <Text>stray</Text>
        <CarouselSlide value="a" label="A">
          <Text>A</Text>
        </CarouselSlide>
      </Carousel>
    )

    expect(screen.queryByText('stray')).toBeNull()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('copies each end card when it loops, as scenery only', () => {
    renderCarousel(LIFTS, { loop: true })

    const clones = screen.getAllByTestId(/^carousel-clone-/)
    expect(clones).toHaveLength(2)
    clones.forEach((clone) => {
      expect(clone).toHaveAttribute('aria-hidden', 'true')
      expect(clone).not.toHaveAttribute('role', 'group')
    })
    expect(screen.getAllByRole('group', { name: SLIDE_NAME })).toHaveLength(3)
  })

  it('never disables an arrow while it loops', () => {
    renderCarousel(LIFTS, { loop: true })

    expect(screen.getByRole('button', { name: 'Previous slide' })).not.toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Next slide' })).not.toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('does not copy two cards, which would put the same card on screen twice', () => {
    renderCarousel(LIFTS.slice(0, 2), { loop: true })

    expect(screen.queryAllByTestId(/^carousel-clone-/)).toHaveLength(0)
    expect(screen.getByTestId('carousel-position')).toHaveTextContent('1 of 2')
  })

  it('counts only the real cards while looping', () => {
    renderCarousel(LIFTS, { loop: true })

    expect(screen.getByTestId('carousel-position')).toHaveTextContent('1 of 3')
  })

  it('has no accessibility violations while looping', async () => {
    const { container } = renderCarousel(LIFTS, { loop: true })

    expect(await axe(container)).toHaveNoViolations()
  })

  it('puts the arrows before the slides in the document, so Tab reaches them first', () => {
    renderCarousel()

    const next = screen.getByRole('button', { name: 'Next slide' })
    const firstSlide = screen.getAllByRole('group', { name: SLIDE_NAME })[0]
    expect(next.compareDocumentPosition(firstSlide) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('reads slides inside a fragment', () => {
    render(
      <Carousel label="Fragments">
        <>
          <CarouselSlide value="a" label="A">
            <Text>A</Text>
          </CarouselSlide>
          <CarouselSlide value="b" label="B">
            <Text>B</Text>
          </CarouselSlide>
        </>
      </Carousel>
    )

    expect(screen.getByTestId('carousel-position')).toHaveTextContent('1 of 2')
  })

  describe('bad children', () => {
    afterEach(() => vi.restoreAllMocks())

    it('keeps the first of two slides that share a value, and says so', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      render(
        <Carousel label="Duplicates">
          {['a', 'b', 'a', 'c'].map((value, i) => (
            <CarouselSlide key={i} value={value} label={`${value}${String(i)}`}>
              <Text>{`${value}${String(i)}`}</Text>
            </CarouselSlide>
          ))}
        </Carousel>
      )

      expect(screen.getByTestId('carousel-position')).toHaveTextContent('1 of 3')
      expect(screen.queryByText('a2')).toBeNull()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"a"'))
    })

    it('says when it drops a child that is not a slide', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      function LiftSlide() {
        return (
          <CarouselSlide value="x" label="X">
            <Text>X</Text>
          </CarouselSlide>
        )
      }
      render(
        <Carousel label="Wrapped">
          <LiftSlide />
        </Carousel>
      )

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('<LiftSlide>'))
    })
  })

  it('trims a slide label before naming the slide', () => {
    render(
      <Carousel label="Trim">
        <CarouselSlide value="a" label="  Bench press  ">
          <Text>A</Text>
        </CarouselSlide>
        <CarouselSlide value="b" label="   ">
          <Text>B</Text>
        </CarouselSlide>
      </Carousel>
    )

    expect(screen.getByRole('group', { name: '1 of 2: Bench press' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '2 of 2' })).toBeInTheDocument()
  })

  it('has no accessibility violations with several cards', async () => {
    const { container } = renderCarousel()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations with one card', async () => {
    const { container } = renderCarousel(['Bench press'])

    expect(await axe(container)).toHaveNoViolations()
  })
})
