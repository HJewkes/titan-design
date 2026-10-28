import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { capturedByNode } from './classname-capture'
import { Avatar } from '../components/ui/avatar'
import { Link } from '../components/ui/link'
import { Tab, TabList, Tabs } from '../components/ui/tabs'
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table'
import { Typography } from '../components/ui/typography'

/**
 * TD-1036: React Native Web gives every outermost <Text> `font: 14px System`, so text with no
 * font-* class drew the system stack. global.css sets the body face on RNW's text reset class; a
 * font-* utility, emitted after it, still wins. jsdom resolves the cascade of the sheets below:
 * global.css's own rules for RNW's text class, then the font-* utilities in Tailwind's order.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const globalCss = readFileSync(path.join(here, '../theme/global.css'), 'utf8')
const BODY = 'var(--font-family-body)'
const SANS = 'var(--font-family-sans)'

const UTILITIES = ['sans', 'body', 'heading', 'mono']
  .map((face) => `.font-${face} { font-family: var(--font-family-${face}), sans-serif; }`)
  .join('\n')

function textRules() {
  return (globalCss.match(/^\s*[^{}\n]*css-text[^{}\n]*\{[^}]*\}/gm) ?? []).join('\n')
}

let sheet: HTMLStyleElement
beforeEach(() => {
  sheet = document.createElement('style')
  sheet.textContent = `${textRules()}\n${UTILITIES}`
  document.head.appendChild(sheet)
})
afterEach(() => sheet.remove())

// NativeWind does not run under vitest, so the component's className is put on the node by hand.
function faceOf(text: string) {
  const node = screen.getByText(text)
  node.classList.add(...(capturedByNode.get(node) ?? '').split(/\s+/).filter(Boolean))
  return getComputedStyle(node).fontFamily
}

const unclassed: [string, ReactElement, string][] = [
  [
    'TableCell',
    <Table key="t">
      <TableBody>
        <TableRow>
          <TableCell>Cell text</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
    'Cell text',
  ],
  [
    'Link',
    <Link key="l" href="#">
      Link text
    </Link>,
    'Link text',
  ],
  ['Avatar initials', <Avatar key="a" fallback="QR" />, 'QR'],
]

describe('default text face', () => {
  it.each(unclassed)('%s text resolves to the body face', (_, element, text) => {
    render(element)
    expect(faceOf(text)).toContain(BODY)
  })

  it('a Tab label keeps its explicit sans face', () => {
    render(
      <Tabs>
        <TabList>
          <Tab index={0}>Tab label</Tab>
        </TabList>
      </Tabs>
    )
    expect(faceOf('Tab label')).toContain(SANS)
  })

  it('a heading with an explicit face is unchanged', () => {
    render(<Typography variant="h3">Heading text</Typography>)
    expect(faceOf('Heading text')).toContain('var(--font-family-heading)')
  })
})
