import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

const readJson = (file: string) => JSON.parse(readFileSync(path.join(REPO_ROOT, file), 'utf8'))

/** Task names of every `turbo run <a> <b> --flag -- args` invocation in a script value. */
function turboTasks(script: string): string[] {
  return script.split(/&&|\|\||;|\|/).flatMap((command) => {
    const match = command.match(/\bturbo\s+run\s+(.*)$/)
    if (!match) return []
    const tasks: string[] = []
    for (const token of match[1].trim().split(/\s+/)) {
      if (token.startsWith('-')) break
      tasks.push(token)
    }
    return tasks
  })
}

function declaredTasks(): Set<string> {
  const names = Object.keys(readJson('turbo.json').tasks as Record<string, unknown>)
  return new Set(names.map((name) => name.slice(name.indexOf('#') + 1)))
}

describe('root turbo scripts', () => {
  it('extracts tasks from chained commands, flags and several tasks', () => {
    expect(
      turboTasks('pnpm lint && turbo run test:unit -- --run && turbo run a b --force')
    ).toEqual(['test:unit', 'a', 'b'])
    expect(turboTasks('node scripts/review.mjs')).toEqual([])
  })

  it('has a turbo.json task for every `turbo run <task>` script', () => {
    const scripts = readJson('package.json').scripts as Record<string, string>
    const declared = declaredTasks()
    const missing = Object.entries(scripts).flatMap(([script, value]) =>
      turboTasks(value)
        .filter((task) => !declared.has(task))
        .map(
          (task) =>
            `script "${script}" runs turbo task "${task}": add a \`${task}\` entry under tasks in turbo.json`
        )
    )
    expect(missing).toEqual([])
  })
})
