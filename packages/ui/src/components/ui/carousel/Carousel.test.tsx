import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text, View } from 'react-native'

import { Carousel, CarouselSlide, type CarouselProps } from './Carousel'

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

    expect(screen.getAllByRole('group')).toHaveLength(3)
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

  it('moves one slide per arrow press and stops at the ends', () => {
    const onValueChange = vi.fn()
    renderCarousel(LIFTS, { onValueChange })
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

  it('has no accessibility violations with several cards', async () => {
    const { container } = renderCarousel()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations with one card', async () => {
    const { container } = renderCarousel(['Bench press'])

    expect(await axe(container)).toHaveNoViolations()
  })
})
