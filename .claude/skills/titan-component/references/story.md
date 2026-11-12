# Story checklist

Run in order. This file also replaces the former `storybook-dev` skill: the story pattern
is docs/component-development.md > Storybook Pattern, and the ports are
`docs/storybook-ports.md`. `docs/STORYBOOK_SETUP.md` covers framework
configuration.

1. Write one `Default` story driven by `args` and `argTypes`: docs/component-development.md > Storybook
   Pattern. Variants and states are controls, not extra stories. Drop scaffolding stories
   (a parts overview, a parity comparison) once they are redundant or locked.
2. Import from `@storybook/react-vite`, not `@storybook/react`: docs/component-development.md > Storybook
   Pattern.
3. Set the title group: docs/component-development.md > Storybook Pattern (Title). Nest a sub-family under the
   organism it belongs to, so the sidebar mirrors what is part of what.
4. Set tags: `autodocs` plus the status tag from packages/ui/MATURITY.md, with the
   `!status:review` negation.
5. Write the Composes line in `parameters.docs.description.component`, linking each story
   the component composes. A docs page id is the kebab title plus `--docs`; update the
   links when a title changes.
6. Render a layout organism in context: `layout: 'fullscreen'` and a decorator on `meta`
   that frames it as it lives. A vertical rail needs a `min-h-screen` flex-row frame so
   cross-axis stretch gives it full height.
7. Use a named PascalCase function for `render` when it calls hooks: docs/component-development.md > Storybook
   Pattern.
8. Escape quotes in JSX text: docs/component-development.md > Storybook Pattern.
9. Cover loading, empty, error and disabled states as controls, or say why one does not
   apply: docs/component-states.md > Where each state shows up.
10. Add the family `README.md` index: composes-down and used-by-up columns, shared
    substrates introduced, a reuse audit of every leaf against the primitive it composes,
    and a watch-list of known gaps. Copy the shape of `custom/Workout/README.md` or
    `shell/README.md`.
11. For a story under review, remove every rejected option before Gate 2: SKILL.md >
    Definition of done.
12. Start Storybook only through the launcher and verify provenance by something unique to
    your tree: docs/storybook-ports.md. Stop only the PID you started.
13. A broken story passes every gate; confirm the story count rose with the new story:
    docs/package-reference.md > Gotchas (`tsconfig.json` excludes stories).
