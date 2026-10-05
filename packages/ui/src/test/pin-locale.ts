import { vi } from 'vitest'

/**
 * Makes `locale` the default for `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat`, so text
 * that follows the runtime locale reads the same on every machine. An explicit locale still wins.
 * Undo with `vi.unstubAllGlobals()`.
 */
export function pinDefaultLocale(locale: string): void {
  const { DateTimeFormat, RelativeTimeFormat } = Intl
  class PinnedDateTimeFormat extends DateTimeFormat {
    constructor(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
      super(locales ?? locale, options)
    }
  }
  class PinnedRelativeTimeFormat extends RelativeTimeFormat {
    constructor(locales?: Intl.LocalesArgument, options?: Intl.RelativeTimeFormatOptions) {
      super(locales ?? locale, options)
    }
  }
  const pinned = Object.create(Intl, {
    DateTimeFormat: { value: PinnedDateTimeFormat },
    RelativeTimeFormat: { value: PinnedRelativeTimeFormat },
  })
  vi.stubGlobal('Intl', pinned)
}
