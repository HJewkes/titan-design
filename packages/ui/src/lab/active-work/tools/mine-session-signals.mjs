#!/usr/bin/env node
/* eslint-disable no-undef -- Node ESM build tool */
/**
 * mine-session-signals.mjs — a deterministic, one-pass extractor for the FULL
 * signal surface of Claude Code session transcripts, scoped to one repo.
 *
 * Beyond file touches it pulls out the cross-session assets and metrics that let
 * you navigate engineering history: PRs, branches, commits/pushes, files, tasks,
 * subagents, artifacts, and per-session derived metrics (tokens, errors, turn
 * durations, compaction points, decisions, mode phases) — every asset carrying
 * back-references to the sessions/turns that touched it.
 *
 * Deterministic: same transcripts in → same output. Streams line-by-line.
 *
 * Usage: node mine-session-signals.mjs --repo <absoluteRepoPath> [--top N] [--out file.ts]
 */
import { promises as fs, createReadStream } from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import os from 'node:os';

const IGNORE = /(^|\/)(node_modules|\.git|dist|build|\.next|coverage|\.turbo|storybook-static)(\/|$)/;
const TASK_ID = /\b([A-Z]{1,5}-\d+)\b/;

function parseArgs(argv) {
  const a = { repo: null, top: 80, out: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--repo') a.repo = argv[++i];
    else if (argv[i] === '--top') a.top = Number(argv[++i]);
    else if (argv[i] === '--out') a.out = argv[++i];
  }
  return a;
}

async function transcripts() {
  const root = path.join(os.homedir(), '.claude', 'projects');
  const dirs = await fs.readdir(root);
  const out = [];
  for (const d of dirs) {
    let fl;
    try {
      fl = await fs.readdir(path.join(root, d));
    } catch {
      continue;
    }
    for (const f of fl) if (f.endsWith('.jsonl')) out.push({ dir: d, file: path.join(root, d, f) });
  }
  return out;
}

/** Strip leading `cd X && …` so we reach the real command verb. */
function realCmd(c) {
  if (typeof c !== 'string') return '';
  let s = c.trim();
  for (let i = 0; i < 4; i++) {
    const m = s.match(/^cd\s+[^&;]+(?:&&|;)\s*/);
    if (m) s = s.slice(m[0].length).trim();
    else break;
  }
  return s;
}

function ensure(map, key, make) {
  let v = map.get(key);
  if (!v) map.set(key, (v = make()));
  return v;
}

