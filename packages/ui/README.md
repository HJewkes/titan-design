# @titan-design/react-ui

A cross-platform design system built on React Native primitives with NativeWind (Tailwind CSS). Works on web and React Native.

## Features

- **Cross-platform**: Components work on web (via react-native-web) and React Native
- **Dark mode first**: Dark theme by default with light mode support
- **Accessible**: Built with accessibility in mind (WCAG 2.1 AA)
- **Customizable**: Theme tokens and component styles are easy to override
- **Type-safe**: Full TypeScript support with strict mode
- **Compound components**: Flexible composition following Gluestack patterns

## Installation

```bash
pnpm add @titan-design/react-ui
```

### Peer Dependencies

```bash
# For web
pnpm add react react-dom react-native-web lucide-react

# For React Native
pnpm add react react-native lucide-react-native
```

## Setup

### 1. Import Global CSS

```tsx
// App.tsx or entry point
import '@titan-design/react-ui/theme/global.css'
```

### 2. Configure Tailwind (optional, for custom styling)

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@titan-design/react-ui/dist/**/*.{js,mjs}',
  ],
  presets: [require('nativewind/preset')],
  // Your customizations...
}
```

### 3. Web Setup (Vite)

Titan's web dist includes a built-in JSX runtime that handles className-to-CSS
conversion automatically. No NativeWind runtime or special Vite config is needed.
See the full guide: **[Web Consumer Setup](docs/WEB_SETUP.md)**

Quick summary:

1. `npm install react-native-web` and `npm install -D nativewind` (Tailwind preset only)
2. Add `resolve.alias: { 'react-native': 'react-native-web' }` to your Vite config
3. Add titan's dist to your Tailwind `content` array and use titan's config as a preset

## Usage

```tsx
import { 
  Button, 
  ButtonText, 
  ButtonIcon,
  Typography, 
  Card, 
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  InputGroup,
} from '@titan-design/react-ui'
import { Plus } from 'lucide-react'

function App() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <Typography variant="body1">
          This is a cross-platform card component.
        </Typography>
        
        <InputGroup>
          <Input
            placeholder="Enter your email"
            label="Email"
          />
        </InputGroup>
        
        <Button color="primary" variant="solid">
          <ButtonIcon as={Plus} />
          <ButtonText>Get Started</ButtonText>
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Components

### Core UI Components

| Component | Description |
|-----------|-------------|
| **Button** | Primary action component with variants: solid, outline, ghost, link |
| **Input** | Text input with label, helper text, and error states |
| **Card** | Container component with header, content, footer |
| **Badge** | Status indicator labels |
| **Spinner** | Loading indicator |
| **Avatar** | User/entity representation |
| **Divider** | Visual separator |
| **Checkbox** | Boolean input with group support |
| **Switch** | Toggle input |
| **Modal** | Dialog/overlay component |

### Custom Components

| Component | Description |
|-----------|-------------|
| **Typography** | Consistent text styling (h1-h6, body, caption, etc.) |
| **Sidebar** | Navigation sidebar with collapsible support |
| **Table** | Data table with sorting and pagination |
| **EmptyState** | Placeholder for empty data states |

## Component API

### Button

```tsx
<Button
  variant="solid" | "outline" | "ghost" | "link"
  color="primary" | "secondary" | "success" | "error" | "warning" | "info"
  size="sm" | "md" | "lg"
  isDisabled={false}
  isLoading={false}
  onPress={() => {}}
>
  <ButtonIcon as={IconComponent} />
  <ButtonText>Button Text</ButtonText>
</Button>
```

### Input

```tsx
<Input
  label="Field Label"
  placeholder="Placeholder text"
  helperText="Helper text"
  errorMessage="Error message"
  variant="outline" | "filled" | "underlined"
  size="sm" | "md" | "lg"
  isDisabled={false}
  isInvalid={false}
  isReadOnly={false}
  isRequired={false}
  value={value}
  onChangeText={setValue}
/>
```

### Typography

```tsx
<Typography
  variant="h1" | "h2" | "h3" | "h4" | "h5" | "h6" | 
           "body1" | "body2" | "caption" | "overline"
  color="primary" | "secondary" | "tertiary" | "disabled"
>
  Text content
</Typography>
```

### Card

