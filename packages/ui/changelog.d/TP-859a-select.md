---
section: Changed
---

`Select`'s placeholder moves from `text-tertiary` to `text-secondary`, which passes AA on the dark plane where tertiary did not. This affects every Select that shows a placeholder. `Select` gains two optional props: `size` (`SelectSize`, `sm | md | lg`), which uses Input's control heights so a Select sits level with an Input, and `isClearable` (default `true`), which hides the clear button when set to `false`. With neither prop set, the trigger renders as before (TP-859a).
