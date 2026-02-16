---
description: Add a new design token to the token system (all 4 required files)
user_invocable: true
---

# Add New Design Token

Add a new design token following the DTCG standard 4-file process. Ask the user for:
1. Token category (brand, status, text, surface, background, border, interactive, result, data)
2. Token name (e.g., `brand-tertiary`, `status-pending`)
3. Dark mode value
4. Light mode value

## Steps

1. **Update primitives.ts** (`packages/ui/src/theme/tokens/primitives.ts`):
   - Add raw color value if it's a new color not already in a scale
   - Follow existing scale patterns (50-950 for full scales)

2. **Update semantic.ts** (`packages/ui/src/theme/tokens/semantic.ts`):
   - Add to both `dark` and `light` objects under the correct category
   - Reference primitive values, not raw hex

3. **Update global.css** (`packages/ui/src/theme/global.css`):
   - Add CSS custom property to `:root` (dark mode default)
   - Add override in `.light` / `:root.light` block
   - Follow naming: `--color-{category}-{name}`

4. **Update tailwind.config.js** (`packages/ui/tailwind.config.js`):
   - Add to `theme.extend.colors` referencing the CSS variable
   - Format: `'var(--color-{category}-{name})'`

5. **Update Storybook** (if a Colors story exists):
   - Add the new token to the relevant color swatch story

6. **Verify**: Run `pnpm build` to ensure no build errors
