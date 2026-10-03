import { useCallback, useEffect, useRef, useState } from 'react'

export interface ControllableStateOptions<T> {
  /** Controlled value; `undefined` means uncontrolled. */
  value: T | undefined
  defaultValue: T
  onChange?: (next: T) => void
}

/** State a parent may own (`value`) or leave to the component (`defaultValue`). */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue)
  const current = value === undefined ? internal : value
  const currentRef = useRef(current)
  useEffect(() => {
    currentRef.current = current
  }, [current])
  const isControlled = value !== undefined

  const setValue = useCallback(
    (next: T) => {
      if (Object.is(next, currentRef.current)) return
      if (!isControlled) {
        currentRef.current = next
        setInternal(next)
      }
      onChange?.(next)
    },
    [isControlled, onChange]
  )

  return [current, setValue]
}
