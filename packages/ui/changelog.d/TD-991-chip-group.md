---
section: Added
---

`ChipGroup` (`ui/chip-group`) is a single-select filter row of chips with optional counts. It is a
`radiogroup` with `value` / `defaultValue` / `onValueChange`, arrow-key selection and one Tab stop.
`overflow="scroll"` keeps one row, pins the first chip and scrolls the selected chip into view;
`wrap` flows onto more rows. A pressable `Chip` inside the group renders as a radio and carries a
44px hit box that stops at its neighbour (TD-991).
