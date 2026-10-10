// A module file, so `declare module 'vitest'` merges instead of shadowing vitest.
// The ambient `jest-axe` declaration needs a script file and lives in jest-axe-module.d.ts.
import 'vitest'

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- merged declarations must repeat vitest's own `T = any` default
  interface Assertion<T = any> {
    toHaveNoViolations(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): unknown
  }
}
