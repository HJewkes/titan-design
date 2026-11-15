---
section: Fixed
---

`BodyMap` no longer logs React console errors about unknown `onResponder*` event handlers on web. The figure's SVG paths each carried an `onPress`, which react-native-svg turned into responder props on the DOM. On web the figure now takes taps from a click on the figure and reads the muscle from the clicked path, so taps still reach `onMusclePress` (TD-1077).
