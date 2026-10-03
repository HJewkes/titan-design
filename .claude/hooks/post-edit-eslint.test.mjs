// Run with: node --test .claude/hooks/post-edit-eslint.test.mjs
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hook = join(here, "post-edit-eslint.mjs");
const fixtureDir = resolve(
  here,
  "..",
  "..",
  "packages",
  "ui",
  "src",
  "__hook_fixtures__",
);

const run = (filePath) =>
  spawnSync(hook, {
    input: JSON.stringify({ tool_input: { file_path: filePath } }),
    encoding: "utf8",
  });

describe("post-edit-eslint hook", () => {
  before(() => {
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(join(fixtureDir, "clean.ts"), "export const answer = 42\n");
    writeFileSync(
      join(fixtureDir, "broken.ts"),
      "debugger\nexport const answer = 42\n",
    );
    writeFileSync(join(fixtureDir, "notes.md"), "debugger\n");
  });
  after(() => rmSync(fixtureDir, { recursive: true, force: true }));

  it("exits 0 silently for a path outside packages/ui/src", () => {
    const result = run(join(here, "post-edit-eslint.mjs"));
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
  });

  it("exits 0 silently for a non-TypeScript file inside src", () => {
    const result = run(join(fixtureDir, "notes.md"));
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
  });

  it("exits 0 silently when stdin is not hook JSON", () => {
    const result = spawnSync(hook, { input: "not json", encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
  });

  it("exits 0 silently for a clean file", () => {
    const result = run(join(fixtureDir, "clean.ts"));
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
  });

  it("exits 2 with the eslint error on stderr for a file with an error", () => {
    const result = run(join(fixtureDir, "broken.ts"));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /no-debugger/);
  });
});
