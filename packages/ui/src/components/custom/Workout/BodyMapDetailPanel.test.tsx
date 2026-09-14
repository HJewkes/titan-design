import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { View } from 'react-native'
import { axe } from 'jest-axe'
import {
  BodyMapDetailPanel,
  type BodyMapDetailPanelProps,
  type ContributingExercise,
  type UpcomingExercise,
} from './BodyMapDetailPanel'
import { MuscleGroup } from './muscleTaxonomy'
import { resolveAll } from '../../../test/spacing-resolver'
import { space } from '../../../theme/tokens/semantic'

const contributing: ContributingExercise[] = [
  { name: 'Barbell Bench Press', sets: 4, contributionWeight: 1 },
  { name: 'Cable Fly', sets: 3, contributionWeight: 0.75 },
]

const upcoming: UpcomingExercise[] = [{ name: 'Dips', workoutName: 'Push B', sets: 3 }]

const baseProps = {
  muscleGroup: MuscleGroup.CHEST,
  displayName: 'Chest',
  weeklySets: 14,
  landmarks: { mev: 8, mav: 14, mrv: 20 },
  volumeStatus: 'target' as const,
  lastTrained: '2 days ago',
  weeklyHistory: [8, 10, 12, 14],
  contributingExercises: contributing,
  upcomingExercises: upcoming,
  isOpen: true,
  onClose: vi.fn(),
}

const styleOf = (testId: string) => screen.getByTestId(testId).getAttribute('style') ?? ''

/** An opener button plus a figure the sheet must never displace. */
function DrillHarness(props: Partial<BodyMapDetailPanelProps>) {
  const [open, setOpen] = useState(false)
  return (
    <View style={{ position: 'relative', flexDirection: 'row' }}>
      <View style={{ width: 480, height: 960 }} testID="figure" />
      <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
        Open
      </button>
      <BodyMapDetailPanel {...baseProps} {...props} isOpen={open} onClose={() => setOpen(false)} />
    </View>
  )
}

