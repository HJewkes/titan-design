# Verify checklist

Run in order. Put each test in the cheapest layer that can fail for the reason you care
about: docs/test-layers.md.

1. Place and shape the test file: packages/ui/docs/render-testing-pattern.md > Where a new
   component's test goes. Locations are `ui/{name}/ComponentName.test.tsx` and
   `custom/{Name}/Name.test.tsx`.
2. Include an axe test: CLAUDE.md > Component Development > Testing Pattern.
3. Cover render, each variant, size and colour prop, event handlers, disabled and loading
   states, and compound sub-components.
4. Do not assert `toHaveClass`; NativeWind compiles `className` to style. Assert text,
   roles and structure. To check a token choice, compare `var()` references with
   `resolveColor`; to assert a hex, see CLAUDE.md > Gotchas (`resolveColor`).
5. On web, assert a disabled `Pressable` with `aria-disabled="true"`; `toBeDisabled()`
   works only on native form elements.
6. Use `fireEvent.change(el, { target: { value } })`; `changeText` is native only.
7. `accessibilityState.expanded` and `.checked` do not map to `aria-expanded` or
   `aria-checked` in react-native-web; assert what renders.
8. When nested elements share a role, use `getAllByRole()` and pick an index.
9. For a tooltip hover, fire `mouseEnter` on the Pressable wrapper found with
   `closest('[tabindex]')`.
10. Disable `aria-required-attr`, `aria-input-field-name` or `aria-required-parent` in axe
    only for a known react-native-web artifact, never for a real component issue.
11. `onLayout` does not fire in jsdom; cover container-responsive breakpoints in a visual
    or interaction layer.
12. Check coverage against the thresholds: CLAUDE.md > CI and scripts.
13. Decide the visual layer: packages/ui/docs/render-testing-pattern.md > The three visual
    layers. A green visual check is not verification unless a baseline or assertion covers
    the component; name it.
14. Refresh Layer-1 baselines only from the CI artifact: CLAUDE.md > Gotchas. Gitignore
    `tests/visual/results/`.
15. For a spacing change, assert geometry in vitest and read computed values in an
    isolated Storybook: TOKENS.md section 5 and packages/ui/docs/render-testing-pattern.md.
16. For a frozen-prototype port, confirm the specimen page `CompareRow` or `ComparisonPair`
    entry shows no diff against the HTML ground truth column.
17. Run the gates from the repo root: CLAUDE.md > CI and scripts (`pnpm lint`,
    `pnpm type-check`, `pnpm format:check`, `pnpm build`, tests, arch-graph freshness).
18. Run the functional gate before Gate 2: SKILL.md > Definition of done.
