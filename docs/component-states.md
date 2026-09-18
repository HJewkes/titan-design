# Component states

Every component documents and stories its **loading**, **empty**, **error** and **disabled**
states, or says why a state does not apply. A component that only renders its happy path hides the
states where consumers find bugs. A degenerate-data chart bug shipped in 0.17.0 this way (VW-414).

Walk this list once per component, before review.

## Checklist

For each of the four states, do one of two things:

- **It applies.** A prop or a data shape drives it, the `Default` story's controls or fixtures can
  reach it, and a test renders it and runs `axe` on it.
- **It does not apply.** Say so in one line in the component's autodocs description
  (`parameters.docs.description.component`) or in the JSDoc of its props, with the reason. For
  example: "No loading state: the consumer passes data that is already loaded."

| State        | Driven by                                                       | Compose, don't redraw                                                                         | Existing examples                                                                                                                            |
| ------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading**  | `isLoading` (not `loading`)                                     | `Skeleton`, `Spinner`                                                                         | `Table` swaps its rows for a skeleton; `Card` pulses and stops pointer events; `Button` shows an `ActivityIndicator` and reports `disabled`. |
| **Empty**    | The data: an empty array, or no value                           | `EmptyState` (icon, title, description, action); `TableEmptyState` inside a table             | `GoalTrajectoryChart` and `StrengthTrendChart` render a labelled placeholder instead of an empty plot.                                       |
| **Error**    | `isInvalid` + `errorMessage` on form controls                   | `FormField` shows `errorMessage` in place of the helper text; `Alert` for a message elsewhere | `isInvalid` on `Input`, `Select`, `Checkbox`, `Autocomplete`, `FormField`; `errorMessage` on `Input`, `Autocomplete`, `FormField`.           |
| **Disabled** | `isDisabled` (not `disabled`), reported as `accessibilityState` | —                                                                                             | `Button` sets `accessibilityState={{ disabled }}` for both `isDisabled` and `isLoading`.                                                     |

Components outside forms have no shared error prop. If such a component can fail to get its data,
state who renders the failure (usually the consumer, with `Alert`) rather than inventing a prop.

## Degenerate data counts as a state

"Empty" is the obvious case. A component that takes data also stories and tests the edge shapes
that data can take:

- one item, and all items equal (a flat series, a zero-width range);
- very large input (long labels, many rows, many series);
- a missing reference value (no baseline, no target);
- values that are not finite, if the data source can send them.

`GoalTrajectoryDegenerate.test.tsx` is the example to copy: a regression test for a goal whose
committed and stretch targets were the same number, which drew overprinted labels on an empty
plane.

## Where each state shows up

- **Story**: a control on the `Default` story (`isLoading`, `isDisabled`, `isInvalid` as boolean
  controls) or a fixture reachable through an `object` control. Do not add one story per state;
  see _Storybook Pattern_ in `CLAUDE.md`.
- **Test**: one test per applicable state, with an `axe` assertion.
- **Docs**: the prop's JSDoc, which Storybook autodocs shows, or the "does not apply" line.
