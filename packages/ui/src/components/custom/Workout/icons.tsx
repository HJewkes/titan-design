// Workout icons were promoted to the shared icon primitive
// (`components/icons`). This shim re-exports them so existing Workout consumers
// keep their local `./icons` import unchanged.
export { DumbbellIcon, StarIcon } from '../../icons'

/** @deprecated Use `IconProps` from `components/icons`. */
export type { IconProps as WorkoutIconProps } from '../../icons'
