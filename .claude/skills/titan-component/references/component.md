# Component checklist

Run in order. Each step names the heading that owns the rule; read that heading, do not
rely on this line.

1. Confirm the operator recorded invest for this component: SKILL.md > Gate 1.
2. Pick the directory: CLAUDE.md > Component Development > Placement.
3. Create the four files: CLAUDE.md > Component Development > File Structure.
4. Use React Native primitives and `cn()`: CLAUDE.md > Architecture > Cross-Platform First
   and Styling.
5. Compose existing primitives and follow the process rules: `compose-primitives.md`. The
   generic primitives are listed in `ui/README.md`; the type scale is TOKENS.md section 4.
6. Write the Round 0 contract before round 1: `round0-contract.md`.
7. Run the review rounds: `review-rounds.md`.
8. Name props: CLAUDE.md > Component Development > Props Conventions.
9. Use slots and controlled-state names: CLAUDE.md > Component Development > Placement
   (Slots paragraph).
10. Declare both themes explicitly: CLAUDE.md > Architecture > Dark Mode.
11. Cover loading, empty, error and disabled states: docs/component-states.md > Checklist.
12. Add accessibility roles and labels: CLAUDE.md > Component Development > Accessibility
    Requirements. A titled icon gets its name from `SvgIcon`'s `title` prop.
13. Export from the family barrel, add the `ui/README.md` row, and add the arch-graph node
    with `pnpm arch:graph -- --add <file>`: CLAUDE.md > Component Development > Placement
    and Gotchas.
14. If the component ports a frozen HTML prototype, match it pixel for pixel and follow
    docs/agent-prompts/component-implementation.md (fidelity preamble, DO NOT list, CSS
    property manifest, token mapping). Done is then
    docs/component-implementation-checklist.md.
15. Go to `references/token.md` for any new token, then `references/story.md`.
