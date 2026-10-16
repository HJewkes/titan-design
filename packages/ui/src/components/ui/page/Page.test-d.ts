import { createElement } from 'react'
import { test } from 'vitest'
import { Page } from './Page'

test('hasScrollShadow is not a Page prop', () => {
  createElement(Page, {
    isHeaderPinned: true,
    // @ts-expect-error hasScrollShadow is not a Page prop
    hasScrollShadow: true,
    header: null,
  })
})
