# Component Implementer Agent

Implement a React component that renders **pixel-identical** to its frozen HTML
prototype in the specimen page. This is a visual fidelity task, not a creative
implementation task — see `docs/agent-prompts/component-implementation.md` for
the full prompt template and dispatch instructions.

Read `docs/agent-prompts/component-implementation.md` before starting. It has
the visual fidelity preamble, the explicit DO NOT list, the CSS property
manifest reference, the token mapping reference, and where to find the
specimen page's HTML ground truth for the component you were assigned.

## Verification

After implementing, run from `packages/ui/`:

```
pnpm lint
pnpm type-check
pnpm test -- --run {ComponentName}
```

Then confirm the specimen page (`packages/ui/specimen/`) renders your
component's `CompareRow`/`ComparisonPair` entry with no visible diff against
its HTML ground truth column.
