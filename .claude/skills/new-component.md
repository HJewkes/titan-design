---
description: Create a new component with all required files following titan-design conventions
user_invocable: true
---

# Create New Component

This file is a pointer. The conventions live in the repo's root `CLAUDE.md`, where they are kept
current:

- _Component Development_: file structure, barrels, props conventions, accessibility, and the
  testing and Storybook patterns (one `Default` story driven by controls).
- _Design Tokens_: which token classes to use.

The design and review process (operator gates, specimen rounds, composing existing primitives)
belongs to the `titan-component-workflow` skill. Run `pnpm lint`, `pnpm type-check`,
`pnpm format:check` and `pnpm exec vitest run <path>` from `packages/ui` before you open a PR.
