# Agent Prompt Template: Component Implementation

Pre-built prompt for dispatching an implementation agent against a single
component (or a batch of 3-4 — see "Batching" below) in the HTML-to-React
extraction pipeline. Fill in the placeholders in **Dispatch Inputs**, then
paste the whole "Prompt to Send" block to the agent.

This template implements TD-06.03 and is grounded in the two upstream
artifacts of the pipeline:

- **TD-06.01** — the CSS property manifest schema:
  `packages/ui/src/theme/manifest/css-property-manifest.schema.json`
  (example instance: `packages/ui/src/theme/manifest/css-property-manifest.example.json`)
- **TD-06.02** — the extraction script that produces manifest instances from a
  frozen HTML prototype: `packages/ui/scripts/extract-css-properties.mjs`
  (`node packages/ui/scripts/extract-css-properties.mjs <html> <selector> <component> --out <file>`)

For the process this prompt fits into, see the pipeline's Stage 6 ("Build +
Test" → "Agent dispatch for implementation") in the source methodology doc,
`docs/improved-workflow.md` in the sibling `voltras` repo — the visual
fidelity preamble and DO NOT list below are carried forward from it.

---

## Dispatch Inputs

Before dispatching, gather:

1. **Component name(s)** — matching the `component` field in its manifest and
   its `src/components/{ui|custom}/{ComponentName}/` directory.
2. **CSS property manifest JSON** — either the frozen file under
   `packages/ui/src/theme/manifest/` for that component, or freshly generated
   via `extract-css-properties.mjs` against the frozen HTML prototype.
3. **HTML ground truth** — the component's entry in
   `packages/ui/specimen/comparison.tsx` (the `htmlContent` string passed to
   its `ComparisonPair`) or `packages/ui/specimen/scaffold.tsx`'s `CompareRow`
   usage. This is the exact markup/CSS the React output must match.
4. **Token mapping reference** — `packages/ui/src/theme/tokens/semantic.ts`
   (token → value) and `packages/ui/src/theme/global.css` (token → CSS
   custom property), plus the "Design Tokens" table in the repo root
   `CLAUDE.md`.

## Batching

Per the pipeline's dispatch pattern, batch 3-4 related components per agent
(e.g. all atoms in one family) rather than dispatching one agent per
component or one agent for an entire catalog page. Repeat the "Prompt to
Send" block per component within the batch; do not merge multiple
components' CSS manifests into a single JSON block.

---

## Prompt to Send

```
CRITICAL: This is a visual fidelity task, not a creative implementation task.
Your job is to produce a React component that renders identically to the
HTML ground truth below.

Component: {COMPONENT_NAME}
Location: packages/ui/src/components/{ui|custom}/{COMPONENT_NAME}/

## CSS property manifest (ground truth values, TD-06.01 schema)

{PASTE CSS_PROPERTY_MANIFEST_JSON HERE — a
 packages/ui/src/theme/manifest/*.json instance, or the output of
 `node packages/ui/scripts/extract-css-properties.mjs <html> <selector> {COMPONENT_NAME}`.
 Every "resolvedValue" is a literal getComputedStyle value that your
 implementation's computed styles must match exactly. Every non-null
 "token"/"cssVariable" pair identifies which semantic token to style with —
 use the token, not the literal, so it themes correctly; only fall back to a
 literal when the manifest itself has token: null.}

## HTML ground truth (specimen page, packages/ui/specimen/comparison.tsx)

{PASTE the component's `htmlContent` string / CompareRow markup here.}

## Token mapping reference

Resolve every token referenced above against:
- packages/ui/src/theme/tokens/semantic.ts (token key → value, dark + light)
- packages/ui/src/theme/global.css (--color-* custom property → value)
- CLAUDE.md "Design Tokens" table (semantic class names)

Do NOT hand-pick a Tailwind color/spacing class that looks close — resolve
the manifest's token to its actual semantic class (e.g. brand-primary →
bg-brand-primary / text-brand-primary), and cross-check the rendered
computed value against resolvedValue.

## DO NOT

- Do NOT substitute emoji for SVG icons.
- Do NOT use the bare `border` Tailwind/NativeWind class without an explicit
  color class — on web it defaults to a 1px black border. Always pair with a
  color class (`border border-border-default` at minimum) or set
  borderWidth/borderColor via inline style when the manifest specifies exact
  values.
- Do NOT use CSS `ease-out` (or any built-in easing keyword) when the ground
  truth specifies a custom cubic-bezier or transition value — copy the exact
  curve.
- Do NOT approximate values. Use the exact px, exact hex/rgb, and exact
  font-family from the manifest's resolvedValue and the HTML ground truth —
  not a "close enough" Tailwind scale step.

## DO

- Copy CSS values directly from the manifest and the HTML ground truth.
- Use React Native primitives (View, Text, Pressable — never div/span/button)
  per CLAUDE.md's cross-platform rules, styled so their web output matches
  the ground truth's computed styles.
- Use inline styles (or NativeWind arbitrary values) for any property the
  manifest pins to a value with no matching semantic token/class, especially
  borders — avoid the bare `border` class.
- Verify with computed styles, not visual inspection: after building, the
  component's rendered output in packages/ui/specimen/ should match the
  HTML column's getComputedStyle for every property in the manifest.
- Use `lucide-react-native` for icons (not `lucide-react`).

## Verification (run before returning)

cd packages/ui
pnpm lint
pnpm type-check
pnpm test -- --run {COMPONENT_NAME}
```

---

## Known Pitfalls

Carried forward from prior sessions (see `docs/improved-workflow.md` in the
sibling `voltras` repo, "Preventing Known Failure Modes"):

- `border` class defaults to black on web if the color token doesn't
  resolve — always pair with a color class or use inline styles.
- `rounded-sm` = 4px in the titan-design theme, not Tailwind's default 2px.
- `font-body` = Nunito Sans, `font-sans` = Inter — do not swap them; check
  `packages/ui/src/theme/tokens/semantic.ts` and `global.css`, not memory.
- Use `lucide-react-native`, not `lucide-react`.
- Use the exact easing curve from the manifest/ground truth, never CSS
  `ease-out` as a stand-in.
