import { render, screen } from '@testing-library/react'
import { View } from 'react-native'
import { describe, expect, it } from 'vitest'
import { QA_ATTRIBUTES, qaAttrs } from './qa-attrs'

const qaNames = (el: Element) =>
  el
    .getAttributeNames()
    .filter((name) => name.startsWith('data-qa-'))
    .sort()

describe('qaAttrs', () => {
  it('stamps every protocol attribute, and only those, when every mark is set', () => {
    render(
      <View
        testID="marked"
        {...qaAttrs({
          container: true,
          context: true,
          decor: true,
          camera: true,
          order: '.row',
          title: true,
          glyph: true,
          level: '.value',
        })}
      />
    )

    expect(qaNames(screen.getByTestId('marked'))).toEqual([...QA_ATTRIBUTES].sort())
  })

  it('renders a flag as an empty attribute and a selector as its value', () => {
    render(<View testID="marked" {...qaAttrs({ context: true, order: '[data-row]' })} />)

    const el = screen.getByTestId('marked')
    expect(el).toHaveAttribute('data-qa-context', '')
    expect(el).toHaveAttribute('data-qa-order', '[data-row]')
  })

  it('leaves a false or missing mark off the element', () => {
    render(<View testID="marked" {...qaAttrs({ context: false })} />)

    expect(qaNames(screen.getByTestId('marked'))).toEqual([])
  })
})
