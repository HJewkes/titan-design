import { createRunTmpRoot } from './test-tmp-root.mjs'

// Vitest global setup: the returned teardown runs on pass and on fail; the exit hook covers a kill.
export default function setup() {
  return createRunTmpRoot().remove
}
