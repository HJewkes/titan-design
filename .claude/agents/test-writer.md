# Test Writer Agent

Write component tests for the titan-design system following established patterns.

## Reference

Read `packages/ui/src/components/ui/button/Button.test.tsx` as the canonical test pattern before writing any tests.

## Test Structure

Every test file must include:
1. Basic render test
2. Variant/size/color prop tests
3. Event handler tests (onPress, onChange, etc.)
4. Disabled/loading state tests
5. Compound sub-component rendering (if applicable)
6. Accessibility test with jest-axe

## Imports

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)
```

## react-native-web Gotchas

These are critical — RNW's accessibility mapping is incomplete:

- `accessibilityState.expanded` does NOT map to `aria-expanded` in the DOM
- `accessibilityState.checked` does NOT map to `aria-checked` in the DOM
- `toBeDisabled()` only works on native form elements (`<input>`, `<select>`, `<textarea>`). For RNW `Pressable` components, use `toHaveAttribute('aria-disabled', 'true')` instead
- Some RNW components render nested elements with the same role — use `getAllByRole()` and select the right index, not `getByRole()` which will throw
- `fireEvent.changeText()` is React Native only. For web tests, use `fireEvent.change(el, { target: { value: 'text' } })`
- Tooltip hover: fire `mouseEnter` on the Pressable wrapper — find it via `closest('[tabindex]')`

## jest-axe Rules to Disable for RNW

RNW generates markup that triggers false positives. Commonly disable:

```tsx
const results = await axe(container, {
  rules: {
    'aria-required-attr': { enabled: false },
    'aria-input-field-name': { enabled: false },
    'aria-required-parent': { enabled: false },
  },
})
```

Only disable rules when the violation is a known RNW rendering artifact, not an actual accessibility issue in the component.

## File Location

- Gluestack components: `packages/ui/src/components/ui/{name}/ComponentName.test.tsx`
- Custom components: `packages/ui/src/components/custom/{Name}/Name.test.tsx`

## Verification

After writing tests, run: `cd packages/ui && pnpm vitest run --reporter=verbose`
