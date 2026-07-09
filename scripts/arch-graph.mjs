#!/usr/bin/env node
/**
 * arch-graph — deterministic component dependency + health graph for the Storybook
 * `Docs/Architecture` page. Drives everything off a codewatch symbol graph (AST, not
 * grep) plus a light import-parse of the consuming apps. Emits a single self-contained
 * JSON the Storybook page imports.
 *
 *   node scripts/arch-graph.mjs            # use existing .codewatch/graph.db (or build it)
 *   node scripts/arch-graph.mjs --reindex  # force a fresh codewatch index first
 *
 * codewatch CLI: set CODEWATCH_CLI (e.g. an absolute dist path) or it falls back to
 * `npx --yes @codewatch/cli`. Consumer projects come from scripts/arch.config.json
 * (see arch.config.example.json); missing ones are skipped, so the script degrades to
 * in-library-only analysis when the sibling repos aren't checked out.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../.."); // repo root (titan-design)
const DB = path.join(ROOT, ".codewatch", "graph.db");
const OUT = path.join(ROOT, "packages/ui/src/arch/arch-graph.json");
const CW = process.env.CODEWATCH_CLI || "npx --yes @codewatch/cli";
const sh = (cmd) =>
  execSync(cmd, {
    cwd: ROOT,
    encoding: "utf8",
    shell: "/bin/bash",
    stdio: ["pipe", "pipe", "inherit"],
  });

// ---- codewatch index -------------------------------------------------------
// codewatch indexes incrementally and appends a snapshot; nodes for files deleted
// since a prior index linger. Build into a FRESH db so there is exactly one snapshot.
if (process.argv.includes("--reindex") || !fs.existsSync(DB)) {
  console.error("· indexing packages/ui with codewatch (fresh) …");
  fs.rmSync(path.dirname(DB), { recursive: true, force: true });
  sh(
    `${CW} graph index packages/ui --ts-config packages/ui/tsconfig.json --no-churn`,
  );
}

// ---- sql helper (write to tempfile to dodge shell-escaping of newlines) -----
function q(sql) {
  const f = path.join(os.tmpdir(), `arch-${Math.abs(hash(sql))}.sql`);
  fs.writeFileSync(f, sql);
  const out = sh(`sqlite3 -json "${DB}" < "${f}"`);
  fs.rmSync(f, { force: true });
  return out.trim() ? JSON.parse(out) : [];
}
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
const base = (p) => p.split("/").pop().replace(".tsx", "");

// ---- 1. component files + tier dir + in-library dependents -----------------
const COMP_PRED = `kind='file' AND id LIKE 'packages/ui/src/components/%.tsx'
  AND id NOT LIKE '%.stories.tsx' AND id NOT LIKE '%.test.tsx' AND id NOT LIKE '%.render.test.tsx'`;

const files = q(`SELECT id FROM node WHERE ${COMP_PRED} ORDER BY id;`)
  .map((r) => r.id)
  .filter((id) => fs.existsSync(path.join(ROOT, id))); // guard against stale-snapshot ghosts

const dependents = q(`
  WITH refs AS (
    SELECT DISTINCT e.src_id AS ref_file, d.parent_id AS comp_file
    FROM edge e JOIN node d ON e.dst_id=d.id
    WHERE e.kind='references' AND d.kind='symbol'
  )
  SELECT c.id AS comp_file,
    COALESCE(SUM(CASE WHEN r.ref_file NOT LIKE '%.stories.tsx' AND r.ref_file NOT LIKE '%.test.tsx' AND r.ref_file<>c.id THEN 1 ELSE 0 END),0) AS prod,
    COALESCE(SUM(CASE WHEN r.ref_file LIKE '%.stories.tsx' THEN 1 ELSE 0 END),0) AS story
  FROM node c LEFT JOIN refs r ON r.comp_file=c.id
  WHERE ${COMP_PRED}
  GROUP BY c.id;`);
const depBy = Object.fromEntries(dependents.map((r) => [r.comp_file, r]));

// symbols defined per file (names) — used to join cross-project usage by real export name
const syms = q(
  `SELECT parent_id AS file, name FROM node WHERE kind='symbol' AND parent_id IN (SELECT id FROM node WHERE ${COMP_PRED});`,
);
const symsBy = {};
for (const s of syms) (symsBy[s.file] ||= []).push(s.name);

// internal component -> component edges
const edgeRows = q(`
  WITH comp AS (SELECT id FROM node WHERE ${COMP_PRED})
  SELECT DISTINCT e.src_id AS src, d.parent_id AS dst
  FROM edge e JOIN node d ON e.dst_id=d.id
  WHERE e.kind='references' AND d.kind='symbol'
    AND e.src_id IN (SELECT id FROM comp) AND d.parent_id IN (SELECT id FROM comp) AND e.src_id<>d.parent_id;`);
const edges = edgeRows
  .map((r) => [base(r.src), base(r.dst)])
  .filter(([a, b]) => a !== b);

// ---- 2. consumer projects: cross-project usage + primitive substitution -----
const cfgPath = path.join(ROOT, "scripts/arch.config.json");
const CONSUMERS = fs.existsSync(cfgPath)
  ? JSON.parse(fs.readFileSync(cfgPath, "utf8")).consumers
  : [
      { name: "mobile", path: "../voltras/mobile/src", kind: "native" },
      { name: "mcp", path: "../voltras-mcp/src", kind: "web" },
      { name: "dash", path: "../codewatch/dashboard/src", kind: "web" },
    ];

const TITAN_IMPORT =
  /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]@titan-design\/react-ui['"]/g;
const RN_IMPORT =
  /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]react-native['"]/g;
const namesFrom = (src, re) => {
  const set = new Set();
  let m;
  while ((m = re.exec(src)))
    for (let n of m[1].split(",")) {
      n = n
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0]
        .trim();
      if (n) set.add(n);
    }
  return set;
};
const listFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return sh(
    `grep -rlE "@titan-design/react-ui|react-native" "${dir}" 2>/dev/null || true`,
  )
    .trim()
    .split("\n")
    .filter((f) => f && /\.(t|j)sx?$/.test(f) && !/\.(test|stories)\./.test(f));
};

// raw primitives a titan atom already covers → what they should map to
const PRIMS = {
  Text: "Typography",
  View: "Surface/Stack",
  TouchableOpacity: "Button",
  Pressable: "Button",
  TextInput: "Input",
  ActivityIndicator: "Spinner",
  Switch: "Switch",
  Modal: "Modal",
};

const xprojBySymbol = {}; // symbolName -> {consumer: count}
const substitution = { "library(titan)": primTally() };
function primTally() {
  return Object.fromEntries(Object.keys(PRIMS).map((k) => [k, 0]));
}

for (const c of CONSUMERS) {
  const dir = path.resolve(ROOT, c.path);
  substitution[c.name] = primTally();
  for (const f of listFiles(dir)) {
    const src = fs.readFileSync(f, "utf8");
    for (const nm of namesFrom(src, TITAN_IMPORT)) {
      xprojBySymbol[nm] = xprojBySymbol[nm] || {};
      xprojBySymbol[nm][c.name] = (xprojBySymbol[nm][c.name] || 0) + 1;
    }
    const rn = namesFrom(src, RN_IMPORT);
    for (const k of Object.keys(PRIMS))
      if (rn.has(k)) substitution[c.name][k]++;
  }
}
// library self-substitution (component files importing raw RN primitives)
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  const rn = namesFrom(src, RN_IMPORT);
  for (const k of Object.keys(PRIMS))
    if (rn.has(k)) substitution["library(titan)"][k]++;
}

// ---- 3. per-component inline-primitive density (extraction / token leaks) ---
const count = (s, re) => (s.match(re) || []).length;
function leakOf(file) {
  const s = fs.readFileSync(path.join(ROOT, file), "utf8");
  const rawView = count(s, /<View[\s>]/g);
  const rawText = count(s, /<Text[\s>]/g);
  const inlineStyle = count(s, /style=\{\{/g);
  const rawHex = count(s, /['"]#[0-9a-fA-F]{3,8}['"]/g);
  return {
    rawView,
    rawText,
    inlineStyle,
    rawHex,
    loc: s.split("\n").length,
    score: rawView + rawText + inlineStyle * 2 + rawHex,
  };
}

// ---- 4. assemble components -------------------------------------------------
const dirOf = (p) =>
  p.includes("/components/ui/")
    ? "ui"
    : p.includes("/components/shell/")
      ? "shell"
      : p.includes("/custom/Workout/")
        ? "workout"
        : "custom";
const outEdges = {}; // name -> Set(deps)
for (const [a, b] of edges) (outEdges[a] ||= new Set()).add(b);

const xprojFor = (file) => {
  const acc = { mobile: 0, mcp: 0, dash: 0 };
  for (const nm of symsBy[file] || []) {
    const hit = xprojBySymbol[nm];
    if (hit) for (const k of Object.keys(acc)) acc[k] += hit[k] || 0;
  }
  return { ...acc, total: acc.mobile + acc.mcp + acc.dash };
};

let comps = files.map((file) => {
  const name = base(file);
  const dep = depBy[file] || { prod: 0, story: 0 };
  return {
    name,
    file,
    dir: dirOf(file),
    exports: symsBy[file] || [],
    libDependents: dep.prod,
    storyRefs: dep.story,
    xproj: xprojFor(file),
    dependsOn: [...(outEdges[name] || [])].sort(),
    leak: leakOf(file),
  };
});
// collapse duplicate leaf names (e.g. two `icons.tsx`) by file — keep as-is but tag
const seen = new Map();
for (const c of comps) seen.set(c.name, (seen.get(c.name) || 0) + 1);

// ---- 5. tier by DAG depth (leaves=atom, deepest=organism) -------------------
const byName = Object.fromEntries(comps.map((c) => [c.name, c]));
const depthMemo = {};
function depth(name, stack = new Set()) {
  if (depthMemo[name] != null) return depthMemo[name];
  if (stack.has(name)) return 0; // cycle guard
  stack.add(name);
  const deps = (byName[name]?.dependsOn || []).filter((d) => byName[d]);
  const d = deps.length ? 1 + Math.max(...deps.map((x) => depth(x, stack))) : 0;
  stack.delete(name);
  return (depthMemo[name] = d);
}
const tierOf = (c) => {
  if (/Page$/.test(c.name)) return "page";
  const d = depth(c.name);
  return d === 0 ? "atom" : d === 1 ? "molecule" : "organism";
};

// ---- 6. verdict -------------------------------------------------------------
const THROWAWAY = new Set(["setHeadingKit", "icons"]);
function verdict(c) {
  if (THROWAWAY.has(c.name)) return "remove";
  const used = c.libDependents > 0;
  const x = c.xproj.total > 0;
  if (/Page$/.test(c.name)) return x ? "keep-page" : "demo-only";
  if (used && x) return "keep-core";
  if (used && !x) return "keep-internal";
  if (!used && x) return "keep-app";
  return "dead";
}
comps = comps.map((c) => ({ ...c, tier: tierOf(c), verdict: verdict(c) }));

// ---- 7. emit ----------------------------------------------------------------
const summary = {
  total: comps.length,
  dead: comps
    .filter((c) => c.verdict === "dead")
    .map((c) => c.name)
    .sort(),
  extractionTop: [...comps]
    .sort((a, b) => b.leak.score - a.leak.score)
    .slice(0, 15)
    .map((c) => ({ name: c.name, tier: c.tier, ...c.leak })),
  substitution,
  consumers: CONSUMERS.map((c) => ({
    name: c.name,
    present: fs.existsSync(path.resolve(ROOT, c.path)),
  })),
};
const payload = {
  schema: 1,
  components: comps.sort((a, b) => a.name.localeCompare(b.name)),
  edges,
  summary,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.error(
  `✓ ${comps.length} components, ${edges.length} edges → ${path.relative(ROOT, OUT)}`,
);
console.error(
  `  dead-everywhere: ${summary.dead.length}  ·  consumers present: ${
    summary.consumers
      .filter((c) => c.present)
      .map((c) => c.name)
      .join(", ") || "none"
  }`,
);
