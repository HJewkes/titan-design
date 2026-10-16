#!/usr/bin/env node
// PostToolUse hook: lint the edited file under packages/ui/src and return errors to the agent (exit 2).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const uiDir = join(root, "packages", "ui");

function editedFile() {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    return input?.tool_input?.file_path ?? null;
  } catch {
    return null;
  }
}

function isLintTarget(file) {
  if (typeof file !== "string" || !/\.tsx?$/.test(file)) return false;
  const rel = relative(join(uiDir, "src"), resolve(root, file));
  return (
    rel !== "" &&
    !rel.startsWith("..") &&
    !rel.startsWith(sep) &&
    existsSync(resolve(root, file))
  );
}

const file = editedFile();
if (!isLintTarget(file)) process.exit(0);

const eslint = join(uiDir, "node_modules", ".bin", "eslint");
if (!existsSync(eslint)) {
  process.stderr.write("post-edit-eslint: eslint not installed, skipping\n");
  process.exit(0);
}

const result = spawnSync(
  eslint,
  ["--quiet", "--no-warn-ignored", resolve(root, file)],
  {
    cwd: uiDir,
    encoding: "utf8",
  },
);

if (result.status === 1) {
  process.stderr.write(result.stdout + result.stderr);
  process.exit(2);
}
if (result.status !== 0) {
  process.stderr.write("post-edit-eslint: eslint could not run, skipping\n");
}
process.exit(0);