describe('BodyMapDetailPanel', () => {
  describe('rendering', () => {
    it('renders the panel with the muscle title when open', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-detail-panel-title')).toHaveTextContent('Chest')
    })

    it('does not render when closed', () => {
      render(<BodyMapDetailPanel {...baseProps} isOpen={false} />)
      expect(screen.queryByTestId('body-map-detail-panel')).not.toBeInTheDocument()
    })

    it('supports the `visible` alias for visibility', () => {
      const { isOpen: _isOpen, ...rest } = baseProps
      render(<BodyMapDetailPanel {...rest} visible />)
      expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
    })

    it('renders the drag handle, status badge, and last-trained line', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-handle')).toBeInTheDocument()
      expect(screen.getByTestId('body-map-detail-panel-status-badge')).toHaveTextContent(
        'target met'
      )
      expect(screen.getByTestId('body-map-detail-panel-last-trained')).toHaveTextContent(
        'Last trained 2 days ago'
      )
    })

    it('shows the weekly set count and MRV suffix', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-set-count')).toHaveTextContent('14')
      expect(screen.getByTestId('body-map-detail-panel-mrv-suffix')).toHaveTextContent('/ 20 MRV')
    })
  })

  describe('volume bar', () => {
    it('positions the marker at the midpoint when sets sit between MEV and MRV', () => {
      // mev 8, mrv 20, sets 14 -> (14-8)/(20-8) = 0.5
      render(<BodyMapDetailPanel {...baseProps} />)
      const marker = screen.getByTestId('body-map-detail-panel-volume-marker')
      expect(marker.getAttribute('style') ?? '').toContain('left: 50%')
    })

    it('clamps the marker to the left edge below MEV', () => {
      render(<BodyMapDetailPanel {...baseProps} weeklySets={2} />)
      const marker = screen.getByTestId('body-map-detail-panel-volume-marker')
      expect(marker.getAttribute('style') ?? '').toContain('left: 0%')
    })

    it('clamps the marker to the right edge at or above MRV', () => {
      render(<BodyMapDetailPanel {...baseProps} weeklySets={24} />)
      const marker = screen.getByTestId('body-map-detail-panel-volume-marker')
      expect(marker.getAttribute('style') ?? '').toContain('left: 100%')
    })

    it('exposes the volume bar as a progressbar reflecting sets and landmarks', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      const bar = screen.getByTestId('body-map-detail-panel-volume-bar')
      expect(bar).toHaveAttribute('aria-valuenow', '14')
      expect(bar).toHaveAttribute('aria-valuemin', '8')
      expect(bar).toHaveAttribute('aria-valuemax', '20')
    })
  })

  describe('lists', () => {
    it('renders contributing exercises with sets and contribution', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-contributing-0-name')).toHaveTextContent(
        'Barbell Bench Press'
      )
      expect(screen.getByTestId('body-map-detail-panel-contributing-0-detail')).toHaveTextContent(
        '4 sets · 100%'
      )
      expect(screen.getByTestId('body-map-detail-panel-contributing-1-detail')).toHaveTextContent(
        '3 sets · 75%'
      )
    })

    it('renders upcoming exercises with workout name and sets', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-upcoming-0-name')).toHaveTextContent('Dips')
      expect(screen.getByTestId('body-map-detail-panel-upcoming-0-detail')).toHaveTextContent(
        'Push B · 3 sets'
      )
    })

    it('renders the volume sparkline when history is supplied', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getByTestId('body-map-detail-panel-sparkline')).toBeInTheDocument()
    })

    it('does not crash and omits sections for empty optional arrays', () => {
      render(
        <BodyMapDetailPanel
          {...baseProps}
          contributingExercises={[]}
          upcomingExercises={[]}
          weeklyHistory={[]}
        />
      )
      expect(screen.getByTestId('body-map-detail-panel')).toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-contributing')).not.toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-upcoming')).not.toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-sparkline')).not.toBeInTheDocument()
    })

    it('omits the last-trained line and view-exercises button when not provided', () => {
      const { lastTrained: _lt, ...rest } = baseProps
      render(<BodyMapDetailPanel {...rest} />)
      expect(screen.queryByTestId('body-map-detail-panel-last-trained')).not.toBeInTheDocument()
      expect(screen.queryByTestId('body-map-detail-panel-view-exercises')).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onClose when the backdrop is pressed', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-backdrop'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when the handle is pressed', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-handle'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose when the close button is pressed', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-close'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onViewExercises when the view button is pressed', () => {
      const onViewExercises = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onViewExercises={onViewExercises} />)
      fireEvent.click(screen.getByTestId('body-map-detail-panel-view-exercises'))
      expect(onViewExercises).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('exposes a dialog role labelled with the muscle', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-label', 'Chest volume details')
    })

    it('labels the close affordances', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(screen.getAllByLabelText('Close Chest details').length).toBeGreaterThan(0)
    })

    it('has no accessibility violations with full content', async () => {
      const { container } = render(<BodyMapDetailPanel {...baseProps} onViewExercises={vi.fn()} />)
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations for each volume status', async () => {
      const statuses = ['untrained', 'behind', 'ontrack', 'target', 'approaching', 'over'] as const
      for (const volumeStatus of statuses) {
        const { container, unmount } = render(
          <BodyMapDetailPanel {...baseProps} volumeStatus={volumeStatus} />
        )
        expect(await axe(container)).toHaveNoViolations()
        unmount()
      }
    })

    it('has no accessibility violations as a right side-sheet', async () => {
      const { container } = render(
        <BodyMapDetailPanel {...baseProps} placement="right" onViewExercises={vi.fn()} />
      )
      expect(await axe(container)).toHaveNoViolations()
    })

    it('has no accessibility violations with only required props', async () => {
      const { container } = render(
        <BodyMapDetailPanel
          muscleGroup={MuscleGroup.CALVES}
          displayName="Calves"
          weeklySets={10}
          landmarks={{ mev: 6, mav: 10, mrv: 16 }}
          volumeStatus="ontrack"
          isOpen
          onClose={vi.fn()}
        />
      )
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('placement', () => {
    it('defaults to the bottom sheet', () => {
      render(<BodyMapDetailPanel {...baseProps} />)
      expect(styleOf('body-map-detail-panel-root')).not.toContain('flex-direction: row')
      expect(styleOf('body-map-detail-panel')).toContain('border-top-right-radius: 16px')
    })

    it('renders the sheet in the right slot when placement is right', () => {
      render(<BodyMapDetailPanel {...baseProps} placement="right" />)
      const root = styleOf('body-map-detail-panel-root')
      expect(root).toContain('flex-direction: row')
      expect(root).toContain('justify-content: flex-end')
      const sheet = styleOf('body-map-detail-panel')
      expect(sheet).toContain('border-bottom-left-radius: 16px')
      expect(sheet).toContain('height: 100%')
      expect(sheet).toContain('width: 34%')
    })

    it('drops the drag handle in the right side-sheet', () => {
      render(<BodyMapDetailPanel {...baseProps} placement="right" />)
      expect(screen.queryByTestId('body-map-detail-panel-handle')).not.toBeInTheDocument()
      expect(screen.getByTestId('body-map-detail-panel-close')).toBeInTheDocument()
    })

    it('overlays the figure without moving it', () => {
      render(<DrillHarness placement="right" />)
      const closedFigureStyle = screen.getByTestId('figure').getAttribute('style')
      fireEvent.click(screen.getByTestId('opener'))
      expect(screen.getByTestId('figure').getAttribute('style')).toBe(closedFigureStyle)
      expect(styleOf('body-map-detail-panel-root')).toContain('position: absolute')
    })

    it('paints the volume track from the shared surfaceGradient primitive', () => {
      render(<BodyMapDetailPanel {...baseProps} placement="right" />)
      const track = screen.getByTestId('body-map-detail-panel-volume-bar').firstElementChild
      expect(track?.getAttribute('style')).toContain(
        'linear-gradient(90deg, var(--color-status-info), var(--color-status-success), var(--color-status-error))'
      )
    })
  })

  describe('keyboard', () => {
    it('closes on Escape', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} placement="right" onClose={onClose} />)
      fireEvent.keyDown(screen.getByTestId('body-map-detail-panel'), { key: 'Escape' })
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('closes on Escape in the bottom sheet too', () => {
      const onClose = vi.fn()
      render(<BodyMapDetailPanel {...baseProps} onClose={onClose} />)
      fireEvent.keyDown(screen.getByTestId('body-map-detail-panel'), { key: 'Escape' })
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('moves focus into the sheet on open and back to the opener on close', () => {
      render(<DrillHarness placement="right" />)
      const opener = screen.getByTestId('opener')
      act(() => opener.focus())
      fireEvent.click(opener)
      expect(screen.getByTestId('body-map-detail-panel')).toHaveFocus()
      fireEvent.keyDown(screen.getByTestId('body-map-detail-panel'), { key: 'Escape' })
      expect(opener).toHaveFocus()
    })

    it('wraps Tab from the last tabbable back to the first', () => {
      render(<BodyMapDetailPanel {...baseProps} placement="right" onViewExercises={vi.fn()} />)
      const sheet = screen.getByTestId('body-map-detail-panel')
      const close = screen.getByTestId('body-map-detail-panel-close')
      const viewExercises = screen.getByTestId('body-map-detail-panel-view-exercises')
      act(() => viewExercises.focus())
      fireEvent.keyDown(sheet, { key: 'Tab' })
      expect(close).toHaveFocus()
    })

    it('wraps Shift+Tab from the first tabbable back to the last', () => {
      render(<BodyMapDetailPanel {...baseProps} placement="right" onViewExercises={vi.fn()} />)
      const sheet = screen.getByTestId('body-map-detail-panel')
      const close = screen.getByTestId('body-map-detail-panel-close')
      const viewExercises = screen.getByTestId('body-map-detail-panel-view-exercises')
      act(() => close.focus())
      fireEvent.keyDown(sheet, { key: 'Tab', shiftKey: true })
      expect(viewExercises).toHaveFocus()
    })

    it('leaves interior Tab steps to the browser', () => {
      render(<BodyMapDetailPanel {...baseProps} placement="right" onViewExercises={vi.fn()} />)
      const sheet = screen.getByTestId('body-map-detail-panel')
      const close = screen.getByTestId('body-map-detail-panel-close')
      act(() => close.focus())
      const handled = fireEvent.keyDown(sheet, { key: 'Tab' })
      expect(handled).toBe(true)
      expect(close).toHaveFocus()
    })

    it('never traps focus onto the backdrop, which sits outside the sheet', () => {
      render(<BodyMapDetailPanel {...baseProps} placement="right" onViewExercises={vi.fn()} />)
      const sheet = screen.getByTestId('body-map-detail-panel')
      expect(sheet).not.toContainElement(screen.getByTestId('body-map-detail-panel-backdrop'))
    })
  })

  /**
   * The inline spacing migrated to classes (AW-142 wave three). `className` never
   * reaches the DOM here — NativeWind is stubbed — so the geometry is pinned by
   * resolving each class the way Tailwind does. Every row is the pixel the style
   * object used to carry, so a wrong key or a typo fails rather than silently
   * rendering nothing.
   */
  describe('spacing tokens', () => {
    it.each([
      ['drag handle', ['py-control-y-md'], ['8px']],
      ['scroll body', ['px-inset-lg', 'pt-inset-md'], ['16px', '12px']],
      ['header row', ['gap-inline-md', 'py-1'], ['8px', '4px']],
      ['close button pad and bleed', ['p-1', 'm-1'], ['4px', '4px']],
      ['section tops', ['mt-stack-lg', 'mt-3.5'], ['16px', '14px']],
      ['label bottoms', ['mb-1.5', 'mb-stack-md'], ['6px', '8px']],
      ['set-count row', ['gap-inline-sm'], ['4px']],
      ['contributing row', ['gap-2.5', 'px-inset-md', 'py-2'], ['10px', '12px', '8px']],
      ['upcoming row', ['gap-2.5', 'py-1.5'], ['10px', '6px']],
      ['view-exercises button', ['py-control-y-lg'], ['10px']],
    ] as const)('%s resolves to %s', (_label, classes, pixels) => {
      expect(resolveAll([...classes])).toEqual([...pixels])
    })

    it('pads the scroll content from the inset ramp', () => {
      // The one value that moved: 20 was off the ramp, inset-xl is 24.
      expect(space.inset.xl).toBe(24)
    })
  })
})
