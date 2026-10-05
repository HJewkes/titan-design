import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { renderToString } from 'react-dom/server'
import { Platform, Text } from 'react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { capturedByNode } from '../../../test/classname-capture'
import { CodeViewer } from './CodeViewer'
import {
  empty,
  fixedWindowOneLine,
  fixedWindowWholeFile,
  scale5k,
  tooltipLongFunction,
  type SourceExcerpt,
} from './fixtures'
import type { CodeViewerProps } from './types'

const numbered = (count: number) =>
  Array.from({ length: count }, (_, i) => `line ${i + 1}`).join('\n')

function renderExcerpt(excerpt: SourceExcerpt, props: Partial<CodeViewerProps> = {}) {
  return render(
    <CodeViewer
      accessibilityLabel={`${excerpt.path}, from line ${excerpt.startLine}`}
      text={excerpt.text}
      startLine={excerpt.startLine}
      highlights={excerpt.highlights}
      isTruncated={excerpt.truncated}
      {...props}
    />
  )
}

const codeRows = () => screen.queryAllByTestId('code-line')
const listbox = () => screen.getByRole('listbox', { name: 'Select lines' })
const option = (line: number) =>
  screen.getByRole('option', { name: new RegExp(`^Line ${line}\\b`) })
const selectedLines = () =>
  screen
    .getAllByRole('option')
    .filter((node) => node.getAttribute('aria-selected') === 'true')
    .map((node) => Number(node.textContent))
const press = (key: string, shiftKey = false) => fireEvent.keyDown(listbox(), { key, shiftKey })

