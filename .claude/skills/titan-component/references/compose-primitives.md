# Compose shared primitives

Every leaf of a component composes an existing primitive, or becomes one. This file owns three
of the four process rules and the primitive map. Which token to pick is `packages/ui/TOKENS.md`;
read it as well, because composing the right primitive does not pick the right token.

## The process rules

1. **Reuse, never parallel.** If a component or primitive does the job, or nearly does it,
   compose or extend it. Never build a second one beside it. Extend backward-compatibly: new
   optional props or variants, with the plain path kept as the default. Gate 1 decides whether
   to invest at all (SKILL.md > Gate 1); this rule applies to every leaf after that.
2. **Domain numbers are props.** Thresholds, ranges, targets, counts and units arrive as props.
   Never bake one into the component, even when the first consumer has only one value. A baked
   number makes the component single-use and hides a control the story should expose.
3. **Prior art before a new family.** Before creating a family directory, find the nearest
   existing family and the nearest components in `src/arch/arch-graph.json`, `ui/README.md` and
   `packages/ui/REJECTED.md`. Name them in the Round 0 contract (`round0-contract.md` >
   Considered existing). Present the nearest one as a render, by the fourth rule
   (`review-rounds.md` > Show, do not describe).

## Which primitive for which job

| Job                              | Compose                                                        | Not                                    |
| -------------------------------- | -------------------------------------------------------------- | -------------------------------------- |
| a status dot or indicator        | `Indicator` (`color`, `pulse: true \| 'ping'`, `glow`, `ring`) | a raw `View` dot, or a third dot       |
| a divider                        | `Divider` (`orientation`; override colour through `className`) | a hairline `View`                      |
| any text, mono or all-caps label | a `Typography` variant (TOKENS.md section 4)                   | raw `Text` with font classes           |
| a glyph                          | `src/components/icons` (`SvgIcon` base and the set)            | a unicode character or an inline `svg` |
| a gradient                       | `theme/gradients` (`linearGradient`, `surfaceGradient`)        | an inline `linear-gradient` string     |
| a raised or floating plane       | `Surface` or `Card` (`gotchas.md` > Depth is tone plus lift)   | a hand-rolled shadow or border ring    |
| a colour, space or radius value  | TOKENS.md sections 1 to 5                                      | a literal                              |

`StatusDot` in `custom/Workout` carries workout semantics. For a generic status, use `Indicator`.

## Promote a reusable leaf

A reusable leaf belongs at the top level, not buried in a family folder. To promote one:

1. Create the primitive in its tier: CLAUDE.md > Component Development > Placement.
2. Move the definitions.
3. Re-export from the old path so consumers and specimens keep building. Check that the old
   location is not also exported from the root barrel, or the name is exported twice.
4. Export it from its family barrel: CLAUDE.md > Gotchas (arch graph).
5. Repoint the consumers.
6. Give it its own story and tests: `story.md` and `verify.md`.
7. Update the family README reuse audit.

## The reuse audit

Before Gate 2, the family README reuse audit (`story.md` step 10) maps every leaf to the
primitive it composes. A leaf with no primitive is promoted, or it goes on the README
watch-list with a ticket.
