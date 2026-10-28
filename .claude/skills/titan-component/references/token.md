# Token checklist

Run in order. Skip the steps that need no new token; most components need none.

1. Choose an existing token first: TOKENS.md section 1 (palette), including the
   `result-*` against `status-*` distinction, and section 2 (categorical palette).
2. Resolve colour in code with `resolveColor`: TOKENS.md section 3.
3. Never use a `/n` modifier on a token for translucency: TOKENS.md section 3,
   Translucency.
4. Use the type scale and `Typography` variants: TOKENS.md section 4.
5. Use the spacing and radius scale or a semantic key, with `// optical:` only for a real
   optical exception: TOKENS.md section 5.
6. Add a new colour in four files, in order: docs/design-tokens.md > Adding New Tokens.
7. Add a spacing or sizing token: docs/design-tokens.md > Adding New Tokens (the
   spacing and sizing paragraph).
8. Edit token files additively and never run prettier over a whole one: docs/package-reference.md >
   Gotchas (`global.css` and `semantic.ts`).
9. Run `config.completeness.test.ts` and `spacing-tokens.test.ts`; they name the missing
   property: docs/design-tokens.md > Adding New Tokens.
10. Add the swatch to `Foundations/Color/Palettes` if it lists the category by hand.
11. Enrol a hardened family in the lint guardrails as the last step of hardening it:
    TOKENS.md section 6.
12. A new colour or hue the component needs is raised with the operator, not added inline:
    docs/component-development.md > Styling.
