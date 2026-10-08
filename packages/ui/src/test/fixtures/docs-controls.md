# Planted controls for doc-claims.test.ts

Two claims here are dead on purpose; the test fails unless the checker reports both.

- The tokens live in `packages/ui/src/theme/tokens/no-such-file.ts`.
- Regenerate with `pnpm no-such-script`.

The rest resolve and must not be reported: `packages/ui/src/theme/tokens/semantic.ts`,
`ui/charts/kit/`, `pnpm lint`, and

```tsx
import { cn } from '@titan-design/react-ui'
import { clsx } from 'clsx'
```