```tsx
<Card variant="default" | "elevated" | "outline" | "filled">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Theme

The design system uses CSS custom properties for theming. Dark mode is the default.

### Using the Theme

Import the global CSS in your app:

```tsx
import '@titan-design/react-ui/theme/global.css'
```

### Switching Themes

Add the `light` class to your root element for light mode:

```tsx
// Dark mode (default)
<div>
  {/* Your app */}
</div>

// Light mode
<div className="light">
  {/* Your app */}
</div>
```

### Programmatic Theme Switching

```tsx
function toggleTheme() {
  document.documentElement.classList.toggle('light')
}
```

## Design Tokens

The design system uses a two-tier token system following DTCG conventions:

### Token Categories

| Category | Pattern | Description |
|----------|---------|-------------|
| `brand-*` | `brand-primary`, `brand-secondary` | Brand identity colors |
| `status-*` | `status-success`, `status-error`, `status-warning`, `status-info` | Feedback colors |
| `text-*` | `text-primary`, `text-secondary`, `text-tertiary` | Text hierarchy |
| `surface-*` | `surface-base`, `surface-elevated`, `surface-raised` | Container backgrounds |
| `background-*` | `background-base`, `background-default` | Page backgrounds |
| `border-*` | `border-default`, `border-subtle`, `border-strong` | Border colors |
| `interactive-*` | `interactive-hover`, `interactive-focus`, `interactive-active` | State colors |

### Using Tokens

```tsx
// In components
<View className="bg-surface-elevated rounded-lg" style={{ borderWidth: 1, borderColor: '#1F1F1F' }}>
  <Text className="text-text-primary">Primary text</Text>
  <Text className="text-text-secondary">Secondary text</Text>
</View>
```

> **Note:** Do not combine `border` + `border-border-*` classes for colored borders. The bare `border` utility sets `borderColor: currentColor` (often black), which overrides the token color unreliably. Use `style={{ borderWidth: 1, borderColor: '...' }}` instead. See [Common Pitfalls](#common-pitfalls) below.

## Common Pitfalls

### Border Styling

The bare `border` Tailwind utility sets both `borderWidth: 1` **and** `borderColor: currentColor`. When combined with a `border-border-*` color class, the color assignment order is not guaranteed in NativeWind/React Native, which can produce black borders instead of the intended theme color.

```tsx
// WRONG — border sets currentColor, may render black on native
<View className="border border-border-default" />

// WRONG — same problem with any border-* color class
<View className="border border-border-input" />
```

```tsx
// RIGHT — explicit inline style, no ambiguity
<View style={{ borderWidth: 1, borderColor: '#1F1F1F' }} />

// RIGHT — use WORKOUT_TOKENS constants for type-safe access
import { WORKOUT_TOKENS } from '@titan-design/react-ui/theme'
<View style={{ borderWidth: 1, borderColor: WORKOUT_TOKENS.border.default }} />

// RIGHT on web only — border-border (no bare 'border') resolves to the CSS variable
<View className="border-[1px] border-border" />
```

Run `pnpm lint:borders` to catch any `border border-*` patterns in source components.

For full token reference and additional pitfalls, see [`src/theme/TOKEN_MAPPING.md`](src/theme/TOKEN_MAPPING.md).

---

## Development

### Storybook

```bash
pnpm storybook
```

Open [http://localhost:6006](http://localhost:6006) to view component documentation.

### Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Build

```bash
pnpm build
```

## Storybook Configuration

This package uses Storybook 10 with `@storybook/react-native-web-vite` for proper NativeWind support. Key configuration:

```typescript
// .storybook/main.ts
framework: {
  name: '@storybook/react-native-web-vite',
  options: {
    pluginReactOptions: {
      jsxImportSource: 'nativewind',
    },
  },
}
```

See the [Storybook Setup Guide](../../docs/STORYBOOK_SETUP.md) for detailed configuration.

## Cross-Platform Notes

### React Native Primitives

All components use React Native primitives for cross-platform compatibility:

| Web Element | React Native Equivalent |
|-------------|------------------------|
| `div` | `View` |
| `span`, `p` | `Text` |
| `button` | `Pressable` |
| `input` | `TextInput` |
| `img` | `Image` |

### Platform-Specific Styles

Use NativeWind platform modifiers when needed:

```tsx
<View className="p-4 web:hover:bg-gray-100 native:active:opacity-80">
```

## License

MIT
