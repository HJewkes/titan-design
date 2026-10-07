/**
 * The repo's controlled-state prop triple: `value` for a parent that owns the state,
 * `defaultValue` for one that leaves it to the component, `onValueChange` for both.
 */
export interface ControlledProps<T> {
  /** Controlled value; leave `undefined` to let the component own the state. */
  value?: T
  /** Initial value when uncontrolled. */
  defaultValue?: T
  /** Fires with the next value on every user-driven change. */
  onValueChange?: (value: T) => void
}
