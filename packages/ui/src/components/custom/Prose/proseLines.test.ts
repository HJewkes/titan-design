import { describe, expect, it } from 'vitest'
import { parseProseBlocks } from './parseProseBlocks'
import {
  calloutOpenLine,
  fenceOpenLang,
  hasPipe,
  headingLine,
  isCalloutClose,
  isCommentOpener,
  isFenceClose,
  isFrontmatterKey,
  listItemLine,
} from './proseLines'
import { isBlank, isSpace, splitLines, type LineRange, type ProseSource } from './proseSource'

type Classifier = (src: ProseSource, line: LineRange) => unknown

const PAD = ' \t'
const LAST_UTF16_CODE = 65_535

/** Each line kind: its classifier, a line of that kind, and the result plain and padded with `' \t'`. */
const KINDS: [string, Classifier, string, unknown, unknown][] = [
  ['blank', isBlank, '', true, true],
  ['heading', headingLine, '## Title', { level: 2, text: 'Title' }, { level: 2, text: 'Title' }],
  ['fence open', fenceOpenLang, '```ts', 'ts', 'ts'],
  ['fence close', isFenceClose, '```', true, true],
  [
    'callout open',
    calloutOpenLine,
    '::: warning Mind the gap',
    { word: 'warning', title: 'Mind the gap' },
    { word: 'warning', title: 'Mind the gap' },
  ],
  ['callout close', isCalloutClose, ':::', true, true],
  [
    'bullet item',
    listItemLine,
    '- an item',
    { indent: 0, ordered: false, number: 1, offset: 2 },
    { indent: 2, ordered: false, number: 1, offset: 4 },
  ],
  [
    'ordered item',
    listItemLine,
    '12) an item',
    { indent: 0, ordered: true, number: 12, offset: 4 },
    { indent: 2, ordered: true, number: 12, offset: 6 },
  ],
  ['comment opener', isCommentOpener, '<!-- a note', true, true],
  // A frontmatter key starts its line, so padding disqualifies it.
  ['frontmatter key', isFrontmatterKey, 'title: Synthetic', true, false],
  ['table pipe', hasPipe, 'a | b', true, true],
]

const CASES = KINDS.flatMap(([kind, classify, line, plain, padded]) => [
  [`${kind}, plain`, classify, line, plain],
  [`${kind}, padded`, classify, `${PAD}${line}${PAD}`, padded],
  [`${kind}, with a CR tail`, classify, `${line}\rnext`, plain],
  [`${kind}, with a line separator tail`, classify, `${line}\u2028next`, plain],
]) as [string, Classifier, string, unknown][]

const slices = (text: string) => splitLines(text).map(({ start, end }) => text.slice(start, end))

describe('prose line scanner', () => {
  it('splits lines on \\r\\n, \\r, \\n, U+2028 and U+2029', () => {
    expect(slices('a\r\nb\rc\nd\u2028e\u2029f')).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    expect(slices('a\n\r\nb\r\r')).toEqual(['a', '', 'b', '', ''])
    expect(slices('')).toEqual([''])
  })

  it('treats exactly the characters JavaScript calls white space as white space', () => {
    const mismatches: number[] = []
    for (let code = 0; code <= LAST_UTF16_CODE; code++) {
      if (isSpace(code) !== /\s/.test(String.fromCharCode(code))) mismatches.push(code)
    }
    expect(mismatches).toEqual([])
  })

  it.each(CASES)('classifies %s', (_name, classify, text, expected) => {
    expect(classify(text, splitLines(text)[0]!)).toEqual(expected)
  })

  it('treats a line it cannot classify as paragraph text', () => {
    const lines = [
      '#no-space',
      '####### seven',
      '::: ',
      ':::!',
      '1234567890. ten digits',
      '-dash',
      '- ',
      '```a b',
      '``',
    ]
    for (const line of lines) {
      expect(parseProseBlocks(line), line).toEqual([{ type: 'p', text: line.trim() }])
    }
  })
})
