# Shelf API note

A design note for `ui/shelf/` (story `Components/Molecules/Shelf`), written for TD-990.

## Purpose

A horizontal row of same-width items that the reader scrolls past: a date's worth of videos, a
series, a set of related records. It snaps item by item, the next item peeks at the trailing edge,
and a round nudge at each end moves a pointer user along without a trackpad. The caller owns the
heading, any count above the row, and the empty state.

## Why this is not Carousel

`Carousel` and `Shelf` both scroll a row of cards sideways with snap, so the question is whether
`Shelf` should be a `Carousel` option. It should not, because the two answer different questions.

- **One current item versus a window of many.** A carousel has a current slide: one card per view,
  centred, with a `value` / `onValueChange` pair, a "2 of 9" position and previous / next buttons
  that move by one. A shelf has no current item. Several items show at once, the row moves by most
  of a column, and nothing is selected by scrolling.
- **Different accessibility pattern.** `Carousel` follows the WAI-ARIA APG carousel pattern
  (`aria-roledescription="carousel"` and `"slide"`, a live position). A shelf is a labelled group
  holding a list; announcing "slide 3 of 9" for one card among four in view would be wrong.
- **Different geometry.** `Carousel` sizes the slide from the column (the column minus a hint of
  each neighbour) and centres it. A shelf takes a fixed `itemWidth`, or one per breakpoint, aligns
  items to the column's start, and lets the row bleed into the page gutter.
- **Different controls.** `Carousel` always shows its arrows under the cards. The shelf nudge sits
  over the row's ends, appears only on a wide column whose row overflows, and is absent on a phone,
  where a swipe is the control.
- **Carousel carries machinery a shelf does not need.** Looping clones, drag-to-scroll, settle
  tracking and controlled-value sync are most of Carousel's code. A shelf needs none of them.

Folding both into one component would put a mode flag in front of two prop sets that never apply
together. They share only the web snap CSS, a few lines that each keeps beside its own geometry.

## Props

- `label`: the row's accessible name, usually the heading above it.
- `itemWidth`: a number in px, or a map from breakpoint (`xs`, `sm`, `md`, `lg`, `xl`, from
  `primitiveBreakpoints`) to width. The map is read against the shelf's own measured column, not
  the window, so a shelf inside a narrow pane picks the narrow width. Item width is component
  geometry, so it is a number rather than a spacing token.
- `bleed`: `none`, `sm` or `md`, matching the page `gutter` token. The scroller extends that far
  past the column on each side, with the same content padding and `scroll-padding`, so items rest
  on the column edge and scroll out at the screen edge.
- `nudge`: `auto` (default), `always` or `never`. `auto` shows the arrows when the column is at least
  `nudgeFrom` wide (default `md`) and the row overflows. Neither mode shows an arrow that has nowhere
  to go: the back arrow appears once the row has moved, and the forward arrow hides at the end.
- `nudgeFrom`: the narrowest column `auto` shows the arrows on. A consumer that switches to a grid at 900 px
  and shows shelves below it passes `nudgeFrom="sm"`, so tablet widths get the arrows.

## Behaviour

- **Snap.** CSS `scroll-snap-type: x mandatory` with `scroll-snap-align: start` on web,
  `snapToInterval` on native.
- **Nudge.** Moves by the whole items that fit in 0.8 of the column (at least one), onto an item
  start, clamped to the row's ends (`nudgeTarget`).
- **Focus.** When focus enters an item that is not whole inside the column, the row scrolls to that
  item's snap point (`revealTarget`). An item already whole stays put.
- **Re-renders.** The scroll offset lives in a ref. Only reaching or leaving an end changes state,
  so scrolling does not re-render the items.

## States

- **Empty**: no items renders nothing. The caller decides whether to show `EmptyState` or drop the
  heading too.
- **Loading**: none of its own. Pass loading items, for example `Card isLoading`.
- **Error**: does not apply. The caller that failed to load the row renders an `Alert`.
- **Disabled**: does not apply to a row. Each item carries its own `isDisabled`.

## Accessibility

Items should hold their own focus target, such as a pressable card. A row of inert items cannot be
reached by keyboard, and the shelf does not add a Tab stop of its own. The nudge buttons have a 44 px
hit box and are named "More from {label}" and "Back in {label}".
