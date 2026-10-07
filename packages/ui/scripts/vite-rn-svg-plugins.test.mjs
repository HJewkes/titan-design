// @vitest-environment node
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { reactNativeBodyHighlighterEsm } from '../vite-rn-svg-plugins'

const require = createRequire(import.meta.url)

describe('reactNativeBodyHighlighterEsm (TD-729)', () => {
  it('leaves no dynamic require of an external, which throws in a browser build', async () => {
    const entry = require.resolve('react-native-body-highlighter')

    const { code } = await reactNativeBodyHighlighterEsm().transform('', entry)

    expect(code).not.toMatch(/__require\(/)
    expect(code).toMatch(/^import \* as \w+ from "react";?$/m)
  })
})