describe('CodeViewer', () => {
  it('numbers the gutter from startLine, not from 1', () => {
    renderExcerpt(fixedWindowOneLine)
    const numbers = screen.getAllByTestId('code-line-number').map((node) => node.textContent)
    expect(numbers).toEqual(['22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'])
    expect(codeRows()[5].textContent).toBe(fixedWindowOneLine.text.split('\n')[5])
  })

  it('states the flagged ranges in visible text, and says nothing without highlights', () => {
    const { unmount } = renderExcerpt(tooltipLongFunction)
    expect(screen.getByText('Flagged: lines 83 to 157')).toBeVisible()
    expect(option(83)).toHaveAccessibleName('Line 83, flagged')
    expect(option(82)).toHaveAccessibleName('Line 82')
    unmount()
    renderExcerpt(fixedWindowWholeFile)
    expect(screen.queryByText(/^Flagged:/)).toBeNull()
  })

  it('renders a bounded row count for 5,000 lines', () => {
    renderExcerpt(scale5k)
    expect(codeRows().length).toBeGreaterThan(20)
    expect(codeRows().length).toBeLessThan(60)
    expect(screen.getAllByRole('option').length).toBeLessThan(60)
  })

  it('windows above 500 lines only, and never when wrapping', () => {
    const view = (text: string, wrap = false) =>
      render(<CodeViewer accessibilityLabel="Source" text={text} wrap={wrap} />)
    const atThreshold = view(numbered(500))
    expect(codeRows()).toHaveLength(500)
    atThreshold.unmount()
    const above = view(numbered(501))
    expect(codeRows().length).toBeLessThan(60)
    above.unmount()
    view(numbered(501), true)
    expect(codeRows()).toHaveLength(501)
  })

  it('renders the focus line in the first window without selecting it', () => {
    renderExcerpt(scale5k, { focusLine: 4900 })
    expect(option(4900)).toBeInTheDocument()
    expect(codeRows().map((row) => row.textContent)).toContain(scale5k.text.split('\n')[4899])
    expect(screen.queryByRole('option', { name: 'Line 2' })).toBeNull()
    expect(codeRows().length).toBeLessThan(60)
    expect(selectedLines()).toEqual([])
  })

  it('windows on the focus line in the very first render, before any effect scrolls', () => {
    const html = renderToString(
      <CodeViewer accessibilityLabel="Source" text={scale5k.text} focusLine={4900} />
    )
    expect(html).toContain('aria-label="Line 4900"')
    expect(html).not.toContain('aria-label="Line 2"')
  })

  it('exposes the gutter as a multi-select listbox with true counts', () => {
    renderExcerpt(fixedWindowOneLine, { defaultSelectedRange: { startLine: 24, endLine: 25 } })
    expect(listbox()).toHaveAttribute('aria-multiselectable', 'true')
    expect(listbox()).toHaveAttribute('tabindex', '0')
    expect(option(24)).toHaveAttribute('aria-selected', 'true')
    expect(option(26)).toHaveAttribute('aria-selected', 'false')
    expect(option(24)).toHaveAttribute('aria-setsize', '11')
    expect(option(24)).toHaveAttribute('aria-posinset', '3')
    expect(listbox()).toHaveAttribute('aria-activedescendant', option(24).id)
    expect(option(27)).toHaveAccessibleName('Line 27, flagged')
  })

  it('keeps the active option mounted when it is outside the window', () => {
    renderExcerpt(scale5k, { defaultSelectedRange: { startLine: 4000, endLine: 4000 } })
    const active = option(4000)
    expect(screen.queryByRole('option', { name: 'Line 3999' })).toBeNull()
    expect(listbox()).toHaveAttribute('aria-activedescendant', active.id)
    expect(active).toHaveAttribute('aria-posinset', '4000')
    expect(active).toHaveAttribute('aria-setsize', '5000')
    expect(codeRows().length).toBeLessThan(60)
  })

  it('moves, extends, toggles and clears the selection from the keyboard', () => {
    const onSelectedRangeChange = vi.fn()
    renderExcerpt(fixedWindowOneLine, { onSelectedRangeChange })
    press('ArrowDown')
    press('ArrowDown')
    expect(listbox()).toHaveAttribute('aria-activedescendant', option(24).id)
    expect(onSelectedRangeChange).not.toHaveBeenCalled()
    press(' ')
    expect(selectedLines()).toEqual([24])
    press('ArrowDown', true)
    press('ArrowDown', true)
    expect(selectedLines()).toEqual([24, 25, 26])
    press('ArrowUp', true)
    expect(selectedLines()).toEqual([24, 25])
    expect(onSelectedRangeChange).toHaveBeenLastCalledWith({ startLine: 24, endLine: 25 })
    press('ArrowUp')
    expect(listbox()).toHaveAttribute('aria-activedescendant', option(24).id)
    press('End')
    expect(listbox()).toHaveAttribute('aria-activedescendant', option(32).id)
    press('Home')
    expect(listbox()).toHaveAttribute('aria-activedescendant', option(22).id)
    expect(selectedLines()).toEqual([24, 25])
    press('Escape')
    expect(selectedLines()).toEqual([])
    expect(onSelectedRangeChange).toHaveBeenLastCalledWith(null)
  })

  it('handles only its own keys', () => {
    renderExcerpt(fixedWindowOneLine)
    expect(press('ArrowDown')).toBe(false)
    expect(press('a')).toBe(true)
    expect(press('Tab')).toBe(true)
  })

  it('selects a pressed line and extends to a Shift-pressed one', () => {
    renderExcerpt(fixedWindowOneLine)
    fireEvent.click(option(25))
    expect(selectedLines()).toEqual([25])
    expect(listbox()).toHaveAttribute('aria-activedescendant', option(25).id)
    fireEvent.click(option(28), { shiftKey: true })
    expect(selectedLines()).toEqual([25, 26, 27, 28])
    fireEvent.click(option(30))
    fireEvent.click(option(30))
    expect(selectedLines()).toEqual([])
  })

  it('scrolls the window to the active line when it leaves the view', () => {
    renderExcerpt(scale5k)
    press('End')
    expect(codeRows().length).toBeLessThan(60)
    expect(codeRows().slice(-1)[0]).toHaveTextContent(scale5k.text.split('\n')[4999].trim())
    expect(screen.getByRole('option', { name: 'Line 5000' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Line 1' })).toBeNull()
  })

  it('brings the active line back into view on Home even when it is already active', () => {
    renderExcerpt(scale5k, { focusLine: 4900 })
    expect(screen.queryByRole('option', { name: 'Line 2' })).toBeNull()
    press('Home')
    expect(screen.getByRole('option', { name: 'Line 2' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Line 4900' })).toBeNull()
  })

  it('follows a controlled selection and only reports requests', () => {
    const onSelectedRangeChange = vi.fn()
    renderExcerpt(fixedWindowOneLine, {
      selectedRange: { startLine: 26, endLine: 27 },
      onSelectedRangeChange,
    })
    press('Escape')
    expect(onSelectedRangeChange).toHaveBeenCalledWith(null)
    expect(selectedLines()).toEqual([26, 27])
  })

  it('takes a disabled listbox out of the tab order and ignores keys and presses', () => {
    const onSelectedRangeChange = vi.fn()
    renderExcerpt(fixedWindowOneLine, {
      isDisabled: true,
      defaultSelectedRange: { startLine: 23, endLine: 24 },
      onSelectedRangeChange,
    })
    expect(listbox()).toHaveAttribute('aria-disabled', 'true')
    expect(listbox()).not.toHaveAttribute('tabindex')
    expect(press('ArrowDown')).toBe(true)
    press(' ')
    press('Escape')
    fireEvent.click(option(30))
    expect(selectedLines()).toEqual([23, 24])
    expect(onSelectedRangeChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('code-viewer-code')).toHaveAttribute('tabindex', '0')
  })

  it('shows skeleton rows and reports busy while loading, keeping the header', () => {
    renderExcerpt(tooltipLongFunction, { isLoading: true, header: <Text>Tooltip.tsx</Text> })
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByTestId('code-viewer-skeleton')).toHaveLength(8)
    expect(screen.getByText('Tooltip.tsx')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(codeRows()).toHaveLength(0)
    expect(screen.queryByText(/^Flagged:/)).toBeNull()
    expect(screen.queryByText('Excerpt truncated')).toBeNull()
  })

  it('takes the skeleton row count from loadingLineCount and is not busy once loaded', () => {
    const { unmount } = renderExcerpt(tooltipLongFunction, { isLoading: true, loadingLineCount: 3 })
    expect(screen.getAllByTestId('code-viewer-skeleton')).toHaveLength(3)
    unmount()
    renderExcerpt(tooltipLongFunction)
    expect(screen.getByRole('region')).not.toHaveAttribute('aria-busy')
  })

  it('shows the default empty state for an empty text, and the header with it', () => {
    renderExcerpt(empty, { header: <Text>missing.ts</Text> })
    expect(screen.getByText('No source to show')).toBeInTheDocument()
    expect(screen.getByText('missing.ts')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('renders emptyState in place of the default, and treats a lone BOM as empty', () => {
    render(
      <CodeViewer
        accessibilityLabel="Source"
        text={'﻿'}
        emptyState={<Text>Changed since the snapshot</Text>}
      />
    )
    expect(screen.getByText('Changed since the snapshot')).toBeInTheDocument()
    expect(screen.queryByText('No source to show')).toBeNull()
  })

  it('hides line numbers from assistive technology and from text selection', () => {
    renderExcerpt(fixedWindowOneLine)
    const number = within(option(27)).getByText('27')
    expect(number).toHaveAttribute('aria-hidden', 'true')
    expect(capturedByNode.get(number)?.split(/\s+/)).toContain('select-none')
    const code = within(codeRows()[0]).getByText(/\S/)
    expect(capturedByNode.get(code)?.split(/\s+/)).not.toContain('select-none')
  })

  it('drops the gutter when line numbers are off', () => {
    renderExcerpt(fixedWindowOneLine, { showLineNumbers: false })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(codeRows()).toHaveLength(11)
  })

  it('names the region and shows the truncation notice unless a footer replaces it', () => {
    const { unmount } = renderExcerpt(tooltipLongFunction)
    expect(screen.getByRole('region', { name: /Tooltip\.tsx, from line 78$/ })).toBeInTheDocument()
    expect(screen.getByText('Excerpt truncated')).toBeInTheDocument()
    unmount()
    renderExcerpt(tooltipLongFunction, { footer: <Text>80 of 171 lines</Text> })
    expect(screen.getByText('80 of 171 lines')).toBeInTheDocument()
    expect(screen.queryByText('Excerpt truncated')).toBeNull()
  })

  it('keeps tab characters in the web text so a copy is faithful', () => {
    render(<CodeViewer accessibilityLabel="Source" text={'\tindented'} />)
    expect(codeRows()[0].textContent).toBe('\tindented')
  })

  it('does not forward the reserved language prop to the frame', () => {
    render(<CodeViewer accessibilityLabel="Source" text="export {}" language="ts" />)
    expect(screen.getByRole('region')).not.toHaveAttribute('language')
  })

  describe('accessibility', () => {
    const cases: Array<[string, SourceExcerpt, Partial<CodeViewerProps>]> = [
      ['Default', tooltipLongFunction, { header: <Text>Tooltip.tsx</Text> }],
      ['empty', empty, {}],
      ['loading', tooltipLongFunction, { isLoading: true }],
      ['disabled', fixedWindowOneLine, { isDisabled: true }],
      ['5,000 lines', scale5k, { defaultSelectedRange: { startLine: 4000, endLine: 4001 } }],
    ]
    it.each(cases)('has no axe violations: %s', async (_name, excerpt, props) => {
      const { container } = renderExcerpt(excerpt, props)
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('on native', () => {
    afterEach(() => {
      Platform.OS = 'web'
    })

    it('renders per-line buttons instead of a listbox, with tabs expanded', () => {
      Platform.OS = 'ios'
      render(<CodeViewer accessibilityLabel="Source" text={'\tindented\nb'} startLine={7} />)
      expect(screen.queryByRole('listbox')).toBeNull()
      expect(screen.queryByRole('option')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Line 8' }))
      expect(screen.getAllByRole('button')).toHaveLength(2)
      expect(codeRows()[0].textContent).toBe('    indented')
    })
  })
})
