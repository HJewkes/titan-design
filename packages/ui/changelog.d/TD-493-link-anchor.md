---
section: Changed
---

On web, `Link` and `BreadcrumbItem` given an `href` render a real `<a href>`, so middle, ctrl and meta clicks open a new tab and the address can be copied. A plain click still calls `onPress`, which then owns navigation; `isExternal` adds `target="_blank"` and `rel="noopener noreferrer"`; a disabled `Link` renders no `href`. Without `href`, and on native, both are unchanged (TD-493).
