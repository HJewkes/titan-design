import { describe, expectTypeOf, it } from 'vitest'
import type { ButtonColor, ButtonSize, ButtonVariant } from './button/Button'
import type { CardVariant } from './card/Card'
import type { InputSize, InputVariant } from './input/Input'
import type { TypographyColor, TypographyVariant } from './typography/Typography'

// Each alias mirrors a value list in packages/ui/README.md "Component API".
type ReadmeButtonVariant = 'solid' | 'outline' | 'ghost' | 'link'
type ReadmeButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
type ReadmeButtonSize = 'sm' | 'md' | 'lg'
type ReadmeInputVariant = 'outline' | 'filled' | 'underline'
type ReadmeInputSize = 'sm' | 'md' | 'lg'
type ReadmeCardVariant = 'elevated' | 'outline' | 'filled' | 'accent' | 'subtle'
type ReadmeTypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'subtitle1'
  | 'subtitle2'
  | 'caption'
  | 'overline'
  | 'button'
  | 'mono'
  | 'monoLabel'
  | 'microLabel'
  | 'boldLabel'
type ReadmeTypographyColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'inherit'

describe('README Component API values', () => {
  it('are exactly the members of the exported unions', () => {
    expectTypeOf<ReadmeButtonVariant>().toEqualTypeOf<ButtonVariant>()
    expectTypeOf<ReadmeButtonColor>().toEqualTypeOf<ButtonColor>()
    expectTypeOf<ReadmeButtonSize>().toEqualTypeOf<ButtonSize>()
    expectTypeOf<ReadmeInputVariant>().toEqualTypeOf<InputVariant>()
    expectTypeOf<ReadmeInputSize>().toEqualTypeOf<InputSize>()
    expectTypeOf<ReadmeCardVariant>().toEqualTypeOf<CardVariant>()
    expectTypeOf<ReadmeTypographyVariant>().toEqualTypeOf<TypographyVariant>()
    expectTypeOf<ReadmeTypographyColor>().toEqualTypeOf<TypographyColor>()
  })
})
