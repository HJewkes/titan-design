import type { Dispatch } from 'react'
import type { Annotation } from '../src/schema.ts'
import type { Action } from './state.ts'

interface PinListProps {
  variantKey: string
  pins: Annotation[]
  focusPin: string | null
  dispatch: Dispatch<Action>
}

function describeTarget(pin: Annotation): string {
  const t = pin.target
  if (!t) return 'coordinates only'
  return [t.testId && `#${t.testId}`, t.role, t.text && `"${t.text}"`].filter(Boolean).join(' ')
}

export function PinList({ variantKey, pins, focusPin, dispatch }: PinListProps) {
  if (!pins.length) return null
  return (
    <ol className="pins">
      {pins.map((pin) => (
        <li key={pin.id} data-testid={`pin-${pin.id}`}>
          <span className="pin-label">
            {pin.id.split('-').pop()} · {pin.width}px ({pin.x}, {pin.y}) · {describeTarget(pin)}
          </span>
          <input
            aria-label={`Note for pin ${pin.id}`}
            placeholder="What about this spot?"
            value={pin.note}
            autoFocus={pin.id === focusPin}
            onChange={(e) =>
              dispatch({ type: 'pinNote', key: variantKey, id: pin.id, note: e.target.value })
            }
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => dispatch({ type: 'removePin', key: variantKey, id: pin.id })}
          >
            Remove
          </button>
        </li>
      ))}
    </ol>
  )
}
