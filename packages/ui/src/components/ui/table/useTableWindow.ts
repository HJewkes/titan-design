import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { missingRanges, windowSlice, type RowRange, type TableFilters } from './table-model'
import type { TableSort } from './table-state-types'

/** How long the window must stay put before `onRangeNeeded` asks for its unloaded blocks. */
export const RANGE_DEBOUNCE_MS = 150

const EMPTY_RANGE: RowRange = { start: 0, end: 0 }

const toRowCount = (count: number | undefined): number =>
  count !== undefined && Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0

const sameRange = (a: RowRange, b: RowRange): boolean => a.start === b.start && a.end === b.end

/** Page, page size and window, which every filter or sort change sends back to the top. */
export function useViewState(defaultPageSize: number) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSizeState] = useState(defaultPageSize)
  const [windowRange, setWindowRangeState] = useState<RowRange>(EMPTY_RANGE)
  // Bumped to forget which blocks `onRangeNeeded` already asked for.
  const [requestEpoch, setRequestEpoch] = useState(0)

  const setPageSize = (size: number) => {
    setPageSizeState(size)
    setPage(0)
  }
  const setWindowRange = useCallback((next: RowRange) => {
    setWindowRangeState((current) => (sameRange(current, next) ? current : next))
  }, [])
  const clearRequestedRanges = useCallback(() => setRequestEpoch((epoch) => epoch + 1), [])
  const restart = () => {
    setPage(0)
    setWindowRangeState((range) => ({ start: 0, end: range.end - range.start }))
    clearRequestedRanges()
  }
  const view = { page, setPage, pageSize, setPageSize, windowRange, setWindowRange }
  return { ...view, requestEpoch, clearRequestedRanges, restart }
}

// By content, so a parent passing an equal controlled object each render does not reset the page.
const viewKey = (filters: TableFilters, sort: TableSort): string =>
  JSON.stringify([
    Object.keys(filters)
      .sort()
      .map((field) => [field, filters[field]]),
    sort.column ?? null,
    sort.direction,
  ])

/** Calls `restart` on the render where the filters or sort first differ by content from the last seen. */
export function useRestartOnChange(filters: TableFilters, sort: TableSort, restart: () => void) {
  const key = viewKey(filters, sort)
  const [seen, setSeen] = useState(key)
  if (seen !== key) {
    setSeen(key)
    restart()
  }
}

export type ViewState = Omit<ReturnType<typeof useViewState>, 'restart'>

interface RangeRequestInput<T> {
  isEnabled: boolean
  windowRange: RowRange
  rowCount: number
  getRow?: (index: number) => T | undefined
  onRangeNeeded?: (range: RowRange) => void
  requestEpoch: number
}

/** Asks once per unloaded block of the window, after the window has held still for the debounce. */
export function useRangeRequests<T>(input: RangeRequestInput<T>) {
  const { isEnabled, windowRange, rowCount, getRow, onRangeNeeded, requestEpoch } = input
  const latest = useRef({ getRow, onRangeNeeded })
  const requested = useRef({ epoch: requestEpoch, starts: new Set<number>() })
  useEffect(() => {
    latest.current = { getRow, onRangeNeeded }
  })
  const { start, end } = windowRange
  useEffect(() => {
    if (!isEnabled) return
    const timer = setTimeout(() => {
      if (requested.current.epoch !== requestEpoch) {
        requested.current = { epoch: requestEpoch, starts: new Set() }
      }
      const { starts } = requested.current
      const isLoaded = (index: number) => latest.current.getRow?.(index) !== undefined
      for (const block of missingRanges({ start, end }, rowCount, isLoaded)) {
        if (starts.has(block.start)) continue
        starts.add(block.start)
        latest.current.onRangeNeeded?.(block)
      }
    }, RANGE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [isEnabled, start, end, rowCount, requestEpoch])
}

interface RowAccessInput<T> {
  isManual: boolean
  sortedData: T[]
  rowCount?: number
  getRow?: (index: number) => T | undefined
  windowRange: RowRange
}

/** The pipeline's last stage for a windowed body: `windowSlice` over the sorted rows or `getRow`. */
export function useRowAccess<T>({
  isManual,
  sortedData,
  rowCount,
  getRow,
  windowRange,
}: RowAccessInput<T>) {
  const visibleRowCount = isManual ? toRowCount(rowCount) : sortedData.length
  const rowAt = useCallback(
    (index: number) => (isManual ? getRow?.(index) : sortedData[index]),
    [isManual, getRow, sortedData]
  )
  const windowRows = useMemo(
    () => windowSlice(rowAt, windowRange, visibleRowCount),
    [rowAt, windowRange, visibleRowCount]
  )
  return { visibleRowCount, rowAt, windowRows }
}
