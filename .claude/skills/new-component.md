---
description: Create a new component with all required files following titan-design conventions
user_invocable: true
---

# Create New Component

Create a new component in the titan-design system. Ask the user for:
1. Component name
2. Whether it's a Gluestack-based (ui/) or hand-built (custom/) component
3. Brief description of what it does

## Steps

1. **Create directory**: `packages/ui/src/components/{ui|custom}/{ComponentName}/`

2. **Create ComponentName.tsx** following these rules:
   - Import React Native primitives (View, Text, Pressable) - never HTML elements
   - Use `cn()` from `@/utils/cn` for all className composition
   - Props: `isDisabled` (not `disabled`), `onPress` (not `onClick`), `className` for overrides
   - Standard prop types: variant, size, color where applicable
   - Explicit dark/light mode styles on every element
   - Use semantic token classes (bg-surface-elevated, text-text-primary)
   - For compound components, export sub-components (e.g., ButtonText, ButtonIcon)
   - Add proper accessibility: accessibilityRole, accessibilityLabel, accessibilityState

3. **Create ComponentName.test.tsx**:
   - Import from `@testing-library/react` and `jest-axe`
   - Basic render test
   - Props behavior tests (variants, disabled state, etc.)
   - Accessibility test: `expect(await axe(container)).toHaveNoViolations()`

4. **Create ComponentName.stories.tsx**:
   - Import Meta/StoryObj from `@storybook/react-vite`
   - Set `title: 'Components/Name'` (or `'Custom/Name'` for custom components)
   - Include `tags: ['autodocs']`
   - Define argTypes for all controllable props
   - Create stories: Default, AllVariants, AllColors, AllSizes as applicable
   - Use explicit render functions for compound components

5. **Create index.ts**: Barrel export all public types and components

6. **Update parent index.ts**: Add export to `src/components/{ui|custom}/index.ts`

7. **Run tests**: `cd packages/ui && pnpm test -- --run --reporter=verbose {ComponentName}`

8. **Run lint**: `cd packages/ui && pnpm lint`
