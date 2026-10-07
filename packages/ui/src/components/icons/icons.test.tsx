import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import {
  VoltrasMark,
  BluetoothIcon,
  DumbbellIcon,
  StarIcon,
  ActivityIcon,
  HistoryIcon,
  LayersIcon,
  PersonStandingIcon,
  ScaleIcon,
  AlertTriangleIcon,
  TrendingDownIcon,
  CircleSlashIcon,
  AwardIcon,
  InfoIcon,
  TargetIcon,
  EqualIcon,
  ChevronsDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  DatabaseIcon,
  ChartIcon,
} from './icons'
import { SvgIcon } from './SvgIcon'

describe('icon primitives', () => {
  it('every icon renders an svg', () => {
    ;[
      VoltrasMark,
      BluetoothIcon,
      DumbbellIcon,
      StarIcon,
      ActivityIcon,
      HistoryIcon,
      LayersIcon,
      PersonStandingIcon,
      ScaleIcon,
      AlertTriangleIcon,
      TrendingDownIcon,
      CircleSlashIcon,
      AwardIcon,
      InfoIcon,
      TargetIcon,
      EqualIcon,
      ChevronsDownIcon,
      ChevronLeftIcon,
      ChevronRightIcon,
      SearchIcon,
      DatabaseIcon,
      ChartIcon,
    ].forEach((Icon) => {
      const { container, unmount } = render(<Icon />)
      expect(container.querySelector('svg')).toBeInTheDocument()
      unmount()
    })
  })

  it.each([
    ['SearchIcon', SearchIcon],
    ['DatabaseIcon', DatabaseIcon],
    ['ChartIcon', ChartIcon],
  ])('%s renders its glyph at the requested size', (_name, Icon) => {
    const { container } = render(<Icon size={16} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('16')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.querySelectorAll('path, circle, ellipse').length).toBeGreaterThan(1)
  })

  it('the console glyphs have no accessibility violations', async () => {
    const { container } = render(
      <>
        <SearchIcon title="Search" />
        <DatabaseIcon />
        <ChartIcon />
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a titled icon is exposed as an accessible image', () => {
    render(<BluetoothIcon title="Devices" />)
    expect(screen.getByRole('img', { name: 'Devices' })).toBeInTheDocument()
  })

  it('an untitled icon is decorative (aria-hidden, no role)', () => {
    const { container } = render(<VoltrasMark />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('role')).toBeNull()
  })

  it('honors size + strokeWidth via the SvgIcon base', () => {
    const { container } = render(
      <SvgIcon size={32} strokeWidth={3}>
        <path d="M0 0" />
      </SvgIcon>
    )
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('32')
    expect(svg.getAttribute('stroke-width')).toBe('3')
  })

  it('a decorative icon has no accessibility violations', async () => {
    const { container } = render(<StarIcon />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