async function mine({ repo, topN }) {
  const repoName = path.basename(repo);
  const repoTail = '/' + repoName + '/'; // for prRepository "owner/repo" match
  const sessions = new Map();
  const prs = new Map(); // number -> rec
  const branches = new Map(); // name -> rec
  const files = new Map(); // relpath -> rec
  const tasks = new Map(); // id -> rec
  const subagents = [];
  const artifacts = [];
  let events = 0;
  let turnDurations = [];

  const sess = (id) =>
    ensure(sessions, id, () => ({
      id,
      dir: null,
      aiTitle: null,
      seedPrompt: null,
      bridgeSessionId: null,
      firstTs: null,
      lastTs: null,
      turns: 0,
      userPrompts: 0,
      version: null,
      branches: new Set(),
      prs: new Set(),
      tasks: new Set(),
      fileTouches: 0,
      tokensIn: 0,
      tokensOut: 0,
      cacheRead: 0,
      commits: 0,
      pushes: 0,
      errors: 0,
      compactions: 0,
      decisions: 0,
      subagents: 0,
      artifacts: 0,
      tools: {},
    }));

  const files_ = (rel) =>
    ensure(files, rel, () => ({
      path: rel,
      reads: 0,
      writes: 0,
      edits: 0,
      charsAdded: 0,
      charsRemoved: 0,
      sessions: new Set(),
      branches: new Set(),
      firstTs: null,
      lastTs: null,
      touchLocs: [],
    }));

  // Transcript index: each locator points back into the raw JSONL by
  // (transcriptIndex, byteOffset, byteLength) so the UI can seek+read exactly
  // one line to get an event's full text, without copying it into the index.
  const transcriptList = [];
  const transcriptIdx = new Map();
  const tIdxFor = (p) => {
    let i = transcriptIdx.get(p);
    if (i === undefined) {
      i = transcriptList.length;
      transcriptList.push(p);
      transcriptIdx.set(p, i);
    }
    return i;
  };

  for (const { dir, file } of await transcripts()) {
    const tIdx = tIdxFor(file.replace(os.homedir(), '~'));
    let byteOffset = 0;
    const rl = readline.createInterface({
      input: createReadStream(file, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      // locator for THIS line; advance the byte cursor for every line (incl. blanks)
      const loc = [tIdx, byteOffset, Buffer.byteLength(line, 'utf8')];
      byteOffset += loc[2] + 1; // +1 for the '\n'
      if (!line.trim()) continue;
      let o;
      try {
        o = JSON.parse(line);
      } catch {
        continue;
      }
      const id = o.sessionId;
      const ts = o.timestamp ?? null;
      const branch = typeof o.gitBranch === 'string' && o.gitBranch ? o.gitBranch : null;
      const cwd = o.cwd;
      const inRepo = typeof cwd === 'string' && (cwd === repo || cwd.startsWith(repo + '/'));

      // ---- typed event lines (asset records) ----
      if (o.type === 'pr-link' && typeof o.prRepository === 'string' && o.prRepository.endsWith(repoTail.slice(0, -1))) {
        const pr = ensure(prs, o.prNumber, () => ({
          number: o.prNumber,
          url: o.prUrl,
          repo: o.prRepository,
          firstTs: ts,
          lastTs: ts,
          merged: false,
          sessions: new Set(),
          linkLoc: loc,
        }));
        pr.lastTs = ts;
        pr.linkLoc = loc;
        if (id) {
          pr.sessions.add(id);
          sess(id).prs.add(o.prNumber);
        }
        events++;
        continue;
      }
      if (o.type === 'ai-title' && id) {
        sess(id).aiTitle = o.aiTitle;
        continue;
      }
      if (o.type === 'last-prompt' && id && !sess(id).seedPrompt) {
        sess(id).seedPrompt = String(o.lastPrompt ?? '').slice(0, 240);
        continue;
      }
      if (o.type === 'bridge-session' && id) {
        sess(id).bridgeSessionId = o.bridgeSessionId;
        continue;
      }
      if (o.type === 'frame-link') {
        artifacts.push({ session: id, url: o.frameUrl, title: o.title ?? null, path: o.path ?? null });
        if (id) sess(id).artifacts++;
        continue;
      }
      if (o.type === 'system') {
        if (o.subtype === 'compact_boundary' && id) sess(id).compactions++;
        if (o.subtype === 'turn_duration' && typeof o.durationMs === 'number') turnDurations.push(o.durationMs);
        continue;
      }

      // ---- conversation lines ----
      if (!id) continue;
      const s = sess(id);
      s.dir = s.dir ?? dir;
      if (!s.startLoc) s.startLoc = loc;
      if (ts) {
        if (!s.firstTs || ts < s.firstTs) s.firstTs = ts;
        if (!s.lastTs || ts > s.lastTs) s.lastTs = ts;
      }
      if (o.version) s.version = o.version;
      if (branch && inRepo) {
        s.branches.add(branch);
        const b = ensure(branches, branch, () => ({
          name: branch,
          sessions: new Set(),
          firstTs: ts,
          lastTs: ts,
          commits: 0,
          pushes: 0,
          files: new Set(),
        }));
        b.sessions.add(id);
        b.lastTs = ts;
      }

      const content = o.message?.content;
      if (o.type === 'user') {
        if (typeof content === 'string' || (Array.isArray(content) && content.some((b) => b.type === 'text')))
          s.userPrompts++;
        if (Array.isArray(content))
          for (const b of content) if (b.type === 'tool_result' && b.is_error) s.errors++;
        continue;
      }
      if (o.type !== 'assistant' || !Array.isArray(content)) continue;
      s.turns++;
      const u = o.message?.usage;
      if (u) {
        s.tokensIn += u.input_tokens ?? 0;
        s.tokensOut += u.output_tokens ?? 0;
        s.cacheRead += u.cache_read_input_tokens ?? 0;
      }

      for (const b of content) {
        if (b.type !== 'tool_use') continue;
        events++;
        s.tools[b.name] = (s.tools[b.name] ?? 0) + 1;
        const fp = b.input?.file_path ?? b.input?.notebook_path;

        if ((b.name === 'Read' || b.name === 'Write' || b.name === 'Edit' || b.name === 'MultiEdit') && typeof fp === 'string') {
          const rel = path.relative(repo, fp);
          if (!rel.startsWith('..') && !path.isAbsolute(rel) && !IGNORE.test(rel)) {
            const f = files_(rel);
            f.sessions.add(id);
            if (branch) f.branches.add(branch);
            if (ts) {
              if (!f.firstTs || ts < f.firstTs) f.firstTs = ts;
              if (!f.lastTs || ts > f.lastTs) f.lastTs = ts;
            }
            s.fileTouches++;
            if (b.name === 'Read') f.reads++;
            else if (b.name === 'Write') {
              f.writes++;
              f.charsAdded += (b.input?.content ?? '').length;
            } else {
              f.edits++;
              const arr = b.name === 'MultiEdit' ? b.input?.edits ?? [] : [b.input ?? {}];
              for (const e of arr) {
                const d = (e.new_string ?? '').length - (e.old_string ?? '').length;
                if (d >= 0) f.charsAdded += d;
                else f.charsRemoved += -d;
              }
            }
            // Locator back to the raw turn that mutated the file (bounded).
            if (b.name !== 'Read' && f.touchLocs.length < 14)
              f.touchLocs.push({ session: id, ts, loc });
            if (branch && inRepo) branches.get(branch)?.files.add(rel);
          }
        } else if (b.name === 'Agent') {
          s.subagents++;
          if (subagents.length < 400)
            subagents.push({ session: id, label: b.input?.description ?? null, type: b.input?.subagent_type ?? null });
        } else if (b.name === 'AskUserQuestion') {
          s.decisions++;
        } else if (b.name === 'Artifact') {
          s.artifacts++;
          artifacts.push({ session: id, title: b.input?.description ?? null, path: b.input?.file_path ?? null, url: null });
        } else if (b.name === 'Bash') {
          const cmd = realCmd(b.input?.command);
          const w = cmd.split(/\s+/);
          if (w[0] === 'git') {
            if (w[1] === 'commit') s.commits++;
            if (w[1] === 'push') s.pushes++;
            if (branch && inRepo) {
              const bb = branches.get(branch);
              if (bb) {
                if (w[1] === 'commit') bb.commits++;
                if (w[1] === 'push') bb.pushes++;
              }
            }
          } else if (w[0] === 'gh' && w[1] === 'pr' && w[2] === 'merge') {
            const n = Number(w[3]);
            if (Number.isFinite(n)) {
              const pr = prs.get(n);
              if (pr) pr.merged = true;
            }
          } else if (w[0] === 'active-work' || w[0] === 'aw') {
            const sub = w[1] === 'task' ? w[2] : w[1];
            const m = cmd.match(TASK_ID);
            if (m) {
              const t = ensure(tasks, m[1], () => ({ id: m[1], sessions: new Set(), actions: {} }));
              t.sessions.add(id);
              t.actions[sub] = (t.actions[sub] ?? 0) + 1;
              s.tasks.add(m[1]);
            }
          }
        } else if (b.name === 'TaskCreate') {
          const subj = b.input?.subject;
          if (subj) {
            const key = 'TC:' + subj.slice(0, 40);
            const t = ensure(tasks, key, () => ({ id: subj.slice(0, 40), sessions: new Set(), actions: {} }));
            t.sessions.add(id);
            t.actions.create = (t.actions.create ?? 0) + 1;
          }
        }
      }
    }
  }

  // co-change for files (within the top set), mutated-together per session
  const perSessionMutations = new Map();
  for (const f of files.values())
    for (const sid of f.sessions) {
      if (f.writes + f.edits === 0) continue;
      ensure(perSessionMutations, sid, () => new Set()).add(f.path);
    }
  const pair = new Map();
  for (const set of perSessionMutations.values()) {
    const arr = [...set];
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++) {
        const k = arr[i] < arr[j] ? arr[i] + ' ' + arr[j] : arr[j] + ' ' + arr[i];
        pair.set(k, (pair.get(k) ?? 0) + 1);
      }
  }

  const fileArr = [...files.values()]
    .map((f) => ({ ...f, touches: f.reads + f.writes + f.edits }))
    .sort((a, b) => b.touches - a.touches)
    .slice(0, topN)
    .map((f) => {
      const co = [];
      for (const [k, c] of pair) {
        const [a, b] = k.split(' ');
        if (a === f.path) co.push({ path: b, count: c });
        else if (b === f.path) co.push({ path: a, count: c });
      }
      co.sort((x, y) => y.count - x.count);
      return {
        path: f.path,
        reads: f.reads,
        writes: f.writes,
        edits: f.edits,
        touches: f.touches,
        sessions: [...f.sessions],
        branches: [...f.branches],
        netGrowth: f.charsAdded - f.charsRemoved,
        firstTouched: f.firstTs,
        lastTouched: f.lastTs,
        coChange: co.slice(0, 6),
        touchLocs: f.touchLocs,
      };
    });

  const ser = (m, fn) => [...m.values()].map(fn);
  const sessionsArr = ser(sessions, (s) => ({
    id: s.id,
    dir: s.dir,
    aiTitle: s.aiTitle,
    seedPrompt: s.seedPrompt,
    bridgeSessionId: s.bridgeSessionId,
    firstTs: s.firstTs,
    lastTs: s.lastTs,
    durationMs: s.firstTs && s.lastTs ? new Date(s.lastTs) - new Date(s.firstTs) : 0,
    turns: s.turns,
    userPrompts: s.userPrompts,
    version: s.version,
    branches: [...s.branches],
    prs: [...s.prs],
    tasks: [...s.tasks],
    fileTouches: s.fileTouches,
    tokensIn: s.tokensIn,
    tokensOut: s.tokensOut,
    cacheRead: s.cacheRead,
    commits: s.commits,
    pushes: s.pushes,
    errors: s.errors,
    compactions: s.compactions,
    decisions: s.decisions,
    subagents: s.subagents,
    artifacts: s.artifacts,
    tools: s.tools,
    startLoc: s.startLoc ?? null,
  }))
    // Repo-relevant only: touched a repo file, a repo PR, or a repo task.
    // (Turns/tokens still reflect the whole session, which may span repos.)
    .filter((s) => s.fileTouches > 0 || s.prs.length > 0 || s.tasks.length > 0)
    .sort((a, b) => String(b.lastTs).localeCompare(String(a.lastTs)));

  const prsArr = ser(prs, (p) => ({
    number: p.number,
    url: p.url,
    repo: p.repo,
    merged: p.merged,
    firstTs: p.firstTs,
    lastTs: p.lastTs,
    sessions: [...p.sessions],
  })).sort((a, b) => b.number - a.number);

  const branchesArr = ser(branches, (b) => ({
    name: b.name,
    sessions: [...b.sessions],
    firstTs: b.firstTs,
    lastTs: b.lastTs,
    commits: b.commits,
    pushes: b.pushes,
    files: b.files.size,
  })).sort((a, b) => b.commits + b.pushes - (a.commits + a.pushes));

  const tasksArr = ser(tasks, (t) => ({ id: t.id, sessions: [...t.sessions], actions: t.actions })).sort(
    (a, b) => b.sessions.length - a.sessions.length,
  );

  turnDurations.sort((a, b) => a - b);
  const pct = (p) => turnDurations[Math.floor((turnDurations.length - 1) * p)] ?? 0;

  const metrics = {
    tokensIn: sessionsArr.reduce((n, s) => n + s.tokensIn, 0),
    tokensOut: sessionsArr.reduce((n, s) => n + s.tokensOut, 0),
    cacheRead: sessionsArr.reduce((n, s) => n + s.cacheRead, 0),
    errors: sessionsArr.reduce((n, s) => n + s.errors, 0),
    decisions: sessionsArr.reduce((n, s) => n + s.decisions, 0),
    compactions: sessionsArr.reduce((n, s) => n + s.compactions, 0),
    commits: sessionsArr.reduce((n, s) => n + s.commits, 0),
    pushes: sessionsArr.reduce((n, s) => n + s.pushes, 0),
    subagents: sessionsArr.reduce((n, s) => n + s.subagents, 0),
    turnDurationMs: { p50: pct(0.5), p85: pct(0.85), p99: pct(0.99), count: turnDurations.length },
  };

  return {
    repo: repoName,
    repoPath: repo,
    transcripts: transcriptList,
    locatorFormat: '[transcriptIndex, byteOffset, byteLength] into transcripts[]; seek+read one JSONL line',
    generatedFrom: { sessions: sessionsArr.length, events },
    sessions: sessionsArr,
    prs: prsArr,
    branches: branchesArr,
    files: fileArr,
    tasks: tasksArr,
    subagents,
    artifacts,
    metrics,
  };
}

function toTs(data) {
  return `// AUTO-GENERATED by tools/mine-session-signals.mjs — deterministic full-signal
// extraction of Claude Code session transcripts, scoped to one repo. Re-run to refresh.
/* eslint-disable */
export const sessionSignals = ${JSON.stringify(data, null, 2)} as const;
export type SessionSignals = typeof sessionSignals;
`;
}

async function main() {
  const { repo, top, out } = parseArgs(process.argv);
  if (!repo) {
    console.error('usage: node mine-session-signals.mjs --repo <absoluteRepoPath> [--top N] [--out file.ts]');
    process.exit(2);
  }
  const data = await mine({ repo, topN: top });
  const outPath = out ?? path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'session-signals.ts');
  await fs.writeFile(outPath, toTs(data), 'utf8');

  const m = data.metrics;
  console.log(`repo: ${data.repo}  (${data.repoPath})`);
  console.log(`sessions: ${data.sessions.length}  events: ${data.generatedFrom.events}`);
  console.log(
    `assets → PRs ${data.prs.length} (merged ${data.prs.filter((p) => p.merged).length}) · ` +
      `branches ${data.branches.length} · files ${data.files.length} · tasks ${data.tasks.length} · ` +
      `subagents ${data.subagents.length} · artifacts ${data.artifacts.length}`,
  );
  console.log(
    `metrics → tokens in/out ${(m.tokensIn / 1e6).toFixed(1)}M/${(m.tokensOut / 1e6).toFixed(1)}M · ` +
      `commits ${m.commits} · pushes ${m.pushes} · errors ${m.errors} · decisions ${m.decisions} · ` +
      `compactions ${m.compactions} · turn p50/p85 ${(m.turnDurationMs.p50 / 1000) | 0}s/${(m.turnDurationMs.p85 / 1000) | 0}s`,
  );
  console.log('\ntop PRs (number · sessions · merged):');
  for (const p of data.prs.slice(0, 6)) console.log(`  #${p.number}  ${p.sessions.length}s  ${p.merged ? 'merged' : 'open'}`);
  console.log('\ntop branches (name · commits+pushes · sessions · files):');
  for (const b of data.branches.slice(0, 6))
    console.log(`  ${b.commits}c ${b.pushes}p  ${b.sessions.length}s  ${b.files}f  ${b.name}`);
  console.log('\ntop sessions (title · turns · files · prs):');
  for (const s of data.sessions.slice(0, 6))
    console.log(`  ${s.turns}t ${s.fileTouches}f pr[${s.prs.join(',')}]  ${(s.aiTitle ?? s.id).slice(0, 60)}`);
  console.log(`\nwrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
