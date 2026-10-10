# Gotchas

Code and tooling traps that each cost a review round or a CI cycle. Traps that CLAUDE.md >
Gotchas states are not repeated here, and test-writing traps live in `verify.md`.

## Contents

- [Token files take additive edits only](#token-files-take-additive-edits-only)
- [Pulse is opacity, ping is a ring](#pulse-is-opacity-ping-is-a-ring)
- [Gradients need a native fallback](#gradients-need-a-native-fallback)
- [react-native-web keeps labels and drops state and hints](#react-native-web-keeps-labels-and-drops-state-and-hints)
- [Responsive means container-driven](#responsive-means-container-driven)
- [Barrels and back-compat](#barrels-and-back-compat)
- [Storybook ids and booting](#storybook-ids-and-booting)
- [A heading variant changes the DOM element](#a-heading-variant-changes-the-dom-element)
- [HTML-specimen dimensions lie](#html-specimen-dimensions-lie)
- [A specimen renders at the true size with tokens](#a-specimen-renders-at-the-true-size-with-tokens)
- [The Storybook launcher and unverified flags](#the-storybook-launcher-and-unverified-flags)
- [Depth is tone plus lift](#depth-is-tone-plus-lift)
- [NativeWind ignores className on Animated.View](#nativewind-ignores-classname-on-animatedview)
- [Uneven end-cell padding reads as clipping](#uneven-end-cell-padding-reads-as-clipping)
- [dist-export-parity needs a fresh build](#dist-export-parity-needs-a-fresh-build)
- [A frozen clock keeps ticking until paused](#a-frozen-clock-keeps-ticking-until-paused)

## Token files take additive edits only

The order of the token chain is CLAUDE.md > Design Tokens > Adding New Tokens, and the
formatting rule is CLAUDE.md > Gotchas. If a reformat slips into a token file anyway, restore it
with `git checkout HEAD -- <file>` and re-add your lines; `config.completeness.test.ts` names
every `--color-*` property that went missing. Then run `pnpm exec vitest run src/theme`.

## Pulse is opacity, ping is a ring

Animate with the Tailwind utilities through `className`: `animate-pulse` fades opacity
(`Skeleton`). For an expanding ring, render an absolutely positioned `animate-ping` layer behind
the solid dot, as `Indicator` does with `pulse: 'ping'`. A `@keyframes` box-shadow ring from an
HTML prototype does not port to native.

## Gradients need a native fallback

`backgroundImage` is web-only and React Native ignores it. A gradient from `theme/gradients`
needs a solid `bg-*` className beside it for native. How to resolve the colours is TOKENS.md
section 3.

## react-native-web keeps labels and drops state and hints

In react-native-web 0.19.13 (`packages/ui/node_modules/react-native-web/dist/cjs/modules/createDOMProps/index.js`):

- `aria-label` and `accessibilityLabel` always reach the DOM as `aria-label` (lines 425-427;
  `aria-label` wins when both are set). A missing label is never a mapping problem.
- `accessibilityState` is silently dropped. `View` forwards only the props in its allow-list
  (`exports/View/index.js:38`, built from `modules/forwardedProps`), and `accessibilityState`
  is not in it, so `expanded`, `selected` and `checked` never become `aria-*`.
- `accessibilityHint` has no mapping in `createDOMProps` and is dropped the same way.

Pass the direct `aria-*` props, which all map (`Tabs.tsx` passes `aria-selected={isActive}`,
`Select.tsx` passes `aria-expanded={isOpen}`). The `PopoverTrigger` a11y failure was a missing
`role="button"`, not a dropped label. `src/test/rnw-aria-mapping.test.tsx` pins all of this, so a
react-native-web upgrade that changes it fails there first. Also see verify.md step 7.

## Responsive means container-driven

Responsiveness comes from the container, not from fixed size props. Measure width in
`onLayout` and derive breakpoints from it. Because `onLayout` does not fire in jsdom (verify.md
step 11), expose explicit `showX` overrides so unit tests can reach each layout.

## Barrels and back-compat

- A new exported type goes in the component's `index.ts` too; a consumer importing it fails
  until it does.
- Moving or promoting code keeps a re-export at the old path (`compose-primitives.md` >
  Promote a reusable leaf).

## Storybook ids and booting

- A story id is the kebab-case title plus `--story` (docs pages: `--docs`). A non-ASCII
  character such as a middle dot in a title mangles the id, so titles stay ASCII. Read the real
  ids from `/index.json` on your own port.
- Storybook boots through the react-native-svg web resolution and the NativeWind `.js` to JSX
  esbuild loader in the Vite and Storybook configs. When no story renders, check that chain
  before the component.

## A heading variant changes the DOM element

`Typography` `h1` to `h6` set `accessibilityRole="header"`, so react-native-web renders a
heading element instead of the plain `div[dir="auto"]` of body text. A Layer-3 parity selector
that matches `div[dir="auto"]` then stops matching, and Layer 3 does not run in the default
vitest pass, so it fails only in CI. Pick a variant for its semantics. For the weight or face
alone, take a body variant and add the font class, and assert that no `heading` role renders.

## HTML-specimen dimensions lie

A throwaway HTML gallery renders at different pixel sizes from its nominal CSS: a flex child
compresses, and everything sized against it shifts. Build React-first, so the specimen is the
component. When HTML work is unavoidable, measure the render on both the reference and the
component with `tools/measure-render.mjs` (it reads `getBoundingClientRect` and pseudo-element
computed styles). Never trust the CSS values.

## A specimen renders at the true size with tokens

- Grep the real component for its dimensions before mocking it. A study at several times the
  real size decides nothing; add a magnified copy for review beside the true-size one.
- Colour comes from semantic tokens through the primitives, never a guessed hex. Surfaces are
  chosen by `Surface` or `Card`, never a literal ramp step. An animated colour that
  `Animated.interpolate` must read is one of the few places a resolved value is legitimate,
  because it cannot read a `var()`.

## The Storybook launcher and unverified flags

`storybook-launch.mjs` passes an unknown flag through to `storybook dev`, which rejects it only
after the launcher has already reclaimed the locked port, killing another tree's server. Use
only the scripts in CLAUDE.md > Quick Reference > Storybook ports. They live in
`packages/ui/package.json`, not the root, so `cd packages/ui` first; never retry a root failure
with a guessed flag.

## Depth is tone plus lift

Every container plane is a step on the grey ramp, and a raised plane also carries the lift: a
top rim light plus an ambient shadow that grows with the planes crossed (`liftStyle` in
`theme/lift.ts`). Compose `Surface` (`raise`, `elevation`, `pressed`) or `Card` and let them
pick both. Reach for `getElevationSurface`, `getElevationShadow` or `liftStyle` only for a
`Pressable` or a fill off the ramp. Floating panels (menu, popover, tooltip, toast, modal,
drawer, dropdown) sit at elevation 4 or 5 with no hairline ring; edges belong to dividers, table
rules and the opt-in `Card` outline. Glow is emphasis, not depth: `getGlowShadow`.

## NativeWind ignores className on Animated.View

An `Animated.View` with spacing classes renders with none, and a test that reads the class off
the source still passes. Space an animated element with the JS export (`space.*`) and grep for
`<Animated.View` before a spacing migration.

## Uneven end-cell padding reads as clipping

Insetting an axis by half a column leaves the outer cells half a gap from the edge while inner
cells get a full gap, and the result looks cut off. Inset by half a column plus half a gap.
Measure before touching overflow.

## dist-export-parity needs a fresh build

`src/test/dist-export-parity.test.ts` compares `dist/index.d.ts` with `dist/index.mjs` and skips
when `dist/` is absent, so a stale `dist/` gives a stale verdict. Run `pnpm build`, then the
test. When rollup-plugin-dts drops `type` through a multi-hop re-export and a pure type shows up
bare, add it to `KNOWN_TYPE_ONLY_BARE_NAMES` in that test. A real value missing from `.mjs` is a
bug, not an allow-list entry.

## A frozen clock keeps ticking until paused

In a Playwright story test, `page.clock.install({ time })` keeps advancing in real time. Follow
it with `page.clock.pauseAt(time)`, or a clock-driven story reads a minute late whenever the run
crosses a minute boundary.
