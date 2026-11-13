import { describe, expect, it } from 'vitest'
import { scanInline } from './proseInlineScan'
import { linkParts } from './proseInlineTokens'

const spans = (text: string) =>
  scanInline(text).map((token) => [token.kind, text.slice(token.start, token.end)])

describe('prose inline scanner', () => {
  // Expected spans are what the regex tokenizer this scanner replaced returned for each input.
  it.each([
    ['2*3*4', [['text', '2*3*4']]],
    ['snake_case', [['text', 'snake_case']]],
    [
      '**a***',
      [
        ['bold', '**a**'],
        ['text', '*'],
      ],
    ],
    [
      '*a* and _b_',
      [
        ['italic', '*a*'],
        ['text', ' and '],
        ['italic', '_b_'],
      ],
    ],
    ['[a [b] c](u "t")', [['link', '[a [b] c](u "t")']]],
    ['[x](javascript:alert(1))', [['link', '[x](javascript:alert(1))']]],
    [
      '<!-- a --> b',
      [
        ['comment', '<!-- a -->'],
        ['text', ' b'],
      ],
    ],
    ['_**b**_', [['italic', '_**b**_']]],
    ['[a(', [['text', '[a(']]],
    ['**a', [['text', '**a']]],
    ['`a', [['text', '`a']]],
    ['<!--', [['text', '<!--']]],
  ])('scans %s into the expected spans', (text, expected) => {
    expect(spans(text)).toEqual(expected)
  })

  it('leaves an opener with no closer as literal text', () => {
    const text = 'a [b]( c `d **e _f <!-- g'
    expect(spans(text)).toEqual([['text', text]])
  })

  it('drops a link title after a whitespace run', () => {
    const text = '[label](/a/b   \t "A title")'
    const [token] = scanInline(text)
    expect(token!.kind).toBe('link')
    expect(linkParts(text, token!)).toEqual({ label: 'label', target: '/a/b' })
  })
})
