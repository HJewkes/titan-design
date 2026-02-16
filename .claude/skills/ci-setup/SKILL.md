---
description: Set up or modify CI pipeline for this Turborepo monorepo
user_invocable: true
---

# CI Setup

Configure CI/CD for the titan-design Turborepo monorepo.

## Turborepo Monorepo Patterns

### Script Registration (both places required)

Every CI-runnable script needs:
1. **Package-level**: Add to `packages/ui/package.json` scripts
2. **Root-level**: Add turbo passthrough to root `package.json` (`"script": "turbo run script"`)
3. **Turbo task**: Register in `turbo.json` under `tasks`

Missing any of these causes `pnpm <script>` to fail in CI.

### CLI Argument Passthrough

Turbo needs double `--` for argument forwarding:
```bash
# Wrong: pnpm test -- --run --coverage
# Right: pnpm test -- -- --run --coverage
```

The first `--` passes through pnpm, the second through turbo.

### Coverage Thresholds

Set coverage thresholds **below current actual coverage**, not at aspirational targets. When a branch has limited test files, thresholds must match reality:
- Query current coverage: `cd packages/ui && pnpm vitest run --coverage`
- Set thresholds in `packages/ui/vitest.config.ts` under `test.coverage.thresholds`
- Increase thresholds incrementally as more tests are added

### CI Workflow Structure

The workflow at `.github/workflows/ci.yml` runs:
1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (ESLint)
3. `pnpm type-check` (tsc --noEmit)
4. `pnpm format:check` (Prettier, continue-on-error)
5. `pnpm build` (tsup)
6. `pnpm test -- -- --run --coverage` (Vitest)

Matrix: Node 20 + 22, ubuntu-latest.
