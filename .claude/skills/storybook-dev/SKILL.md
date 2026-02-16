---
description: Write or fix Storybook stories for titan-design components
user_invocable: true
---

# Storybook Development

Write Storybook stories for titan-design components.

## Critical Setup

Storybook uses `@storybook/react-native-web-vite` with `jsxImportSource: 'nativewind'`. Without this, NativeWind classes won't work in stories.

## Import Pattern

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'  // NOT @storybook/react
```

Using `@storybook/react` instead of `@storybook/react-vite` causes type errors with Storybook 10.

## Render Function Naming

ESLint requires `react-hooks/rules-of-hooks` compliance. If a story's `render` function uses hooks, it **must** be a PascalCase named function:

```tsx
// Wrong — lint error (hooks in anonymous function)
render: (args) => {
  const [open, setOpen] = useState(false)
  return <Component {...args} open={open} />
}

// Right — PascalCase named function
render: function Render(args) {
  const [open, setOpen] = useState(false)
  return <Component {...args} open={open} />
}
```

## Story Structure

```tsx
const meta: Meta<typeof Component> = {
  title: 'Components/ComponentName',  // or 'Custom/Name', 'Design Tokens/Name'
  component: Component,
  tags: ['autodocs'],
  argTypes: { /* controls */ },
}
export default meta
type Story = StoryObj<typeof Component>

export const Default: Story = { args: { /* ... */ } }
export const AllVariants: Story = { /* showcase all variants */ }
```

## Unescaped Entities

JSX text content must escape special characters: use `&apos;` not `'`, `&quot;` not `"`.

## Verification

After writing stories: `cd packages/ui && pnpm lint && pnpm storybook --ci`
