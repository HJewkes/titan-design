import { specimenConfig } from './playwright.specimen.base'

export default specimenConfig({
  testDir: './specimen',
  testMatch: '**/*.visual.test.ts',
  use: {
    screenshot: 'only-on-failure',
  },
})
