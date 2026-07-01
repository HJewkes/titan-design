# Titan Design System

A cross-platform React design system built on NativeWind (Tailwind CSS for React Native). Components work seamlessly on web and native platforms.

## Features

- **Cross-Platform**: Write once, run on web and React Native
- **Dark Mode First**: Dark theme by default with light mode support
- **Accessible**: Built-in accessibility following WCAG 2.1 AA
- **Type-Safe**: Full TypeScript support with strict mode
- **Customizable**: Design tokens and component styles are easy to override
- **Documented**: Comprehensive Storybook documentation

## Packages

- **[@titan-design/react-ui](./packages/ui)** - Core component library

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/HJewkes/titan-design.git
cd titan-design

# Install dependencies
pnpm install

# Start Storybook
pnpm storybook
```

### Using the Components

```tsx
import { Button, ButtonText, Typography, Card, CardContent } from '@titan-design/react-ui'
import '@titan-design/react-ui/theme/global.css'

function App() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h2">Welcome</Typography>
        <Typography variant="body1">
          Cross-platform components that just work.
        </Typography>
        <Button color="primary">
          <ButtonText>Get Started</ButtonText>
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Commands

```bash
# Build all packages
pnpm build

# Run Storybook
pnpm storybook

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Architecture

```
titan-design/
├── packages/
│   └── ui/                     # Component library
│       ├── src/
│       │   ├── components/     # UI components
│       │   │   ├── ui/         # Gluestack-based
│       │   │   └── custom/     # Hand-built
│       │   ├── theme/          # Design tokens & CSS
│       │   └── utils/          # Utilities
│       └── .storybook/         # Storybook config
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # Technical architecture
│   └── STORYBOOK_SETUP.md      # Storybook configuration guide
├── CLAUDE.md                     # AI assistant instructions
├── pnpm-workspace.yaml
└── turbo.json
```

## Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Storybook Setup](./docs/STORYBOOK_SETUP.md)** - Storybook configuration guide
- **[CLAUDE.md](./CLAUDE.md)** - Component patterns, tokens, and development conventions
- **[Component Implementation Checklist](./docs/component-implementation-checklist.md)** - Per-component "done" gate for the HTML-to-React extraction pipeline

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform primitives |
| NativeWind v4 | Tailwind CSS for React Native |
| Gluestack UI | Accessible component foundation |
| Storybook 10 | Component documentation |
| Vitest | Unit testing |
| TypeScript | Type safety |
| pnpm + Turborepo | Monorepo management |

## Design Principles

### 1. Cross-Platform First

All components use React Native primitives (`View`, `Text`, `Pressable`) that compile to web and native.

### 2. Dark Mode Default

Design for dark mode first, add explicit light mode styles.

### 3. Compound Components

Complex components follow the Gluestack pattern:

```tsx
<Button variant="solid" color="primary">
  <ButtonIcon as={PlusIcon} />
  <ButtonText>Add Item</ButtonText>
</Button>
```

### 4. Semantic Tokens

Use DTCG naming conventions for design tokens:

- `brand-*` for brand colors
- `status-*` for feedback colors
- `text-*` for text hierarchy
- `surface-*` for container backgrounds
- `interactive-*` for state colors

### 5. Accessibility Built-In

All components include proper ARIA attributes and accessibility labels.

## Components

### Core UI (Gluestack-based)

- Button, Input, Card, Badge
- Checkbox, Switch, Radio
- Modal, Spinner, Avatar
- Divider

### Custom Components

- Typography (consistent text styling)
- Sidebar (navigation)
- Table (data display)
- EmptyState (placeholders)

## Contributing

1. Follow the patterns in `CLAUDE.md` and `docs/ARCHITECTURE.md`
2. Add Storybook stories for new components
3. Include unit tests and accessibility tests
4. Update documentation as needed

## License

MIT
