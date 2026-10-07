import { specimenConfig } from './playwright.specimen.base'

/**
 * Token-resolution harness (TD-05.03). Mirrors playwright.comparison.config.ts
 * but targets only `token-resolution.spec.ts`, served by the same specimen dev
 * server.
 */
export default specimenConfig({
  testDir: './specimen',
  testMatch: '**/token-resolution.spec.ts',
})
