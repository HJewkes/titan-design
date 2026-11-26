---
section: Added
---

`TaskTable` takes `onTaskPress` and `getTaskHref`; when either is set each task id renders as a `Link`, a real anchor on web with `onPress` owning client routing. With neither, the id stays plain text (TD-1088).
