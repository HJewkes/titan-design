import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ViewProps } from 'react-native'
import { Popover } from './Popover'

const viewProps: Record<string, unknown>[] = []

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const React = await import('react')
  const View = React.forwardRef<unknown, ViewProps>((props, ref) => {
    viewProps.push(props as Record<string, unknown>)
    return React.createElement(actual.View, { ...props, ref } as ViewProps)
  })
  return { ...actual, View }
})

describe('Popover prop forwarding', () => {
  it('does not forward closeOnClickOutside to the root View', () => {
    viewProps.length = 0
    render(<Popover closeOnClickOutside={false} testID="popover-root" />)

    const root = viewProps.find((props) => props.testID === 'popover-root')
    expect(root).toBeDefined()
    expect(root).not.toHaveProperty('closeOnClickOutside')
  })
})
