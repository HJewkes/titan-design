---
section: Fixed
---

Pressing a node in `NetworkGraph` or `DependencyGraph` focuses it again when the graph sits partly below the fold, as in a long docs page at desktop width. The graph moved focus to its root with a plain `focus()`, which scrolled the page between the press and the release, so the release landed on another element and no click reached the node. Focus now moves with `preventScroll`, so the page stays put (TD-1024).
