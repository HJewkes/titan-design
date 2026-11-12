# Component checklist

Run in order. Each step names the heading that owns the rule; read that heading, do not
rely on this line.

1. Confirm the operator recorded invest for this component: SKILL.md > Gate 1.
2. Pick the directory: docs/component-development.md > Placement.
3. Create the four files: docs/component-development.md > File Structure.
4. Use React Native primitives and `cn()`: docs/component-development.md > Cross-Platform First
   and Styling.
5. Compose existing primitives and follow the process rules: `compose-primitives.md`. The
   generic primitives are listed in `ui/README.md`; the type scale is TOKENS.md section 4.
6. Write the Round 0 contract before round 1: `round0-contract.md`.
7. Run the review rounds: `review-rounds.md`.
8. Name props: docs/component-development.md > Props Conventions.
9. Use slots and controlled-state names: docs/component-development.md > Placement
   (Slots paragraph).
10. Declare both themes explicitly: docs/component-development.md > Dark Mode.
11. Cover loading, empty, error and disabled states: docs/component-states.md > Checklist.
12. Add accessibility roles and labels: docs/component-development.md > Accessibility
    Requirements. A titled icon gets its name from `SvgIcon`'s `title` prop.
13. Export from the family barrel, add the `ui/README.md` row, and add the arch-graph node
    with `pnpm arch:graph -- --add <file>`: docs/component-development.md > Placement
    and Gotchas.
14. If the component ports a frozen HTML prototype, match it pixel for pixel and follow
    docs/agent-prompts/component-implementation.md (fidelity preamble, DO NOT list, CSS
    property manifest, token mapping). Done is then
    docs/component-implementation-checklist.md.
15. Go to `references/token.md` for any new token, then `references/story.md`.
