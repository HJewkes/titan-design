/* eslint-disable no-undef -- Node ESM build tool */
/**
 * Shared output policy for the exporters: write to a gitignored directory by default,
 * and refuse any in-repo target git does not report as ignored (fail closed).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_OUT_DIR = path.join(TOOLS_DIR, '..', '.private-out');

export function defaultOutPath(fileName) {
  return path.join(DEFAULT_OUT_DIR, fileName);
}

function nearestExisting(dir) {
  let current = dir;
  while (!existsSync(current)) current = path.dirname(current);
  return current;
}

function git(cwd, args) {
  return spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
}

function refuse(reason, target) {
  throw new Error(`refusing to write ${target}: ${reason}`);
}

function assertIgnoredOrOutsideRepo(realTarget, existingParent) {
  const probe = git(existingParent, ['check-ignore', '-q', '--', realTarget]);
  if (probe.error) refuse('git is unavailable', realTarget);
  if (probe.status === 0) return;
  if (probe.status === 1) refuse('git does not ignore it; use a gitignored path', realTarget);
  if (probe.status === 128 && /not a git repository/i.test(probe.stderr)) return;
  refuse('git check-ignore failed', realTarget);
}

/** Returns the resolved path, creating its directory, or throws if the write could reach a committable file. */
export function prepareOutPath(target) {
  const abs = path.resolve(target);
  if (existsSync(abs) && lstatSync(abs).isSymbolicLink()) refuse('target is a symlink', abs);
  const parent = nearestExisting(path.dirname(abs));
  const realTarget = path.join(realpathSync(parent), path.relative(parent, abs));
  assertIgnoredOrOutsideRepo(realTarget, realpathSync(parent));
  mkdirSync(path.dirname(realTarget), { recursive: true });
  return realTarget;
}

export function runMain(run) {
  return run().catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
