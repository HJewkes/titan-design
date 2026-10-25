# Package reference

## Key Files

| File                                         | Purpose                                     |
| -------------------------------------------- | ------------------------------------------- |
| `packages/ui/src/index.ts`                   | Main barrel export                          |
| `packages/ui/src/theme/global.css`           | CSS custom properties + Tailwind imports    |
| `packages/ui/src/theme/tokens/primitives.ts` | Raw color/spacing values                    |
| `packages/ui/src/theme/tokens/semantic.ts`   | Semantic token definitions                  |
| `packages/ui/src/theme/elevation.ts`         | Elevation system with shadow math           |
| `packages/ui/src/utils/cn.ts`                | Tailwind class merge utility                |
| `packages/ui/tailwind.config.js`             | Tailwind + NativeWind configuration         |
| `packages/ui/tsup.config.ts`                 | Build configuration                         |
| `packages/ui/vitest.config.ts`               | Test configuration                          |
| `packages/ui/.storybook/main.ts`             | Storybook config (jsxImportSource critical) |

## Exports

```tsx
// Components + theme + utils
import {
  Button,
  ButtonText,
  Card,
  Typography,
  cn,
} from "@titan-design/react-ui";

// Theme only (subpath export)
import { semanticColorsDark, elevation } from "@titan-design/react-ui/theme";

// CSS (required by consumers)
import "@titan-design/react-ui/theme/global.css";

// Tailwind config (for extending in consuming apps)
const tailwindConfig = require("@titan-design/react-ui/tailwind.config.js");
```

## Gotchas

- Check `packages/ui/REJECTED.md` before treating a component as a reference; a rejected exploration can still sit on `main`, tested and exported.
- `src/lab/` is excluded from the published package (`"!src/lab"` in `files`), so a change there never reaches consumers.
- Releases publish from CI on a `v*` tag push (`publish.yml`, OIDC provenance). Never run `npm publish` locally, and push the release commit to `main` before the tag.
- `resolveColor` returns `var(--color-…)` on web, and tests alias `react-native` to `react-native-web`, so a test asserting a literal hex breaks; use `getSemanticColors('dark')[token]` where the value must be a hex.
- `tsconfig.json` excludes `*.stories.tsx`, and `stories-smoke.test.tsx` globs only `components/**`, so a broken story (especially under `src/theme/`) passes every gate. An unchanged test count after adding stories is the tell.
- Layer-1 visual baselines exist only as `*-chromium-linux.png`. Run that suite only in the pinned Playwright container, and refresh baselines from the `visual` workflow's `component-visual-baselines` artifact, not local Docker.
- `global.css` is prettier-ignored (its hex case mirrors `config.ts`), but `semantic.ts` is format-checked: edit token files additively with single-space `// ` trailing comments, and never run prettier over a whole token file.
- `titan/no-raw-color` also flags bare CSS colour keywords such as `'white'`, not only hex.
- When a barrel exports a new component file, run `pnpm arch:graph -- --add <file>` from the root, then `pnpm catalog`; it rewrites only that node's block in `src/arch/arch-graph.json`. When a component file is deleted, delete its node block by hand. Never run `arch-graph.mjs --reindex` in a feature PR: it rewrites metrics for untouched components. The graph stores no edge list, totals or barrel hash (`arch-graph-derived.ts` derives them), so two component PRs merge in either order.
