---
section: Internal
---

The catalog freshness test builds the catalog once and compares it with the committed file per entry, naming each entry that differs. Mutation tests through the generator's `read` injection prove a story status change fails, a story args change passes, and an emptied `storyIds` fails (TD-352).
