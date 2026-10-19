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
  CircleCheckIcon,
  OctagonXIcon,
  CircleDashedIcon,
  TrendingDownIcon,
  CircleSlashIcon,
  AwardIcon,
  InfoIcon,
  TargetIcon,
  EqualIcon,
  ChevronsDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckMark,
  SearchIcon,
  DatabaseIcon,
  ChartIcon,
  PlayIcon,
  VolumeOffIcon,
} from './icons'
import { TriangleDownIcon, TriangleUpIcon } from './statusIcons'
import { SvgIcon } from './SvgIcon'
import { checkMarkOutline } from './checkMarkGeometry'

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
      CircleCheckIcon,
      OctagonXIcon,
      CircleDashedIcon,
      TriangleUpIcon,
      TriangleDownIcon,
      TrendingDownIcon,
      CircleSlashIcon,
      AwardIcon,
      InfoIcon,
      TargetIcon,
      EqualIcon,
      ChevronsDownIcon,
      ChevronLeftIcon,
      ChevronRightIcon,
      CheckMark,
      SearchIcon,
      DatabaseIcon,
      ChartIcon,
      PlayIcon,
      VolumeOffIcon,
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
    ['VolumeOffIcon', VolumeOffIcon],
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

  it('the check mark is its weighted outline seen through one spine that a dash of 1 draws on, short leg first', () => {
    const { container } = render(<CheckMark size={12} strokeWidth={3} />)
    const [mask, mark] = Array.from(container.querySelectorAll('svg > *'))
    expect(mask.tagName).toBe('mask')
    expect(mark.tagName).toBe('polygon')
    expect(mark.getAttribute('mask')).toBe(`url(#${mask.id})`)
    expect(mark.getAttribute('points')).toBe(
      checkMarkOutline(3)
        .map(([x, y]) => `${String(x)},${String(y)}`)
        .join(' ')
    )
    const spines = mask.querySelectorAll('path')
    expect(spines).toHaveLength(1)
    const [spine] = spines
    expect(spine.getAttribute('pathLength')).toBe('1')
    expect(spine.getAttribute('stroke-linecap')).toBe('butt')
    const d = spine.getAttribute('d')!
    expect(d.match(/[Mm]/g)).toHaveLength(1)
    expect(d).not.toMatch(/[Zz]/)
    expect(d.startsWith('M3.95 12.14 L9.3 17.6')).toBe(true)
  })

  it('every check mark masks with its own id', () => {
    const { container } = render(
      <>
        <CheckMark />
        <CheckMark />
      </>
    )
    const ids = Array.from(container.querySelectorAll('mask')).map((m) => m.id)
    expect(new Set(ids).size).toBe(2)
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
