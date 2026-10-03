# Component checklist

Run in order. Each step names the heading that owns the rule; read that heading, do not
rely on this line.

1. Check the component does not exist: `src/arch/arch-graph.json`, `ui/README.md`,
   `packages/ui/REJECTED.md`. Extend a close primitive with optional props; do not fork it.
2. Pick the directory: CLAUDE.md > Component Development > Placement.
3. Create the four files: CLAUDE.md > Component Development > File Structure.
4. Use React Native primitives and `cn()`: CLAUDE.md > Architecture > Cross-Platform First
   and Styling.
5. Compose existing primitives (Typography, Indicator, Divider, icons, gradients) instead
   of hand-rolling; TOKENS.md section 3 and `ui/README.md` list them. Promote a reusable
   leaf element to a top-level primitive, re-export from the old path, and repoint consumers.
6. Take domain numbers (thresholds, ranges, counts) as props; never bake them in.
7. Look for prior art before starting a new family, and show the nearest existing
   component to the operator rather than describing it.
8. Name props: CLAUDE.md > Component Development > Props Conventions.
9. Use slots and controlled-state names: CLAUDE.md > Component Development > Placement
   (Slots paragraph).
10. Declare both themes explicitly: CLAUDE.md > Architecture > Dark Mode.
11. Cover loading, empty, error and disabled states: docs/component-states.md > Checklist.
12. Add accessibility roles and labels: CLAUDE.md > Component Development > Accessibility
    Requirements. Name an svg with `<title>`: react-native-web drops `aria-label` on
    non-accessible Views.
13. Export from the family barrel, add the `ui/README.md` row, and update only
    `componentBarrelHash`: CLAUDE.md > Component Development > Placement and Gotchas.
14. If the component ports a frozen HTML prototype, match it pixel for pixel and follow
    docs/agent-prompts/component-implementation.md (fidelity preamble, DO NOT list, CSS
    property manifest, token mapping). Done is then
    docs/component-implementation-checklist.md.
15. Go to `references/token.md` for any new token, then `references/story.md`.
