import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock react-native components for web testing
vi.mock('react-native', async () => {
  const RNW = await vi.importActual('react-native-web')
  return RNW
})
