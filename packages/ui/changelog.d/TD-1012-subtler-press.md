---
section: Changed
---

`Button` presses with `scale(0.99)` over 100 ms (was `scale(0.98)` over 150 ms) on every solid, outline and ghost colour and on icon buttons; a link, a disabled or loading button, and any button under `prefers-reduced-motion` keep the colour step and do not move. A `Card` with `onPress` takes its pressed state from its own press events instead of CSS `:active`, so a press that starts on a nested control no longer scales the card. It sets `data-pressed` on web, and under reduced motion it neither lifts on hover nor scales on press (TD-1012).
