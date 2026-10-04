import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { Animated, Text, View } from 'react-native'
import { spacingClassesAt, spacingClassesOf, resolveAll } from './spacing-resolver'

type ClassName = { className?: string }
const ViewC = View as unknown as React.ComponentType<
  ClassName & { testID?: string; children?: React.ReactNode }
>
const AnimatedViewC = Animated.View as unknown as typeof ViewC

function Fixture({ gap = 'gap-inline-md' }: { gap?: string }) {
  return (
    <ViewC className={`flex-row px-squish-x-md ${gap}`}>
      <Text>label</Text>
    </ViewC>
  )
}

describe('node-keyed className capture', () => {
  it('reads the rendered classes off a node found by text', () => {
    render(<Fixture />)
    const classes = spacingClassesAt(screen.getByText('label').parentElement)
    expect(classes).toEqual(['px-squish-x-md', 'gap-inline-md'])
    expect(resolveAll(classes)).toEqual(['12px', '8px'])
  })

  it('still hands the node to a caller object ref and function ref', () => {
    const objectRef = createRef<HTMLElement>()
    const fnRef = vi.fn()
    const Ref = ViewC as unknown as React.ComponentType<ClassName & { ref: unknown }>
    render(
      <>
        <Ref ref={objectRef} className="p-4" />
        <Ref ref={fnRef} className="p-2" />
      </>
    )
    expect(objectRef.current).toBeInstanceOf(HTMLElement)
    expect(fnRef).toHaveBeenCalledWith(expect.any(HTMLElement))
    expect(spacingClassesAt(objectRef.current)).toEqual(['p-4'])
  })

  it('throws on an Animated.View that carries a className', () => {
    render(
      <AnimatedViewC testID="anim" className="p-4">
        <Text>inner</Text>
      </AnimatedViewC>
    )
    expect(() => spacingClassesOf('anim')).toThrow(/Animated/)
    expect(() => spacingClassesAt(screen.getByText('inner').parentElement)).toThrow(/Animated/)
  })

  it('fails when a class in the fixture changes', () => {
    render(<Fixture gap="gap-inline-lg" />)
    const classes = spacingClassesAt(screen.getByText('label').parentElement)
    expect(classes).not.toEqual(['px-squish-x-md', 'gap-inline-md'])
  })
})
