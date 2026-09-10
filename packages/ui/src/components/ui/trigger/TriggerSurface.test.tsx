import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { View, Text } from 'react-native'
import { TriggerSurface } from './TriggerSurface'
import { Button, ButtonText } from '../button'
import { Menu, MenuTrigger, MenuList, MenuItem } from '../menu'
import { Popover, PopoverTrigger, PopoverContent } from '../popover'
import { Tooltip } from '../tooltip'

/**
 * A real pointer press, not a bare synthetic click.
 *
 * The bug (AW-130) only shows when the whole gesture reaches the innermost
 * element: React Native Web's PressResponder calls `stopPropagation()` on the
 * click it handles, so an outer Pressable wrapping a Pressable child never runs
 * its handler. `fireEvent.click` on the outer element sidesteps that entirely.
 */
function pressWithPointer(element: Element) {
  fireEvent.mouseDown(element, { button: 0, detail: 1 })
  fireEvent.mouseUp(element, { button: 0, detail: 1 })
  fireEvent.click(element, { button: 0, detail: 1 })
}

/**
 * Hover the element itself. Enter events do not bubble, and RNW's `useHover`
 * contains hover to the innermost node, so a wrapper never learns about a hover
 * that lands on a Pressable child.
 */
function hoverWithPointer(element: Element) {
  fireEvent.pointerEnter(element)
  fireEvent.mouseEnter(element)
}

describe('TriggerSurface', () => {
  it('fires when the child is a Pressable component that claims the gesture', () => {
    const onPress = vi.fn()
    render(
      <TriggerSurface handlers={{ onPress }} accessibilityRole="button">
        <Button>
          <ButtonText>Options</ButtonText>
        </Button>
      </TriggerSurface>
    )

    pressWithPointer(screen.getByText('Options'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('fires exactly once, not once per nested pressable', () => {
    const onPress = vi.fn()
    render(
      <TriggerSurface handlers={{ onPress }} accessibilityRole="button">
        <Button>
          <ButtonText>Options</ButtonText>
        </Button>
      </TriggerSurface>
    )

    pressWithPointer(screen.getByText('Options'))
    pressWithPointer(screen.getByText('Options'))
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('keeps the child own onPress alongside the trigger handler', () => {
    const onPress = vi.fn()
    const childPress = vi.fn()
    render(
      <TriggerSurface handlers={{ onPress }} accessibilityRole="button">
        <Button onPress={childPress}>
          <ButtonText>Options</ButtonText>
        </Button>
      </TriggerSurface>
    )

    pressWithPointer(screen.getByText('Options'))
    expect(childPress).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('fires when the child is a host element that cannot take onPress', () => {
    const onPress = vi.fn()
    render(
      <TriggerSurface handlers={{ onPress }} accessibilityRole="button">
        <span>Options</span>
      </TriggerSurface>
    )

    pressWithPointer(screen.getByText('Options'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('fires when the child is a component with no press handling of its own', () => {
    const onPress = vi.fn()
    render(
      <TriggerSurface handlers={{ onPress }} accessibilityRole="button">
        <View>
          <Text>Options</Text>
        </View>
      </TriggerSurface>
    )

    pressWithPointer(screen.getByText('Options'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('leaves a single button role rather than nesting two', () => {
    const { container } = render(
      <TriggerSurface
        handlers={{ onPress: () => {} }}
        accessibilityRole="button"
        accessibilityState={{ expanded: false }}
      >
        <Button>
          <ButtonText>Options</ButtonText>
        </Button>
      </TriggerSurface>
    )

    expect(container.querySelectorAll('[role="button"]')).toHaveLength(1)
    expect(container.querySelector('button button')).toBeNull()
  })

  it('keeps the wrapper out of the tab order when the child owns the press', () => {
    const { container } = render(
      <TriggerSurface handlers={{ onPress: () => {} }} accessibilityRole="button">
        <Button>
          <ButtonText>Options</ButtonText>
        </Button>
      </TriggerSurface>
    )

    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TriggerSurface
        handlers={{ onPress: () => {} }}
        accessibilityRole="button"
        accessibilityState={{ expanded: false }}
      >
        <Button>
          <ButtonText>Options</ButtonText>
        </Button>
      </TriggerSurface>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('trigger families under a real pointer press', () => {
  it('Menu opens when its Button trigger is pressed', () => {
    render(
      <Menu>
        <MenuTrigger>
          <Button>
            <ButtonText>Options</ButtonText>
          </Button>
        </MenuTrigger>
        <MenuList>
          <MenuItem>Edit</MenuItem>
        </MenuList>
      </Menu>
    )

    pressWithPointer(screen.getByText('Options'))
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('Popover opens when its Button trigger is pressed', () => {
    render(
      <Popover>
        <PopoverTrigger>
          <Button>
            <ButtonText>Open</ButtonText>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Text>Details</Text>
        </PopoverContent>
      </Popover>
    )

    pressWithPointer(screen.getByText('Open'))
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('Tooltip shows when its Button child is hovered', () => {
    render(
      <Tooltip label="Helpful hint">
        <Button>
          <ButtonText>Hover me</ButtonText>
        </Button>
      </Tooltip>
    )

    hoverWithPointer(screen.getByRole('button'))
    expect(screen.getByText('Helpful hint')).toBeInTheDocument()
  })

  it('Tooltip leaves its Button child clickable', () => {
    const onPress = vi.fn()
    render(
      <Tooltip label="Helpful hint">
        <Button onPress={onPress}>
          <ButtonText>Hover me</ButtonText>
        </Button>
      </Tooltip>
    )

    pressWithPointer(screen.getByText('Hover me'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
