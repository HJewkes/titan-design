import { specimenConfig } from './playwright.specimen.base'

export default specimenConfig({
  testDir: './specimen',
  workers: 4,
  testMatch: '**/*.visual.test.ts',
  use: {
    screenshot: 'only-on-failure',
  },
})
