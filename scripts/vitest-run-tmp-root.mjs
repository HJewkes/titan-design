import { createRunTmpRoot } from './test-tmp-root.mjs'

// Vitest global setup: the teardown runs on pass and fail; the exit hook also covers process.exit.
// A SIGKILL still leaks the root.
export default function setup() {
  return createRunTmpRoot().remove
}
