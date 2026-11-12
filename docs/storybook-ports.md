# Storybook ports — read this before screenshotting anything

`storybook dev` **auto-increments off a busy port**. A launch on a port you believed was
free silently lands on a _different worktree's_ server, and every screenshot taken
afterwards is plausible and wrong. This has already invalidated a VW-85 evidence set, and
verifying `index.json` does not catch it — `importPath` is relative and identical across
worktrees.

Port 6006 is **locked**. `pnpm storybook` runs a launcher that owns the policy:

| command                   | behaviour                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm storybook`          | Locked port. Reuses ours; **kills a foreign server squatting 6006**; refuses if a non-Storybook holds it. |
| `pnpm storybook:isolated` | A private port from 6100–6199. Use when you _expect_ to run beside another instance.                      |
| `pnpm storybook:ports`    | Inventory only — every server, categorised, with the flag that would clear it.                            |
| `pnpm storybook:reap`     | Kill **orphans** (the default scope), then re-list.                                                       |
| `pnpm storybook:reap:all` | Kill orphans + foreign + dupes.                                                                           |
| `--restart`               | Replace our own server on the locked port.                                                                |

`pnpm storybook:ports` categorises every server, and the categories **are** the reap
scopes — so the inventory doubles as a menu of what each option would kill:

| category  | meaning                               | cleared by         |
| --------- | ------------------------------------- | ------------------ |
| `locked`  | ours, on 6006                         | `--restart`        |
| `orphan`  | its worktree no longer exists on disk | `--reap` (default) |
| `foreign` | a live server rooted in another tree  | `--reap=foreign`   |
| `dupe`    | ours, off the locked port             | `--reap=dupes`     |
| `other`   | not identifiable as Storybook         | never touched      |

Scopes combine: `--reap=foreign,dupes`. `--reap=all` is everything reapable.

**Orphans are the default because they are the only category that is unambiguously
dead** — nobody can be using a server whose tree has been deleted. A live `foreign`
server may belong to a parallel agent, and a `dupe` may be a deliberate `--isolated`
instance, so both are opt-in.

Every launch passes `--exact-port`, so a port conflict is a **loud failure** instead of a
silent move. Proof: on a busy port, `--exact-port` refuses to start; without it, Storybook
quietly comes up one port over.

**Verify provenance by something unique to the tree you meant to shoot** — a story that
only exists there, or a rendered detail only that commit produces. Never by story IDs alone.

**Stop only the servers you started, by PID.** Record the PID of any server you start (Storybook,
Vite, `pnpm review`) and stop that PID when you are done. Never kill by name pattern
(`pkill -f storybook`, `killall node`): other sessions run servers in this repo at the same time,
and in September 2026 a name-pattern kill took down the Storybook behind a live review round. To
list what is running, use `pnpm storybook:ports`; `pnpm storybook:reap` stops orphans only. Plain
`pnpm storybook` replaces a foreign server on 6006, so use `pnpm storybook:isolated` when another
session may be using 6006.
