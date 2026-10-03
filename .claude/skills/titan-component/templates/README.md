# <Family>: component family

TEMPLATE for `src/components/custom/<Family>/README.md` (a domain family) or a shell app folder.
Delete this line. A domain-free component goes in `ui/` and gets a row in `ui/README.md` instead.

One paragraph: what the family is and where it sits. Placement rules: `CLAUDE.md` > Placement.

This README is the index. It maps each component's dependencies (**composes ↓**) and consumers
(**used-by ↑**) so the tree navigates both ways and a hand-rolled element that should have used a
primitive is visible. Each component's autodocs page repeats its Composes links.

## Composition tree

```
<Organism> ............... organism
├─ <MoleculeA> ........... molecule: Indicator + Typography
├─ <MoleculeB> ........... molecule: Icon
└─ <SubOrganism> ......... organism
   └─ <MoleculeC> ........ molecule
```

## Dependency map

| Component     | Tier     | Composes ↓                        | Used-by ↑                  |
| ------------- | -------- | --------------------------------- | -------------------------- |
| `<Organism>`  | organism | MoleculeA, MoleculeB, SubOrganism | app root                   |
| `<MoleculeA>` | molecule | Indicator, Typography             | Organism, `<other family>` |

## Shared primitives introduced here

- `<primitive>`: what it is and why it has two consumers (or the explicit note that justifies it).

## Reuse audit

| Concern             | Uses                     | Not                    |
| ------------------- | ------------------------ | ---------------------- |
| status dots         | `Indicator`              | raw dots               |
| mono or caps text   | `Typography` `monoLabel` | ad-hoc `font-mono`     |
| colours and spacing | semantic token classes   | raw hex, magic numbers |

Watch-list: anything still hand-rolled, and the primitive it should adopt.

## Testing

Unit tests per component (`*.test.tsx` with a jest-axe test). Layers and baselines:
`docs/test-layers.md`.
