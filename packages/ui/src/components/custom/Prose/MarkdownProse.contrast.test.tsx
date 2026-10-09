import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownProse, type ProseLinker } from './MarkdownProse'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { contrast } from '../../../theme/color-checks'

// NativeWind classes are compiled away on web; surface the class list so the colour token can be read back.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const { createElement } = await import('react')
  const Text = ({ className, testID, children }: Record<string, unknown>) =>
    createElement('span', { 'data-cn': className, 'data-testid': testID }, children as never)
  return { ...actual, Text }
})

const taskLinker: ProseLinker = { id: 'task', pattern: /\b[A-Z]{2,}-\d+\b/, tone: 'brand' }
const wikiLinker: ProseLinker = {
  id: 'wiki',
  pattern: /\[\[[^\]]+\]\]/,
  tone: 'link',
  label: (ref) => ref.slice(2, -2),
}

describe('MarkdownProse colour roles clear AA on every plane', () => {
  const PLANES = [
    'surface-base',
    'surface-raised',
    'surface-elevated',
    'surface-overlay',
    'background-base',
    'background-default',
    'background-subtle',
  ] as const
  const mutedLinker: ProseLinker = { id: 'pr', pattern: /#\d+\b/, tone: 'muted' }
  const defaultLinker: ProseLinker = { id: 'def', pattern: /@\w+/ }

  function colourToken(el: HTMLElement): string {
    const match = /(?:^|\s)text-(text-[a-z-]+)(?:\s|$)/.exec(el.getAttribute('data-cn') ?? '')
    if (!match) throw new Error(`no text colour token in "${el.getAttribute('data-cn')}"`)
    return match[1]
  }

  function expectClears(token: string, min: number) {
    for (const theme of ['light', 'dark'] as const) {
      const colors = getSemanticColors(theme)
      for (const plane of PLANES) {
        const ratio = contrast(colors[token as keyof typeof colors], colors[plane])
        expect(ratio, `${token} on ${plane} (${theme})`).toBeGreaterThanOrEqual(min)
      }
    }
  }

  it.each([
    ['brand', taskLinker, 'AW-22'],
    ['muted', mutedLinker, '#42'],
    ['link', wikiLinker, '[[note]]'],
    ['default', defaultLinker, '@someone'],
  ])('keeps the %s link tone at 4.5:1', (_tone, linker, body) => {
    render(<MarkdownProse body={`See ${body} here.`} linkers={[linker]} />)
    expectClears(colourToken(screen.getByTestId(`prose-ref-${linker.id}`)), 4.5)
  })

  it('keeps list bullets at 3:1', () => {
    render(<MarkdownProse body="- one" />)
    expectClears(colourToken(screen.getByText('•')), 3)
  })
})
