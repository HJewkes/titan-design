// Subpath entry: @titan-design/react-ui/workout
//
// The Workout domain family (`custom/Workout`) and the workout-app chrome that
// exists only to compose it (`shell/workout`). Moved out of the root barrel by
// decision 323a: together they were about a third of the root bundle, and the
// placement table already treats a domain family as its own tier. BodyMap and
// the page organisms stay on `/bodymap` and `/pages`; the type-only re-exports
// for those moved here with the rest of the family barrel.
export * from './components/custom/Workout'
export * from './components/shell/workout'
