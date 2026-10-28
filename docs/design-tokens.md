# Design Tokens

## Two-Tier System (DTCG Standard)

1. **Primitives** (`src/theme/tokens/primitives.ts`) - Raw color scales, no semantic meaning
2. **Semantic** (`src/theme/tokens/semantic.ts`) - Meaningful names referencing primitives

## Token Categories

| Category    | Pattern               | Example Classes                                              |
| ----------- | --------------------- | ------------------------------------------------------------ |
| Brand       | `brand-{role}`        | `bg-brand-primary`, `text-brand-secondary`                   |
| Status      | `status-{type}`       | `bg-status-success`, `text-status-error`                     |
| Text        | `text-{role}`         | `text-text-primary`, `text-text-secondary`                   |
| Surface     | `surface-{level}`     | `bg-surface-base`, `bg-surface-elevated`                     |
| Background  | `background-{role}`   | `bg-background-base`, `bg-background-default`                |
| Border      | `border-{strength}`   | `border-border-default`, `border-border-subtle`              |
| Interactive | `interactive-{state}` | `hover:bg-interactive-hover`, `focus:ring-interactive-focus` |
| Result      | `result-{outcome}`    | `text-result-improve`, `text-result-degrade`                 |
| Data        | `data-{n}`            | `bg-data-1` through `bg-data-10`                             |
| Spacing     | `{situation}-{level}` | `p-inset-md`, `gap-stack-md`, `px-control-x-md`              |
| Sizing      | `control-{level}`     | `h-control-md`, `min-h-control-md`                           |

The 4px numeric scale (`p-3`, `gap-2`) stays legal everywhere. Spacing situations are `inset`,
`squish`, `stack`, `inline`, `control`, `section` and `gutter` — see `Foundations/Spacing` in
Storybook and TOKENS.md §5. `squish` and `control` carry an explicit axis (`squish-x-md`,
`control-y-md`) because `px-` and `py-` share one Tailwind namespace.

## Adding New Tokens

Four files must be updated in order:

1. `primitives.ts` - Add raw value (if new)
2. `semantic.ts` - Add semantic mapping (both dark and light)
3. `global.css` - Add CSS custom property (both `:root` and `.light`)
4. `tailwind.config.js` - Add Tailwind color reference

Colour properties are named `--color-{category}-{name}`, and the Tailwind entry is
`'var(--color-{category}-{name})'`. `theme/config.ts` lists every colour property by hand in
`darkThemeCSSVars` and `lightThemeCSSVars`; `config.completeness.test.ts` fails until the new
property is added there too. If `Foundations/Color/Palettes` lists the category's swatches by hand,
add the new one.

**Spacing and sizing tokens skip step 3's hand-editing.** Their numbers live once, in `space` /
`size` in `semantic.ts`; `tokens/spacing-vars.ts` derives the `--space-*` / `--size-*` properties,
`theme/config.ts` spreads them into both theme maps, and `tailwind.config.js` references the property
by name only. Add the number in `semantic.ts`, mirror the derived line into both `global.css` blocks,
and add the key name to `SEMANTIC_SPACING_KEYS`. `spacing-tokens.test.ts` and
`config.completeness.test.ts` fail if any of the three drifts.

## Elevation System

Levels -2 to +5 with calculated surface colors and shadows:

- **-2, -1**: Inset (inputs, pressed states)
- **0**: Base level
- **1-3**: Cards, panels
- **4-5**: Modals, overlays
